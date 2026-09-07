#!/usr/bin/env node
/**
 * sync-kb.js — incremental knowledge-base sync.
 *
 * Reconciles Pinecone against the repo. It does NOT look at git history: it
 * compares what the repo currently contains against what the index currently
 * holds, and closes the gap. That means a missed or failed run is self-healing —
 * the next run simply notices the content is absent and indexes it.
 *
 * State lives in Pinecone, not in a committed manifest: every vector carries a
 * `contentHash` of its source text, so CI never has to write back to the repo.
 *
 * Per run, each source is one of:
 *   new       -> embed and upsert
 *   changed   -> re-embed, upsert, delete chunks left over from a shorter version
 *   adopt     -> indexed before hashing existed; stamp the hash on via a
 *                metadata-only update (no LLM calls, no embeddings, no cost)
 *   unchanged -> skipped entirely
 *   orphan    -> source file is gone; its vectors are deleted (unless --no-prune)
 *
 * Usage:
 *   node scripts/sync-kb.js                      # sync everything
 *   node scripts/sync-kb.js --dry-run            # report the plan, change nothing
 *   node scripts/sync-kb.js --only=blogs         # blogs only (also: pdfs, json)
 *   node scripts/sync-kb.js --source=blog_my-post
 *   node scripts/sync-kb.js --no-prune           # never delete
 *   node scripts/sync-kb.js --reingest-unhashed  # re-embed pre-hash vectors
 *   node scripts/sync-kb.js --max-prune-pct=20   # deletion safety cap
 *   node scripts/sync-kb.js --json-report=kb.json
 *
 * Env: see scripts/ingest.js header. CI uses EMBED_PROVIDER=cloudflare and
 * ENRICH_PROVIDER=groq; locally the Ollama defaults are free.
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.dev.vars' });

const fs   = require('fs');
const { Pinecone } = require('@pinecone-database/pinecone');

const { loadAllSources, SOURCE_GROUPS } = require('./lib/sources');
const { vectorizeSource, upsertBatched, checkOllama, validateProviders, sleep,
        EMBED_PROVIDER, ENRICH_PROVIDER } = require('./lib/vectorize');
const { groupBySource, diffKb, staleChunkIds, checkPruneCap } = require('./lib/kb-diff');

// ─── Flags ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const has  = f => argv.includes(f);
const val  = (f, d) => {
  const a = argv.find(x => x.startsWith(`${f}=`));
  return a ? a.slice(f.length + 1) : d;
};
const list = (f) => {
  const v = val(f, null);
  return v ? v.split(',').map(s => s.trim()).filter(Boolean) : null;
};

const DRY_RUN          = has('--dry-run');
const PRUNE            = !has('--no-prune');
const REINGEST_UNHASHED= has('--reingest-unhashed');
const ONLY             = list('--only');
const SOURCES          = list('--source');
const MAX_PRUNE_PCT    = parseFloat(val('--max-prune-pct', '20'));
const JSON_REPORT      = val('--json-report', null);

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_HOST    = process.env.PINECONE_HOST;
const PINECONE_INDEX   = process.env.PINECONE_INDEX || 'portfolio-rag';

if (!PINECONE_API_KEY || !PINECONE_HOST) {
  console.error('[ERROR] PINECONE_API_KEY and PINECONE_HOST must be set.');
  process.exit(1);
}
if (ONLY && ONLY.some(g => !SOURCE_GROUPS.includes(g))) {
  console.error(`[ERROR] --only accepts: ${SOURCE_GROUPS.join(', ')}`);
  process.exit(1);
}

// ─── Read current index state ────────────────────────────────────────────────
// Pinecone is the source of truth for "what is already indexed".
async function readCurrentState(index) {
  let paginationToken;
  const ids = [];
  do {
    const page = await index.listPaginated({ limit: 100, paginationToken });
    ids.push(...(page.vectors || []).map(v => v.id));
    paginationToken = page.pagination?.next;
  } while (paginationToken);

  const bySource = groupBySource(ids);

  // One representative chunk per source carries the hash; fetching chunk 0 of
  // each source is far cheaper than fetching every vector in the index.
  const probeIds = Object.entries(bySource).map(([sourceId, chunks]) => `${sourceId}_${chunks[0]}`);
  const hashes = {};
  for (let i = 0; i < probeIds.length; i += 100) {
    const { records = {} } = await index.fetch({ ids: probeIds.slice(i, i + 100) });
    for (const [id, rec] of Object.entries(records)) {
      const sourceId = id.replace(/_\d+$/, '');
      hashes[sourceId] = rec.metadata?.contentHash || null;
    }
  }

  return { ids, bySource, hashes, totalVectors: ids.length };
}

// Delete in batches — deleteMany has a per-call id limit.
//
// The options-object form matters: passing a bare array is accepted by the SDK
// and resolves without error while deleting nothing at all. Verified after the
// batch by re-fetching, because a silent no-op here means stale content keeps
// being retrieved with no sign anything is wrong.
async function deleteIds(index, ids) {
  if (!ids.length) return;
  for (let i = 0; i < ids.length; i += 100) {
    await index.deleteMany({ ids: ids.slice(i, i + 100) });
  }

  // Pinecone deletes are eventually consistent, so a read straight after the
  // call can still return the records. Poll with backoff and only treat it as a
  // failure if they are still there well past normal replication lag.
  const probe = ids.slice(0, 100);
  let survivors = [];
  for (const waitMs of [0, 1000, 2000, 4000, 8000]) {
    if (waitMs) await sleep(waitMs);
    const { records = {} } = await index.fetch({ ids: probe });
    survivors = Object.keys(records);
    if (survivors.length === 0) return;
  }

  throw new Error(
    `Deletion did not take effect — ${survivors.length} vector(s) still present ` +
    `(e.g. ${survivors[0]}) after retrying. Stale content would remain retrievable, so aborting.`
  );
}

// ─── Reporting ────────────────────────────────────────────────────────────────
function writeJobSummary(report) {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (!path) return;

  const rows = [
    ['Indexed (new)',     report.ingestedNew.length],
    ['Re-indexed (edited)', report.ingestedChanged.length],
    ['Adopted (hash stamped)', report.adopted.length],
    ['Unchanged (skipped)', report.unchanged.length],
    ['Stale chunks removed', report.staleChunksDeleted.length],
    ['Orphan sources pruned', report.orphansPruned.length],
  ];

  const lines = [
    `## Knowledge base sync${report.dryRun ? ' (dry run)' : ''}`,
    '',
    `Vectors: **${report.vectorsBefore}** → **${report.vectorsAfter ?? report.vectorsBefore}**`,
    '',
    '| Outcome | Count |',
    '| --- | ---: |',
    ...rows.map(([k, v]) => `| ${k} | ${v} |`),
    '',
  ];

  const detail = (title, items) => {
    if (!items.length) return;
    lines.push(`### ${title}`, '', ...items.map(i => `- \`${i}\``), '');
  };
  detail('Newly indexed', report.ingestedNew);
  detail('Re-indexed after edit', report.ingestedChanged);
  detail('Pruned', report.orphansPruned);

  fs.appendFileSync(path, lines.join('\n'));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\nPortfolio RAG — Knowledge Base Sync\n');
  console.log(`  Mode:            ${DRY_RUN ? 'DRY RUN (no writes)' : 'live'}`);
  console.log(`  Embed provider:  ${EMBED_PROVIDER}`);
  console.log(`  Enrich provider: ${ENRICH_PROVIDER}`);
  console.log(`  Prune orphans:   ${PRUNE} (cap ${MAX_PRUNE_PCT}%)`);
  if (ONLY)    console.log(`  Only groups:     ${ONLY.join(', ')}`);
  if (SOURCES) console.log(`  Only sources:    ${SOURCES.join(', ')}`);

  validateProviders();
  // Skip the provider preflight on a dry run — it plans, it never embeds.
  if (!DRY_RUN) await checkOllama();

  const pc    = new Pinecone({ apiKey: PINECONE_API_KEY });
  const index = pc.index(PINECONE_INDEX, PINECONE_HOST);
  console.log(`\n[OK] Connected to Pinecone index: ${PINECONE_INDEX}`);

  console.log('\nLoading sources from repo...');
  const desired = await loadAllSources({ only: ONLY, sources: SOURCES });
  console.log(`[OK] ${desired.length} sources in repo`);

  console.log('Reading current index state...');
  const current = await readCurrentState(index);
  console.log(`[OK] ${current.totalVectors} vectors across ${Object.keys(current.bySource).length} sources`);

  // A filtered run must not conclude that everything else is orphaned.
  const filtered = Boolean(ONLY || SOURCES);
  const { toIngest, toAdopt, unchanged, orphanSources } =
    diffKb(desired, current, { reingestUnhashed: REINGEST_UNHASHED, prune: PRUNE && !filtered });

  if (filtered && PRUNE) {
    console.log('[NOTE] Pruning disabled for this run: a filtered scope cannot tell an orphan from an excluded source.');
  }

  console.log('\n── Plan ─────────────────────────────────────────');
  console.log(`  new:       ${toIngest.filter(t => t.reason === 'new').length}`);
  console.log(`  changed:   ${toIngest.filter(t => t.reason === 'changed').length}`);
  if (REINGEST_UNHASHED) console.log(`  unhashed:  ${toIngest.filter(t => t.reason === 'unhashed').length}`);
  console.log(`  adopt:     ${toAdopt.length}`);
  console.log(`  unchanged: ${unchanged.length}`);
  console.log(`  orphans:   ${orphanSources.length}`);
  for (const t of toIngest)      console.log(`    [${t.reason.toUpperCase()}] ${t.source.id}`);
  for (const o of orphanSources) console.log(`    [PRUNE] ${o.id} (${o.chunkIds.length} vectors)`);

  const report = {
    dryRun: DRY_RUN,
    ranAt: new Date().toISOString(),
    vectorsBefore: current.totalVectors,
    vectorsAfter: null,
    ingestedNew:     toIngest.filter(t => t.reason === 'new').map(t => t.source.id),
    ingestedChanged: toIngest.filter(t => t.reason === 'changed').map(t => t.source.id),
    adopted:   toAdopt.map(a => a.source.id),
    unchanged: unchanged.map(s => s.id),
    orphansPruned: [],
    staleChunksDeleted: [],
    errors: [],
  };

  // Check the prune cap before doing any work, so a suspicious run fails fast
  // and cheaply rather than after paying for a full embedding pass.
  const orphanVectorCount = orphanSources.reduce((n, o) => n + o.chunkIds.length, 0);
  const cap = checkPruneCap(orphanVectorCount, current.totalVectors, MAX_PRUNE_PCT);
  if (!cap.ok) {
    console.error(`\n[ERROR] ${cap.message}`);
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] No changes written.\n');
    if (JSON_REPORT) fs.writeFileSync(JSON_REPORT, JSON.stringify(report, null, 2));
    writeJobSummary(report);
    return;
  }

  // ── Adopt: metadata-only updates, no embeddings ────────────────────────────
  if (toAdopt.length) {
    console.log(`\nStamping contentHash on ${toAdopt.length} previously-indexed sources...`);
    for (const { source, chunkIds } of toAdopt) {
      for (const id of chunkIds) {
        await index.update({ id, metadata: { contentHash: source.contentHash, syncedAt: new Date().toISOString() } });
      }
      console.log(`  [ADOPT] ${source.id} (${chunkIds.length} vectors)`);
    }
  }

  // ── Ingest: embed new and changed sources ──────────────────────────────────
  const allStale = [];
  for (const task of toIngest) {
    console.log(`\n[${task.reason.toUpperCase()}] ${task.source.id}`);
    const vectors = await vectorizeSource(task.source);
    await upsertBatched(index, vectors);

    // A shorter rewrite leaves high-index chunks behind; they would keep
    // matching queries with text that is no longer published.
    if (task.existingChunkIds?.length) {
      const stale = staleChunkIds(task.existingChunkIds, vectors.length);
      if (stale.length) {
        console.log(`  Removing ${stale.length} stale chunk(s) from the previous version`);
        await deleteIds(index, stale);
        allStale.push(...stale);
      }
    }
  }
  report.staleChunksDeleted = allStale;

  // ── Prune: sources whose files are gone ────────────────────────────────────
  if (orphanSources.length) {
    console.log(`\nPruning ${orphanSources.length} orphaned source(s) (${orphanVectorCount} vectors)...`);
    for (const orphan of orphanSources) {
      await deleteIds(index, orphan.chunkIds);
      console.log(`  [PRUNED] ${orphan.id} (${orphan.chunkIds.length} vectors)`);
      report.orphansPruned.push(orphan.id);
    }
  }

  const after = await index.describeIndexStats();
  report.vectorsAfter = after.totalRecordCount ?? null;

  console.log('\n[OK] Sync complete.');
  console.log(`     Vectors: ${report.vectorsBefore} → ${report.vectorsAfter}`);
  console.log(`     new ${report.ingestedNew.length} | changed ${report.ingestedChanged.length} | adopted ${report.adopted.length} | unchanged ${report.unchanged.length} | pruned ${report.orphansPruned.length}\n`);

  if (JSON_REPORT) fs.writeFileSync(JSON_REPORT, JSON.stringify(report, null, 2));
  writeJobSummary(report);
}

main().catch(err => {
  console.error('\n[ERROR] Sync failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
