/**
 * llm.js — Groq LLM utilities: streaming answer generation + HyDE query expansion
 * Uses Groq's OpenAI-compatible API (free tier: 14,400 req/day).
 */

const GROQ_BASE = 'https://api.groq.com/openai/v1';
const MODEL     = 'llama-3.1-8b-instant';

/**
 * Stream a chat completion from Groq.
 * @param {object} env - Cloudflare environment (env.GROQ_API_KEY required)
 * @param {{ role: string, content: string }[]} messages - Full conversation messages
 * @returns {Promise<Response>} The raw Groq streaming response
 */
export async function streamGroq(env, messages) {
  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not set in environment');
  }

  const response = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:       MODEL,
      messages,
      stream:      true,
      max_tokens:  512,
      temperature: 0.3,
      top_p:       0.9,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  return response; // Caller pipes response.body
}

// System prompt used exclusively for HyDE query expansion
const HYDE_SYSTEM = `You are helping improve document retrieval for a portfolio chatbot.
Given a question about a software developer, write a 2-3 sentence passage that a
resume, project description, or skills section might contain that would directly
answer the question. Output only the passage, no preamble or explanation.`;

/**
 * HyDE (Hypothetical Document Embeddings) — generate a hypothetical answer passage.
 * The passage is embedded instead of the raw question so that cosine similarity
 * is computed against text that looks like the stored chunks (declarative facts),
 * improving retrieval accuracy.
 *
 * Non-fatal: callers should catch and fall back to embedding the raw question.
 *
 * @param {object} env      - Cloudflare environment (env.GROQ_API_KEY required)
 * @param {string} question - The user's raw question
 * @returns {Promise<string|null>} A 2-3 sentence hypothetical passage, or null
 */
export async function hydeExpand(env, question) {
  if (!env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');

  const response = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:       MODEL,
      stream:      false,
      max_tokens:  150,
      temperature: 0.5,
      messages: [
        { role: 'system', content: HYDE_SYSTEM },
        { role: 'user',   content: question },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HyDE Groq error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

// System prompt used for multi-query sub-question generation
const SUBQUERY_SYSTEM = `You are a query expansion assistant for a portfolio chatbot.
Given a user's question about a software developer, generate exactly 10 distinct sub-questions
that together cover all angles of the original question.
Rules:
- Output ONLY a JSON array of 10 strings, no other text
- Each sub-question must be self-contained and specific
- Vary the angle: skills, projects, experience, education, tools, achievements
- Example output: ["What programming languages does the developer know?", ...]`;

/**
 * Multi-Query Expansion — generate 10 sub-questions from the original question.
 * All 11 queries (original + subs) are later embedded and searched in parallel.
 *
 * Non-fatal: callers should catch and fall back to just the original question.
 *
 * @param {object} env      - Cloudflare environment (env.GROQ_API_KEY required)
 * @param {string} question - The user's raw question
 * @returns {Promise<string[]>} Array of sub-questions (up to 10)
 */
export async function expandToSubQueries(env, question) {
  if (!env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');

  const response = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:       MODEL,
      stream:      false,
      max_tokens:  400,
      temperature: 0.6,
      messages: [
        { role: 'system', content: SUBQUERY_SYSTEM },
        { role: 'user',   content: question },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Sub-query expansion Groq error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw  = data.choices?.[0]?.message?.content?.trim() || '[]';

  // Extract JSON array robustly — handle any surrounding prose
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return [];

  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed)
      ? parsed.filter(q => typeof q === 'string' && q.trim()).slice(0, 10)
      : [];
  } catch {
    return [];
  }
}

/**
 * Extract text content from a Groq SSE data line.
 * @param {string} line - e.g. "data: {"choices":[{"delta":{"content":"hello"}}]}"
 * @returns {string|null} The content string, or null if not a content line
 */
export function extractGroqContent(line) {
  if (!line.startsWith('data: ')) return null;
  const data = line.slice(6).trim();
  if (data === '[DONE]') return '[DONE]';

  try {
    const parsed = JSON.parse(data);
    return parsed.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}
