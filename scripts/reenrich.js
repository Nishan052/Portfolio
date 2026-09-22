#!/usr/bin/env node
/**
 * reenrich.js — enrich the chunks that went into the index without context.
 *
 *   node scripts/reenrich.js --dry-run     # count, match, change nothing
 *   node scripts/reenrich.js               # enrich, embed, upsert
 *
 * The sync's enrichment model was retired from Groq and returned 404. A silent
 * fallback indexed those chunks as bare text with no context, key points or key
 * terms, and every run reported success. This finds them by that signature and
 * fixes only them.
 *
 * Enrichment runs on the local model (ENRICH_PROVIDER=ollama), so it costs no
 * Groq budget. Embedding must stay on Cloudflare's bge-base-en-v1.5, the model
 * the live chatbot searches with; a different embedding model would put vectors
 * in the index that no query can find.
 *
 * Safe to stop and rerun: each chunk is upserted as soon as it is done, and a
 * rerun only sees what is still bare. A chunk whose stored text no longer
 * matches the repo is skipped, because the next sync replaces it anyway.
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.dev.vars' });
process.env.EMBED_PROVIDER = 'cloudflare';

const { Pinecone }                = require('@pinecone-database/pinecone');
const { loadAllSources }          = require('./lib/sources');
const { chunkText }               = require('./lib/chunk');
const { generateContextualChunk } = require('./lib/contextual');
const { embedText, ENRICH_PROVIDER } = require('./lib/vectorize');

const DRY = process.argv.includes('--dry-run');
const isBare = m => !(m.keyPoints || []).length && !(m.keyTerms || []).length;

async function main() {
  const index = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    .index(process.env.PINECONE_INDEX || 'portfolio', process.env.PINECONE_HOST);

  // Every vector id, then its metadata, to find the bare ones.
  const ids = [];
  let token;
  do {
    const page = await index.listPaginated({ paginationToken: token, limit: 100 });
    ids.push(...(page.vectors || []).map(v => v.id));
    token = page.pagination?.next;
  } while (token);

  const bare = [];
  for (let i = 0; i < ids.length; i += 100) {
    const { records } = await index.fetch({ ids: ids.slice(i, i + 100) });
    for (const r of Object.values(records)) if (isBare(r.metadata || {})) bare.push(r);
  }

  const sources = new Map((await loadAllSources({ only: ['blogs', 'json'] })).map(s => [s.id, s]));
  const chunked = new Map();
  const plan = [];
  let stale = 0;
  for (const r of bare) {
    const src = sources.get(r.metadata.source);
    if (!src) { stale++; continue; }
    if (!chunked.has(src.id)) chunked.set(src.id, chunkText(src.text));
    const chunk = chunked.get(src.id)[r.metadata.chunkIndex];
    if (!chunk || chunk.text !== r.metadata.text) { stale++; continue; }
    plan.push({ record: r, source: src, chunk });
  }

  console.log(`${ids.length} vectors, ${bare.length} without enrichment`);
  console.log(`${plan.length} match the repo and will be enriched, ${stale} skipped as stale or missing`);
  console.log(`enrichment: ${ENRICH_PROVIDER} ${process.env.OLLAMA_LLM_MODEL || ''}   embedding: cloudflare bge-base-en-v1.5\n`);
  if (DRY || !plan.length) return;

  let done = 0, failed = 0, suspect = 0;
  const t0 = Date.now();
  for (const { record, source, chunk } of plan) {
    const n = done + failed + 1;
    const enriched = await generateContextualChunk(source.text, chunk);
    if (isBare(enriched)) {
      failed++;
      console.log(`  [${n}/${plan.length}] FAILED  ${record.id}`);
      continue;
    }
    // A small model occasionally writes that the subject "is not mentioned".
    // That sentence would be embedded and searched, so flag it for a look.
    if (/not mentioned|no (information|mention)|does not (mention|refer)/i.test(enriched.contextualText)) suspect++;

    const values = await embedText(enriched.contextualText);
    await index.upsert({ records: [{
      id: record.id,
      values,
      metadata: {
        ...record.metadata,
        keyPoints:  enriched.keyPoints,
        keyTerms:   enriched.keyTerms,
        enrichedAt: new Date().toISOString(),
      },
    }] });
    done++;
    const mins = (Date.now() - t0) / 60000;
    console.log(`  [${n}/${plan.length}] ok  ${record.id}   ${(mins / n * (plan.length - n)).toFixed(0)} min left`);
  }
  console.log(`\nenriched ${done}, failed ${failed}, flagged for a look ${suspect}`);
  if (failed) console.log('Rerun to retry the failed ones; only bare chunks are picked up.');
}

main().catch(err => { console.error('[ERROR]', err.message); process.exit(1); });
