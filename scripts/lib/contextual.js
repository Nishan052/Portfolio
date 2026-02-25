/**
 * contextual.js — Contextual Retrieval (Anthropic 2025)
 * Generates a 2-3 sentence context for each chunk using a local Ollama LLM.
 * The context is prepended to the chunk before embedding to improve retrieval quality.
 *
 * Reference: https://www.anthropic.com/news/contextual-retrieval
 */

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const CONTEXT_MODEL = process.env.CONTEXT_MODEL || 'llama3.2:3b';

/**
 * Generate contextual description for a chunk within its parent document.
 * Falls back to returning the raw chunk if Ollama is unavailable.
 *
 * @param {string} fullDocument - The full document text
 * @param {{ text: string, chunkIndex: number }} chunk - The chunk to contextualise
 * @returns {Promise<string>} The contextual chunk text (context prepended to chunk)
 */
async function generateContextualChunk(fullDocument, chunk) {
  // Truncate document to avoid overwhelming small models (keep first 8000 chars)
  const truncatedDoc = fullDocument.length > 8000
    ? fullDocument.slice(0, 8000) + '\n...[document truncated]'
    : fullDocument;

  const prompt = `<document>
${truncatedDoc}
</document>

Here is a chunk from this document:
<chunk>
${chunk.text}
</chunk>

Give a short (2-3 sentence) context that situates this chunk within the overall document. This context will be prepended to the chunk to improve search retrieval. Only output the context sentences, nothing else.`;

  try {
    const response = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CONTEXT_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 150,
        }
      }),
      signal: AbortSignal.timeout(30000), // 30s timeout per chunk
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    const context = data.response?.trim();

    if (!context) {
      throw new Error('Empty context response');
    }

    // Return context prepended to chunk
    return `${context}\n\n${chunk.text}`;
  } catch (err) {
    // Fallback: just use the raw chunk (still works, just less optimal retrieval)
    console.warn(`  ⚠ Context generation failed for chunk ${chunk.chunkIndex}: ${err.message}`);
    console.warn('    Falling back to raw chunk (no context prepended)');
    return chunk.text;
  }
}

module.exports = { generateContextualChunk };
