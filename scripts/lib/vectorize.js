/**
 * vectorize.js — the embed-and-upsert engine shared by ingest.js and sync-kb.js.
 *
 * A source becomes vectors in three steps:
 *   1. chunkText()               splits it into semantic paragraphs
 *   2. generateContextualChunk() enriches each chunk with an LLM (context,
 *                                keyPoints, keyTerms)
 *   3. embedText()               embeds the *enriched* text, so the vector
 *                                carries whole-document context, not just the
 *                                chunk in isolation
 *
 * Providers are chosen by env (see scripts/ingest.js header):
 *   EMBED_PROVIDER  = ollama (default, free, local) | cloudflare (used in CI)
 *   ENRICH_PROVIDER = ollama (default)              | groq       (used in CI)
 *
 * bge-base-en-v1.5 is the same model weights in Ollama and Cloudflare Workers AI,
 * so vectors produced by either provider are interchangeable.
 */

const { chunkText }               = require('./chunk');
const { generateContextualChunk } = require('./contextual');

const EMBED_PROVIDER     = (process.env.EMBED_PROVIDER  || 'ollama').toLowerCase();
const ENRICH_PROVIDER    = (process.env.ENRICH_PROVIDER || 'ollama').toLowerCase();
const OLLAMA_BASE        = process.env.OLLAMA_BASE_URL    || 'http://localhost:11434';
const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
const OLLAMA_LLM         = process.env.OLLAMA_LLM_MODEL   || 'llama3.2';
const CF_ACCOUNT_ID      = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN       = process.env.CLOUDFLARE_API_TOKEN;
const CF_EMBED_MODEL     = '@cf/baai/bge-base-en-v1.5';
const BATCH_SIZE         = 100;
// Only relevant when ENRICH_PROVIDER=groq, to stay inside free-tier RPM.
const ENRICH_DELAY_MS    = parseInt(process.env.ENRICH_DELAY_MS || '0', 10);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Embed ────────────────────────────────────────────────────────────────────
async function embedText(text) {
  const input = text.trim().slice(0, 8000);

  if (EMBED_PROVIDER === 'ollama') {
    // Ollama /api/embed (v0.3+) — returns { embeddings: [[...]] }
    const response = await fetch(`${OLLAMA_BASE}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, input: [input] }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Ollama embed ${response.status}: ${await response.text()}`);
    const data = await response.json();
    if (!Array.isArray(data.embeddings?.[0])) throw new Error('Ollama returned no embedding data');
    return data.embeddings[0];
  }

  // EMBED_PROVIDER === 'cloudflare'
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_EMBED_MODEL}`;
  const MAX_EMBED_RETRIES = 4;
  for (let attempt = 1; attempt <= MAX_EMBED_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: [input] }),
        signal: AbortSignal.timeout(45000),
      });
      if (!response.ok) throw new Error(`Cloudflare AI embed ${response.status}: ${await response.text()}`);
      const data = await response.json();
      if (!Array.isArray(data.result?.data?.[0])) throw new Error('Cloudflare AI returned no embedding data');
      return data.result.data[0];
    } catch (err) {
      if (attempt === MAX_EMBED_RETRIES) throw err;
      process.stdout.write(`[retry ${attempt}]... `);
      await sleep(attempt * 3000);
    }
  }
}

// ─── Source -> vectors ───────────────────────────────────────────────────────
// `contentHash` is stamped on every vector so the next sync can tell at a glance
// whether the underlying file has been edited since it was indexed.
async function vectorizeSource(source) {
  const { id: sourceId, type: sourceType, text: fullText, metadata = {}, contentHash } = source;
  const chunks = chunkText(fullText);
  console.log(`  ${chunks.length} chunks`);

  const vectors = [];
  for (const chunk of chunks) {
    process.stdout.write(`    chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks} [${chunk.paragraphType}] enriching... `);

    const enriched = await generateContextualChunk(fullText, chunk);
    process.stdout.write('embedding... ');

    const embedding = await embedText(enriched.contextualText);
    process.stdout.write('[OK]\n');

    vectors.push({
      id: `${sourceId}_${chunk.chunkIndex}`,
      values: embedding,
      metadata: {
        text:          chunk.text,              // original text — shown in RAG context at query time
        keyPoints:     enriched.keyPoints,      // LLM-generated insights — surfaced in RAG context
        keyTerms:      enriched.keyTerms,       // LLM-generated terms
        keywords:      chunk.keywords,          // algorithmic fallback keywords
        paragraphType: chunk.paragraphType,
        source:        sourceId,
        type:          sourceType,
        chunkIndex:    chunk.chunkIndex,
        totalChunks:   chunk.totalChunks,
        timestamp:     new Date().toISOString().split('T')[0],
        ...(contentHash ? { contentHash, syncedAt: new Date().toISOString() } : {}),
        ...metadata,
      }
    });

    // Throttle to respect Groq free-tier rate limits.
    if (chunk.chunkIndex < chunks.length - 1) await sleep(ENRICH_DELAY_MS);
  }

  return vectors;
}

// ─── Batch upsert to Pinecone (with retry) ───────────────────────────────────
async function upsertBatched(index, vectors) {
  const MAX_RETRIES = 4;
  let total = 0;
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch    = vectors.slice(i, i + BATCH_SIZE);
    const batchNum = Math.ceil((i + 1) / BATCH_SIZE);
    let lastErr;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await index.upsert({ records: batch });
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        const delay = 2000 * attempt;
        console.warn(`  [WARN] Batch ${batchNum} attempt ${attempt} failed: ${err.message}`);
        if (attempt < MAX_RETRIES) {
          console.log(`  Retrying in ${delay / 1000}s...`);
          await sleep(delay);
        }
      }
    }
    if (lastErr) throw lastErr;
    total += batch.length;
    console.log(`  Upserted batch ${batchNum} (${total}/${vectors.length} vectors)`);
  }
}

// ─── Ollama preflight ─────────────────────────────────────────────────────────
// Fails fast with an actionable message instead of dying mid-run on chunk 40.
async function checkOllama() {
  if (EMBED_PROVIDER !== 'ollama' && ENRICH_PROVIDER !== 'ollama') return;
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { models = [] } = await r.json();
    const names = models.map(m => m.name);

    if (EMBED_PROVIDER === 'ollama' && !names.some(n => n.includes(OLLAMA_EMBED_MODEL))) {
      console.error(`[ERROR] Embedding model not found in Ollama. Run:\n  ollama pull ${OLLAMA_EMBED_MODEL}`);
      process.exit(1);
    }
    // The chatbot embeds queries with bge-base-en-v1.5 (functions/api/lib/embed.js).
    // Indexing with a different model produces vectors of the right dimension but
    // the wrong geometry — retrieval degrades silently, with nothing to see in logs.
    if (EMBED_PROVIDER === 'ollama' && !/bge-base-en-v1\.5/i.test(OLLAMA_EMBED_MODEL)) {
      console.error(
        `[ERROR] EMBED_PROVIDER=ollama with OLLAMA_EMBED_MODEL="${OLLAMA_EMBED_MODEL}".\n` +
        `        Production queries are embedded with bge-base-en-v1.5, so indexing with a\n` +
        `        different model silently corrupts retrieval. Either:\n` +
        `          ollama pull bge-base-en-v1.5 && export OLLAMA_EMBED_MODEL=bge-base-en-v1.5\n` +
        `        or embed via Cloudflare instead:  EMBED_PROVIDER=cloudflare\n` +
        `        Set ALLOW_EMBED_MODEL_MISMATCH=1 only for a throwaway index.`
      );
      if (process.env.ALLOW_EMBED_MODEL_MISMATCH !== '1') process.exit(1);
    }
    if (ENRICH_PROVIDER === 'ollama' && !names.some(n => n.includes(OLLAMA_LLM))) {
      console.error(`[ERROR] LLM model not found in Ollama. Run:\n  ollama pull ${OLLAMA_LLM}`);
      process.exit(1);
    }
    const embedInfo = EMBED_PROVIDER === 'ollama' ? ` embed: ${OLLAMA_EMBED_MODEL},` : '';
    console.log(`[OK] Ollama running —${embedInfo} llm: ${OLLAMA_LLM}`);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.name === 'TimeoutError' || err.message.includes('fetch')) {
      console.error(`[ERROR] Ollama is not running. Start it with:\n  ollama serve`);
    } else {
      console.error(`[ERROR] Ollama preflight failed: ${err.message}`);
    }
    process.exit(1);
  }
}

// Validate provider credentials up front.
function validateProviders() {
  if (EMBED_PROVIDER === 'cloudflare' && (!CF_ACCOUNT_ID || !CF_API_TOKEN)) {
    console.error('[ERROR] EMBED_PROVIDER=cloudflare requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.');
    process.exit(1);
  }
  if (ENRICH_PROVIDER === 'groq' && !process.env.GROQ_API_KEY) {
    console.error('[ERROR] ENRICH_PROVIDER=groq requires GROQ_API_KEY.');
    process.exit(1);
  }
}

module.exports = {
  embedText, vectorizeSource, upsertBatched, checkOllama, validateProviders, sleep,
  EMBED_PROVIDER, ENRICH_PROVIDER, OLLAMA_BASE, OLLAMA_EMBED_MODEL, OLLAMA_LLM, BATCH_SIZE,
};
