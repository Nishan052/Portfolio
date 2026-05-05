/**
 * embed.js — Query embedding for Cloudflare Pages Functions
 * Uses Workers AI (env.AI) for zero-latency production embeddings.
 * bge-base-en-v1.5 produces 768-dim vectors — same model used at ingest time
 * via Cloudflare Workers AI REST API.
 */

export async function embedText(env, text) {
  if (!env.AI) {
    throw new Error('Workers AI binding (env.AI) not configured. Check wrangler.toml.');
  }

  const result = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: [text.trim().slice(0, 8000)]
  });

  if (!result?.data?.[0]) {
    throw new Error('Workers AI returned no embedding data');
  }

  return result.data[0]; // float[] of 768 dimensions
}
