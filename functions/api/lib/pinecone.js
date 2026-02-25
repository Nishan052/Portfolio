/**
 * pinecone.js — Vector search via Pinecone REST API
 * Queries the portfolio-rag index for the top-K most relevant chunks.
 */

const TOP_K     = 5;
const MIN_SCORE = 0.55; // Minimum cosine similarity threshold

/**
 * Query Pinecone for semantically similar chunks.
 * @param {object} env - Cloudflare environment (PINECONE_API_KEY, PINECONE_HOST required)
 * @param {number[]} embedding - 768-dim query vector
 * @param {number} topK - Number of results to retrieve
 * @returns {Promise<{ text: string, source: string, type: string, score: number }[]>}
 */
export async function queryPinecone(env, embedding, topK = TOP_K) {
  if (!env.PINECONE_API_KEY) throw new Error('PINECONE_API_KEY not set');
  if (!env.PINECONE_HOST)    throw new Error('PINECONE_HOST not set');

  const url = `${env.PINECONE_HOST}/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Api-Key':      env.PINECONE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vector:          embedding,
      topK,
      includeMetadata: true,
      includeValues:   false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Pinecone query error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const matches = data.matches || [];

  // Filter by minimum score and map to usable format
  return matches
    .filter(m => m.score >= MIN_SCORE)
    .map(m => ({
      text:   m.metadata?.text  || '',
      source: m.metadata?.source || 'unknown',
      type:   m.metadata?.type   || 'unknown',
      score:  m.score,
    }))
    .filter(m => m.text.length > 0);
}
