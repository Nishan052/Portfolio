/**
 * contextual.js — Contextual Retrieval + Paragraph Enrichment
 *
 * For each paragraph chunk this module makes a single Ollama call that returns:
 *   context   — 2-3 sentences situating the paragraph within the full document
 *               (prepended to the chunk text before embedding, per Anthropic's
 *                Contextual Retrieval technique)
 *   keyPoints — 2-4 concise bullet-point insights from the paragraph
 *   keyTerms  — 4-8 important technical / domain terms appearing in the paragraph
 *
 * Storing keyPoints and keyTerms in Pinecone metadata lets the chat API surface
 * structured facets without re-parsing the raw text at query time.
 *
 * Reference: https://www.anthropic.com/news/contextual-retrieval
 */

const OLLAMA_BASE   = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const CONTEXT_MODEL = process.env.CONTEXT_MODEL   || 'llama3.2:3b';

/**
 * Enrich a paragraph chunk with document context, key points, and key terms.
 * Falls back gracefully if Ollama is unavailable or returns malformed JSON.
 *
 * @param {string} fullDocument - The full source document text
 * @param {{ text: string, chunkIndex: number }} chunk - The paragraph chunk
 * @returns {Promise<{
 *   contextualText: string,   // context prepended to paragraph — use this for embedding
 *   keyPoints:      string[], // 2-4 key insights
 *   keyTerms:       string[], // 4-8 domain / technical terms
 * }>}
 */
async function generateContextualChunk(fullDocument, chunk) {
  // Truncate document to avoid overwhelming small models.
  const truncatedDoc = fullDocument.length > 8000
    ? fullDocument.slice(0, 8000) + '\n...[document truncated]'
    : fullDocument;

  const prompt = `You are a precise information extraction assistant. Analyse the paragraph below in the context of the full document and respond with ONLY a valid JSON object — no markdown, no explanation.

<document>
${truncatedDoc}
</document>

<paragraph>
${chunk.text}
</paragraph>

Return this exact JSON shape:
{
  "context":   "<2-3 sentences that situate this paragraph within the overall document>",
  "keyPoints": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "keyTerms":  ["<term1>", "<term2>", "<term3>", "<term4>", "<term5>"]
}

Rules:
- context: 2-3 sentences only, no bullet points
- keyPoints: 2-4 items, each a single concise sentence
- keyTerms: 4-8 items, single words or short noun phrases, no duplicates
- Output raw JSON only — no markdown code fences`;

  try {
    const response = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:  CONTEXT_MODEL,
        prompt,
        stream: false,
        format: 'json',   // Ollama JSON mode — constrains output to valid JSON
        options: {
          temperature: 0.1,
          num_predict: 400,
        },
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) throw new Error(`Ollama error: ${response.status}`);

    const data   = await response.json();
    const raw    = data.response?.trim();
    if (!raw)    throw new Error('Empty response from Ollama');

    const parsed = JSON.parse(raw);

    const context   = (parsed.context   || '').trim();
    const keyPoints = Array.isArray(parsed.keyPoints) ? parsed.keyPoints.filter(Boolean) : [];
    const keyTerms  = Array.isArray(parsed.keyTerms)  ? parsed.keyTerms.filter(Boolean)  : [];

    if (!context) throw new Error('context field missing in Ollama response');

    return {
      contextualText: `${context}\n\n${chunk.text}`,
      keyPoints,
      keyTerms,
    };
  } catch (err) {
    console.warn(`  ⚠ Enrichment failed for chunk ${chunk.chunkIndex}: ${err.message}`);
    console.warn('    Falling back to raw chunk (no context / keyPoints / keyTerms)');
    return {
      contextualText: chunk.text,
      keyPoints:      [],
      keyTerms:       [],
    };
  }
}

module.exports = { generateContextualChunk };
