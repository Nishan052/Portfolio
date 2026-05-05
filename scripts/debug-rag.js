#!/usr/bin/env node
/**
 * debug-rag.js — Test the embed → Pinecone query pipeline locally.
 * Shows raw scores so you can see exactly what the chatbot retrieves.
 *
 * Usage:
 *   node scripts/debug-rag.js "Is Nishan good at RAG?"
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.dev.vars' });

const QUERY         = process.argv[2] || 'Is Nishan good at RAG?';
const PINECONE_KEY  = process.env.PINECONE_API_KEY;
const PINECONE_HOST = process.env.PINECONE_HOST;
const CF_ACCOUNT    = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_TOKEN      = process.env.CLOUDFLARE_API_TOKEN;

// Try Ollama embed (same as ingest) first, then fallback to Cloudflare
const EMBED_PROVIDER = (process.env.EMBED_PROVIDER || 'ollama').toLowerCase();
const OLLAMA_BASE    = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL   = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';

async function embed(text) {
  if (EMBED_PROVIDER === 'ollama') {
    console.log(`  [embed] Ollama (${OLLAMA_MODEL})`);
    const res = await fetch(`${OLLAMA_BASE}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, input: [text] }),
    });
    if (!res.ok) throw new Error(`Ollama embed failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.embeddings[0];
  }

  // cloudflare
  console.log(`  [embed] Cloudflare (@cf/nomic-ai/nomic-embed-text-v1.5)`);
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/run/@cf/nomic-ai/nomic-embed-text-v1.5`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CF_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: [text] }),
  });
  if (!res.ok) throw new Error(`CF embed failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.result.data[0];
}

async function queryPinecone(vector) {
  const res = await fetch(`${PINECONE_HOST}/query`, {
    method: 'POST',
    headers: { 'Api-Key': PINECONE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ vector, topK: 10, includeMetadata: true, includeValues: false }),
  });
  if (!res.ok) throw new Error(`Pinecone query failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.matches || [];
}

async function main() {
  console.log(`\n=== RAG Debug ===`);
  console.log(`Query: "${QUERY}"`);
  console.log(`Embed provider: ${EMBED_PROVIDER}\n`);

  if (!PINECONE_KEY || !PINECONE_HOST) {
    console.error('[ERROR] PINECONE_API_KEY or PINECONE_HOST missing from .env.local / .dev.vars');
    process.exit(1);
  }

  // 1. Embed
  let vector;
  try {
    vector = await embed(QUERY);
    console.log(`  [embed] OK — dims: ${vector.length}\n`);
  } catch (err) {
    console.error(`  [embed] FAILED: ${err.message}`);
    process.exit(1);
  }

  // 2. Query Pinecone — show ALL matches regardless of MIN_SCORE
  console.log(`[pinecone] Querying top 10 matches...`);
  let matches;
  try {
    matches = await queryPinecone(vector);
  } catch (err) {
    console.error(`  [pinecone] FAILED: ${err.message}`);
    process.exit(1);
  }

  console.log(`\n[pinecone] ${matches.length} raw matches returned:\n`);
  if (matches.length === 0) {
    console.log('  ⚠️  NO MATCHES — index may be empty or vector dimension mismatch');
  } else {
    matches.forEach((m, i) => {
      const passed = m.score >= 0.40 ? '✅' : '❌';
      console.log(`  ${i + 1}. ${passed} score=${m.score.toFixed(4)}  source=${m.metadata?.source || '?'}  type=${m.metadata?.type || '?'}`);
      if (m.metadata?.text) {
        console.log(`     text: ${m.metadata.text.slice(0, 100).replace(/\n/g, ' ')}...`);
      }
    });
  }

  const passing = matches.filter(m => m.score >= 0.40);
  const passing55 = matches.filter(m => m.score >= 0.55);
  console.log(`\n  Passing MIN_SCORE 0.40: ${passing.length}/10`);
  console.log(`  Passing MIN_SCORE 0.55: ${passing55.length}/10`);

  if (passing.length === 0) {
    console.log('\n⚠️  All scores below 0.40 — likely an embedding model mismatch between ingest and query.');
    console.log('   Ingest embed model: ' + OLLAMA_MODEL + ' via ' + EMBED_PROVIDER);
    console.log('   Query embed model must match exactly.');
  }
}

main().catch(err => {
  console.error('\n[FATAL]', err.message);
  process.exit(1);
});
