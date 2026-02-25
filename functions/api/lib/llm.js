/**
 * llm.js — Groq streaming LLM via raw fetch
 * Uses Groq's OpenAI-compatible API (free tier: 14,400 req/day).
 * Returns the raw ReadableStream from Groq to pipe directly to the client.
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
