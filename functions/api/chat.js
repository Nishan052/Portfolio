/**
 * chat.js — Cloudflare Pages Function: POST /api/chat
 *
 * Pipeline:
 *   1. CORS preflight
 *   2. Parse & validate request body
 *   3. Rate limit check (Upstash, 10 req/min per IP)
 *   4. Exact cache check (Upstash Redis, 24h TTL)
 *   5. Embed query (Workers AI, bge-base-en-v1.5, 768 dims, zero-latency)
 *   6. Vector search (Pinecone, top-5, minScore 0.55)
 *   7. Build messages with system prompt + context + history
 *   8. Stream Groq response → SSE to client
 *   9. Cache full response async (non-blocking)
 */

import { embedText }        from './lib/embed.js';
import { streamGroq, extractGroqContent } from './lib/llm.js';
import { queryPinecone }    from './lib/pinecone.js';
import { checkRateLimit, getExactCache, setExactCache } from './lib/cache.js';
import { buildSystemPrompt, formatContext } from './lib/system-prompt.js';

// CORS headers — allow the portfolio domain
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function corsResponse(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: { ...CORS_HEADERS, ...extraHeaders },
  });
}

// ─── OPTIONS preflight ────────────────────────────────────────────────────────
export async function onRequestOptions() {
  return corsResponse(null, 204);
}

// ─── POST /api/chat ───────────────────────────────────────────────────────────
export async function onRequestPost({ request, env }) {
  // 1. Parse body
  let message, history;
  try {
    const body = await request.json();
    message = (body.message || '').trim();
    history = Array.isArray(body.history) ? body.history.slice(-6) : []; // keep last 3 turns
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON body' }), 400, {
      'Content-Type': 'application/json',
    });
  }

  // 2. Validate message
  if (!message) {
    return corsResponse(JSON.stringify({ error: 'Message is required' }), 400, {
      'Content-Type': 'application/json',
    });
  }
  if (message.length > 500) {
    return corsResponse(JSON.stringify({ error: 'Message too long (max 500 chars)' }), 400, {
      'Content-Type': 'application/json',
    });
  }

  // 3. Rate limit
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const { success, remaining } = await checkRateLimit(env, ip);
  if (!success) {
    return corsResponse(
      JSON.stringify({ error: 'Too many requests. Please wait a moment before asking again.' }),
      429,
      { 'Content-Type': 'application/json', 'Retry-After': '60' }
    );
  }

  // 4. Exact cache check
  const cached = await getExactCache(env, message);
  if (cached) {
    // Return cached response as a single SSE stream
    const encoder = new TextEncoder();
    const stream  = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: cached })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    });
    return new Response(stream, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Cache':       'HIT',
        'X-Remaining':   String(remaining),
      },
    });
  }

  // 5. Embed query via Workers AI (zero-latency, native binding)
  let embedding;
  try {
    embedding = await embedText(env, message);
  } catch (err) {
    console.error('Embedding failed:', err.message);
    // Fall through without vector search — LLM will use key facts only
    embedding = null;
  }

  // 6. Vector search
  let chunks = [];
  if (embedding) {
    try {
      chunks = await queryPinecone(env, embedding, 5);
    } catch (err) {
      console.error('Pinecone query failed:', err.message);
      // Non-fatal — continue with empty context
    }
  }

  // 7. Build messages array
  const context     = formatContext(chunks);
  const systemMsg   = buildSystemPrompt(context);
  const messages    = [
    { role: 'system',    content: systemMsg },
    ...history,
    { role: 'user',      content: message   },
  ];

  // 8. Stream Groq response via SSE
  let groqResponse;
  try {
    groqResponse = await streamGroq(env, messages);
  } catch (err) {
    console.error('Groq streaming failed:', err.message);
    return corsResponse(
      JSON.stringify({ error: 'AI service unavailable. Please try again shortly.' }),
      503,
      { 'Content-Type': 'application/json' }
    );
  }

  // Transform Groq's SSE stream → our SSE format + collect for caching
  const encoder     = new TextEncoder();
  const fullChunks  = [];

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // Process the Groq stream in the background
  (async () => {
    try {
      const reader  = groqResponse.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete last line

        for (const line of lines) {
          const content = extractGroqContent(line.trim());
          if (content === null)    continue;
          if (content === '[DONE]') {
            await writer.write(encoder.encode('data: [DONE]\n\n'));
            break;
          }
          fullChunks.push(content);
          await writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
        }
      }

      // Handle any remaining buffer
      if (buffer.trim()) {
        const content = extractGroqContent(buffer.trim());
        if (content && content !== '[DONE]') {
          fullChunks.push(content);
          await writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
        }
      }

      // Ensure [DONE] is always sent
      await writer.write(encoder.encode('data: [DONE]\n\n'));

    } catch (err) {
      console.error('Stream processing error:', err.message);
      await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`));
      await writer.write(encoder.encode('data: [DONE]\n\n'));
    } finally {
      await writer.close();
    }

    // 9. Cache the full response (async, non-blocking — happens after stream closes)
    if (fullChunks.length > 0) {
      const fullResponse = fullChunks.join('');
      setExactCache(env, message, fullResponse).catch(() => {});
    }
  })();

  return new Response(readable, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Cache':       'MISS',
      'X-Remaining':   String(remaining),
    },
  });
}
