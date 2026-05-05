/**
 * contextual.js — Contextual Retrieval + Chunk Enrichment via Groq
 *
 * For each paragraph chunk, calls a Groq LLM that returns:
 *   context   — 2-3 sentences situating the chunk within the full document
 *               (prepended to the chunk text before embedding — Anthropic's
 *                Contextual Retrieval technique)
 *   keyPoints — 2-4 concise bullet-point insights from the paragraph
 *   keyTerms  — 4-8 important technical / domain terms in the paragraph
 *
 * The contextualText (context + original chunk) is what gets embedded.
 * keyPoints and keyTerms are stored in Pinecone metadata for structured retrieval.
 *
 * Falls back gracefully to raw chunk if Groq is unavailable or returns
 * malformed JSON.
 *
 * Reference: https://www.anthropic.com/news/contextual-retrieval
 */

const GROQ_BASE      = 'https://api.groq.com/openai/v1';
const ENRICH_MODEL   = process.env.ENRICH_MODEL    || 'llama-3.3-70b-versatile';
const GROQ_API_KEY   = process.env.GROQ_API_KEY;
const ENRICH_PROVIDER= (process.env.ENRICH_PROVIDER || 'ollama').toLowerCase(); // 'ollama' | 'groq'
const OLLAMA_BASE    = process.env.OLLAMA_BASE_URL  || 'http://localhost:11434';
const OLLAMA_LLM     = process.env.OLLAMA_LLM_MODEL || 'llama3.2'; // any capable model pulled in Ollama

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Call Groq chat completions with automatic retry on 429 rate-limit responses.
 */
async function callGroq(messages, maxTokens = 600) {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');

  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ENRICH_MODEL, stream: false, max_tokens: maxTokens, temperature: 0.1, messages,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (response.status === 429) {
      const wait = parseInt(response.headers.get('retry-after') || '15', 10);
      process.stdout.write(`[rate-limited, waiting ${wait}s] `);
      await sleep(wait * 1000);
      continue;
    }
    if (!response.ok) throw new Error(`Groq ${response.status}: ${await response.text()}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }
  throw new Error('Max Groq retries exceeded');
}

/**
 * Call Ollama chat completions (local, no rate limits).
 */
async function callOllama(messages, maxTokens = 600) {
  const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:    OLLAMA_LLM,
      stream:   false,
      options:  { temperature: 0.1, num_predict: maxTokens },
      messages,
    }),
    signal: AbortSignal.timeout(120000), // local models can be slower
  });
  if (!response.ok) throw new Error(`Ollama LLM ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return data.message?.content?.trim() || '';
}

/** Dispatch to the configured enrichment provider. */
function callLLM(messages, maxTokens = 600) {
  return ENRICH_PROVIDER === 'groq'
    ? callGroq(messages, maxTokens)
    : callOllama(messages, maxTokens);
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a precise information extraction assistant for a portfolio RAG system.
Your job is to enrich text chunks about Nishan Poojary (a software developer) for semantic search embedding.
Always respond with ONLY a valid JSON object — no markdown, no explanation, no code fences.`;

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Enrich a paragraph chunk with LLM-generated context, key points, and key terms.
 * The returned contextualText is what gets embedded instead of the raw chunk,
 * ensuring the vector captures full document context (Contextual Retrieval).
 *
 * @param {string} fullDocument - The full source document text (for document-level context)
 * @param {{ text: string, chunkIndex: number, paragraphType: string }} chunk
 * @returns {Promise<{ contextualText: string, keyPoints: string[], keyTerms: string[] }>}
 */
async function generateContextualChunk(fullDocument, chunk) {
  // Truncate document to avoid overloading the model context window
  const truncatedDoc = fullDocument.length > 6000
    ? fullDocument.slice(0, 6000) + '\n...[document truncated]'
    : fullDocument;

  const userPrompt = `Full document (for context only):
<document>
${truncatedDoc}
</document>

Paragraph chunk to enrich:
<chunk>
${chunk.text}
</chunk>

Return this exact JSON:
{
  "context": "<2-3 sentences that situate this specific paragraph within the full document — what section it belongs to, what it establishes about Nishan. Make it self-contained so it can be understood without the full document.>",
  "keyPoints": ["<concise insight 1>", "<concise insight 2>", "<concise insight 3>"],
  "keyTerms": ["<term1>", "<term2>", "<term3>", "<term4>", "<term5>", "<term6>"]
}

Rules:
- context: 2-3 sentences only, no bullets
- keyPoints: 2-4 items max, each a single concise fact or insight extracted from this chunk
- keyTerms: 4-8 items, single words or short noun phrases (technologies, skills, proper nouns, tools)
- Output raw JSON only`;

  try {
    const raw = await callLLM([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userPrompt },
    ]);

    // Robustly extract JSON — strip any accidental markdown fences
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object in Groq response');

    const parsed = JSON.parse(match[0]);

    const context   = (parsed.context   || '').trim();
    const keyPoints = Array.isArray(parsed.keyPoints)
      ? parsed.keyPoints.filter(p => typeof p === 'string' && p.trim()).slice(0, 4)
      : [];
    const keyTerms  = Array.isArray(parsed.keyTerms)
      ? parsed.keyTerms.filter(t => typeof t === 'string' && t.trim()).slice(0, 8)
      : [];

    if (!context) throw new Error('"context" field missing or empty');

    return {
      contextualText: `${context}\n\n${chunk.text}`,
      keyPoints,
      keyTerms,
    };
  } catch (err) {
    process.stdout.write(`[enrichment-fallback: ${err.message.slice(0, 50)}] `);
    return {
      contextualText: chunk.text,
      keyPoints:      [],
      keyTerms:       [],
    };
  }
}

module.exports = { generateContextualChunk };
