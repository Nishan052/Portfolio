#!/usr/bin/env node
/**
 * ingest.js — full knowledge-base rebuild.
 *
 * Use this to seed an empty index or to rebuild everything from scratch, e.g.
 * after changing the chunking strategy, the enrichment prompt, or the embedding
 * model. For the routine "a new blog was published" case use scripts/sync-kb.js,
 * which only touches what actually changed.
 *
 * Sources, chunking and embedding all come from the shared modules so that a
 * rebuild and an incremental sync can never produce different ids or text:
 *   scripts/lib/sources.js    what belongs in the KB
 *   scripts/lib/vectorize.js  chunk -> enrich -> embed -> upsert
 *
 * Providers (set in .env.local):
 *   EMBED_PROVIDER=ollama     (default) — Ollama bge-base-en-v1.5, no rate limits
 *   EMBED_PROVIDER=cloudflare           — Cloudflare Workers AI REST API
 *
 *   ENRICH_PROVIDER=ollama   (default) — Ollama llama3.2, no rate limits
 *   ENRICH_PROVIDER=groq               — Groq API
 *
 * IMPORTANT: bge-base-en-v1.5 is the same underlying model in both Ollama and
 * Cloudflare Workers AI. Vectors are fully compatible across providers.
 *
 * Ollama prerequisites:
 *   ollama pull bge-base-en-v1.5   # embedding model
 *   ollama pull llama3.2           # enrichment model (or any capable model)
 *
 * Required env vars:
 *   Always:    PINECONE_API_KEY, PINECONE_HOST
 *   Ollama:    OLLAMA_BASE_URL (default http://localhost:11434)
 *   Cloudflare embed: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN
 *   Groq enrich:      GROQ_API_KEY
 *
 * Usage:
 *   node scripts/ingest.js                          # skips if vectors already exist
 *   node scripts/ingest.js --force                  # clears index and re-ingests everything
 *   node scripts/ingest.js --only=blogs             # one group: pdfs | blogs | json
 *   node scripts/ingest.js --source=blog_my-post    # specific source ids
 *
 * Legacy aliases for --source (still supported):
 *   --blog-slugs=my-post,other   ->  --source=blog_my-post,blog_other
 *   --pdf-files=Report.pdf       ->  --source=pdf_report
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.dev.vars' });

const { Pinecone } = require('@pinecone-database/pinecone');
const { loadAllSources, SOURCE_GROUPS } = require('./lib/sources');
const { vectorizeSource, upsertBatched, checkOllama, validateProviders,
        EMBED_PROVIDER, ENRICH_PROVIDER, OLLAMA_BASE, OLLAMA_EMBED_MODEL, OLLAMA_LLM } = require('./lib/vectorize');

// ─── Config ───────────────────────────────────────────────────────────────────
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_HOST    = process.env.PINECONE_HOST;
const PINECONE_INDEX   = process.env.PINECONE_INDEX || 'portfolio-rag';

const argv = process.argv.slice(2);
const val  = (f, d) => {
  const a = argv.find(x => x.startsWith(`${f}=`));
  return a ? a.slice(f.length + 1) : d;
};
const list = (f) => {
  const v = val(f, null);
  return v ? v.split(',').map(s => s.trim()).filter(Boolean) : null;
};

const FORCE       = argv.includes('--force');
const CLEAR_FIRST = argv.includes('--clear') || FORCE;
const ONLY        = list('--only');

// Legacy flags, superseded by --source. Kept working so existing habits and any
// local scripts don't break. Note --pdf-files never actually worked before: it
// filtered on a metadata key (`file`) that the PDF loader never set (`filename`),
// so every PDF was silently skipped. Mapping to source ids fixes that.
const LEGACY_BLOGS = list('--blog-slugs');
const LEGACY_PDFS  = list('--pdf-files');
const SOURCES = [
  ...(list('--source') || []),
  ...(LEGACY_BLOGS || []).map(slug => `blog_${slug}`),
  ...(LEGACY_PDFS  || []).map(f => `pdf_${f.replace(/\.pdf$/i, '').replace(/\s+/g, '_').toLowerCase()}`),
];
const SOURCE_FILTER = SOURCES.length ? SOURCES : null;
// A scoped run must never clear the whole index or trip the "already populated" guard.
const PARTIAL     = Boolean(ONLY || SOURCE_FILTER);

// ─── Validate ─────────────────────────────────────────────────────────────────
if (!PINECONE_API_KEY) {
  console.error('[ERROR] PINECONE_API_KEY not set.');
  process.exit(1);
}
if (!PINECONE_HOST) {
  console.error('[ERROR] PINECONE_HOST not set.');
  process.exit(1);
}
if (ONLY && ONLY.some(g => !SOURCE_GROUPS.includes(g))) {
  console.error(`[ERROR] --only accepts: ${SOURCE_GROUPS.join(', ')}`);
  process.exit(1);
}
validateProviders();

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\nPortfolio RAG Ingestion Pipeline (full rebuild)\n');
  console.log(`  Embed provider:  ${EMBED_PROVIDER}  (${EMBED_PROVIDER === 'ollama' ? `ollama ${OLLAMA_BASE} model=${OLLAMA_EMBED_MODEL}` : 'Cloudflare Workers AI'})`);
  console.log(`  Enrich provider: ${ENRICH_PROVIDER}  (${ENRICH_PROVIDER === 'ollama' ? `ollama ${OLLAMA_BASE} model=${OLLAMA_LLM}` : 'Groq'})`);
  console.log(`  Force re-ingest: ${FORCE}`);
  if (ONLY)          console.log(`  Only groups:     ${ONLY.join(', ')}`);
  if (SOURCE_FILTER) console.log(`  Only sources:    ${SOURCE_FILTER.join(', ')}`);
  console.log('');

  // Verify Ollama is reachable and required models are pulled
  await checkOllama();

  // Connect to Pinecone
  const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
  const index = pc.index(PINECONE_INDEX, PINECONE_HOST);
  console.log(`[OK] Connected to Pinecone index: ${PINECONE_INDEX}`);

  // Skip guard — a full rebuild over a populated index is almost always a mistake.
  if (!PARTIAL) {
    const stats = await index.describeIndexStats();
    const existing = stats.totalRecordCount ?? 0;
    if (existing > 0 && !FORCE) {
      console.log(`\nPinecone already has ${existing} vectors.`);
      console.log('To add only what changed, run:  npm run kb:sync');
      console.log('To rebuild everything from scratch, re-run with --force.\n');
      process.exit(0);
    }
  }

  if (CLEAR_FIRST && !PARTIAL) {
    console.log('\nClearing existing vectors...');
    try {
      await index.deleteAll();
      console.log('[OK] Cleared all vectors');
    } catch (err) {
      if (err.status === 404 || (err.message && err.message.includes('404'))) {
        console.log('[OK] Namespace already empty');
      } else {
        throw err;
      }
    }
  }

  // ── Load every source ──────────────────────────────────────────────────────
  console.log('\nLoading sources...');
  const sources = await loadAllSources({ only: ONLY, sources: SOURCE_FILTER });
  console.log(`[OK] ${sources.length} sources`);

  if (sources.length === 0) {
    console.warn('[WARN] No sources matched — nothing to ingest.');
    return;
  }

  // ── Chunk, enrich, embed ───────────────────────────────────────────────────
  const allVectors = [];
  for (const source of sources) {
    console.log(`\n  Processing: ${source.id}`);
    allVectors.push(...await vectorizeSource(source));
  }

  // ── Upsert all to Pinecone ─────────────────────────────────────────────────
  console.log(`\nUpserting ${allVectors.length} vectors to Pinecone...`);
  await upsertBatched(index, allVectors);

  console.log('\n[OK] Ingestion complete!');
  console.log(`     Total vectors: ${allVectors.length}`);
  console.log(`     Verify at: https://app.pinecone.io\n`);
}

main().catch(err => {
  console.error('\n[ERROR] Ingestion failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
