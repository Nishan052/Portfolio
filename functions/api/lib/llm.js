/**
 * llm.js — Groq LLM utilities: streaming answer generation + HyDE query expansion
 * Uses Groq's OpenAI-compatible API (free tier: 14,400 req/day).
 */

const GROQ_BASE = 'https://api.groq.com/openai/v1';

/**
 * Model fallback chain, tried in order. Groq retires models without notice —
 * `llama-3.1-8b-instant` disappeared and took the chatbot down with it — so the
 * list deliberately spans two families: if the whole gpt-oss family is retired
 * at once, qwen still answers.
 *
 * Every model here is a reasoning model, and they disagree on how to be told to
 * think less, so each entry carries its own params:
 *   - gpt-oss  emits chain-of-thought in `delta.reasoning` and accepts
 *              reasoning_effort 'low' (it rejects 'none').
 *   - qwen     inlines <think> blocks in `delta.content` unless reasoning is
 *              off, and accepts only 'none' or 'default' (it rejects 'low').
 * Both configurations keep chain-of-thought out of `delta.content`, which is the
 * only field extractGroqContent reads — so the client never sees reasoning.
 */
const MODELS = [
  { id: 'openai/gpt-oss-20b',  params: { reasoning_effort: 'low'  } },
  // qwen is capped at 1000 output tokens/minute on the on_demand tier, so a
  // 1024-token request is rejected outright with a 429 before it can answer.
  // Per-model params are spread last, so this overrides the call site's budget.
  { id: 'qwen/qwen3.6-27b',    params: { reasoning_effort: 'none', max_tokens: 800 } },
];

/**
 * POST to Groq, walking the fallback chain until a model answers.
 *
 * The response is returned only once Groq has accepted the request, so for
 * streaming calls no bytes have reached the client yet and switching models
 * mid-chain can never produce a half-written answer.
 *
 * @param {object} env   - Cloudflare environment (env.GROQ_API_KEY required)
 * @param {object} body  - Request body minus `model` and the per-model params
 * @param {string} label - Call site name, used in log and error messages
 * @returns {Promise<Response>} The first successful Groq response
 */
async function groqRequest(env, body, label) {
  if (!env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set in environment');

  const failures = [];

  for (const model of MODELS) {
    let response;
    try {
      response = await fetch(`${GROQ_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ ...body, model: model.id, ...model.params }),
      });
    } catch (err) {
      // Network/transport failure — nothing was delivered, so try the next model
      failures.push(`${model.id}: ${err.message}`);
      continue;
    }

    if (response.ok) {
      if (model !== MODELS[0]) {
        console.warn(`${label}: primary model unavailable, answered by ${model.id}`);
      }
      return response;
    }

    const detail = (await response.text()).slice(0, 200);
    failures.push(`${model.id}: ${response.status} ${detail}`);

    // A rejected key fails identically on every model — stop rather than
    // burn the whole chain re-proving it.
    if (response.status === 401 || response.status === 403) break;
  }

  throw new Error(`${label} failed on all ${MODELS.length} models — ${failures.join(' | ')}`);
}

/**
 * Stream a chat completion from Groq.
 * @param {object} env - Cloudflare environment (env.GROQ_API_KEY required)
 * @param {{ role: string, content: string }[]} messages - Full conversation messages
 * @returns {Promise<Response>} The raw Groq streaming response
 */
export async function streamGroq(env, messages) {
  // Caller pipes response.body
  return groqRequest(env, {
    messages,
    stream:      true,
    max_tokens:  1024,
    temperature: 0.3,
    top_p:       0.9,
  }, 'Chat completion');
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
  const response = await groqRequest(env, {
    stream:      false,
    max_tokens:  400,
    temperature: 0.5,
    messages: [
      { role: 'system', content: HYDE_SYSTEM },
      { role: 'user',   content: question },
    ],
  }, 'HyDE expansion');

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
  const response = await groqRequest(env, {
    stream:      false,
    max_tokens:  1024,
    temperature: 0.6,
    messages: [
      { role: 'system', content: SUBQUERY_SYSTEM },
      { role: 'user',   content: question },
    ],
  }, 'Sub-query expansion');

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
