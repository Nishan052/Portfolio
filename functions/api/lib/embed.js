/**
 * embed.js — Query embedding for Cloudflare Pages Functions
 * Uses Workers AI (env.AI) for zero-latency production embeddings.
 * nomic-embed-text-v1.5 produces 768-dim vectors — same model family as
 * Ollama nomic-embed-text used at ingest time.
 */

export async function embedText(env, text) {
  if (!env.AI) {
    throw new Error('Workers AI binding (env.AI) not configured. Check wrangler.toml.');
  }

  const result = await env.AI.run('@cf/nomic-ai/nomic-embed-text-v1.5', {
    text: [text.trim().slice(0, 8000)]
  });

  if (!result?.data?.[0]) {
    throw new Error('Workers AI returned no embedding data');
  }

  return result.data[0]; // float[] of 768 dimensions
}
