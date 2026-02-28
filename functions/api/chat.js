/**
 * chat.js — Cloudflare Pages Function: POST /api/chat
 *
 * Pipeline:
 *   1. CORS preflight
 *   2. Parse & validate request body
 *   3. Rate limit check (Upstash, 10 req/min per IP)
 *   4. Exact cache check (Upstash Redis, 24h TTL)
 *   5. HyDE expand query → hypothetical answer (Groq, non-streaming, 150 tok)
 *   6. Embed expanded query (Workers AI, bge-base-en-v1.5, 768 dims)
 *   7. Vector search (Pinecone, top-5, minScore 0.55)
 *   8. Build messages with system prompt + context + history
 *   9. Stream Groq response → SSE to client
 *  10. Cache full response async (non-blocking)
 */

import { embedText }        from './lib/embed.js';
import { streamGroq, extractGroqContent, hydeExpand } from './lib/llm.js';
import { queryPinecone }    from './lib/pinecone.js';
import { checkRateLimit, getExactCache, setExactCache } from './lib/cache.js';
import { buildSystemPrompt, formatContext } from './lib/system-prompt.js';

// Allowed origins — restrict to known portfolio domains + local dev
const ALLOWED_ORIGINS = [
  'https://nishanpoojary.com',
  'https://www.nishanpoojary.com',
  'https://portfolio-btv.pages.dev',
  'http://localhost:8788',
  'http://localhost:3000',
];

// Primary production domain used as fallback for unrecognised origins
const PRIMARY_ORIGIN = 'https://nishanpoojary.com';

function getAllowedOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : PRIMARY_ORIGIN;
}

// Security headers applied to every response
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options':        'DENY',
  'Referrer-Policy':        'strict-origin-when-cross-origin',
};

function corsHeaders(request) {
  return {
    'Access-Control-Allow-Origin':  getAllowedOrigin(request),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary':                         'Origin',
  };
}

function apiResponse(request, body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: { ...corsHeaders(request), ...SECURITY_HEADERS, ...extraHeaders },
  });
}

// Only roles from the client we trust in the conversation history
const VALID_ROLES = new Set(['user', 'assistant']);

// Strip HTML tags from user input to prevent prompt injection via markup
function sanitizeInput(text) {
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// ─── OPTIONS preflight ────────────────────────────────────────────────────────
export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: { ...corsHeaders(request), ...SECURITY_HEADERS },
  });
}

// ─── POST /api/chat ───────────────────────────────────────────────────────────
export async function onRequestPost({ request, env }) {
  // 1. Parse body
  let message, history, lang;
  try {
    const body = await request.json();
    message = sanitizeInput((body.message || '').trim());
    lang    = body.lang === 'de' ? 'de' : 'en';   // whitelist; default 'en'

    // Deep-validate history: only allow user/assistant roles with string content
    history = Array.isArray(body.history)
      ? body.history
          .filter(m =>
            m && typeof m === 'object' &&
            VALID_ROLES.has(m.role) &&
            typeof m.content === 'string' &&
            m.content.length > 0 &&
            m.content.length <= 2000
          )
          .slice(-6)
      : [];
  } catch {
    return apiResponse(request, JSON.stringify({ error: 'Invalid JSON body' }), 400, {
      'Content-Type': 'application/json',
    });
  }

  // 2. Validate message
  if (!message) {
    return apiResponse(request, JSON.stringify({ error: 'Message is required' }), 400, {
      'Content-Type': 'application/json',
    });
  }
  if (message.length > 500) {
    return apiResponse(request, JSON.stringify({ error: 'Message too long (max 500 chars)' }), 400, {
      'Content-Type': 'application/json',
    });
  }

  // 3. Rate limit
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const { success, remaining } = await checkRateLimit(env, ip);
  if (!success) {
    return apiResponse(
      request,
      JSON.stringify({ error: 'Too many requests. Please wait a moment before asking again.' }),
      429,
      { 'Content-Type': 'application/json', 'Retry-After': '60' }
    );
  }

  // 4. Exact cache check — key includes lang so EN/DE responses don't collide
  const cacheKey = lang === 'de' ? `de:${message}` : message;
  const cached = await getExactCache(env, cacheKey);
  if (cached) {
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
        ...corsHeaders(request),
        ...SECURITY_HEADERS,
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Cache':       'HIT',
        'X-Remaining':   String(remaining),
      },
    });
  }

  // 5. HyDE: generate a hypothetical answer to embed instead of the raw question.
  //    The hypothesis is semantically closer to stored chunks → better retrieval.
  //    Non-fatal: falls back to embedding the raw message on any error.
  let queryText = message;
  try {
    const hypothesis = await hydeExpand(env, message);
    if (hypothesis) queryText = hypothesis;
  } catch (err) {
    console.error('HyDE expansion failed, using raw query:', err.message);
  }

  // 6. Embed the expanded query (or raw message if HyDE failed)
  let embedding;
  try {
    embedding = await embedText(env, queryText);
  } catch (err) {
    console.error('Embedding failed:', err.message);
    embedding = null;
  }

  // 7. Vector search
  let chunks = [];
  if (embedding) {
    try {
      chunks = await queryPinecone(env, embedding, 5);
    } catch (err) {
      console.error('Pinecone query failed:', err.message);
    }
  }

  // 8. Build messages array
  const context   = formatContext(chunks);
  const systemMsg = buildSystemPrompt(context, lang);
  const messages  = [
    { role: 'system',    content: systemMsg },
    ...history,
    { role: 'user',      content: message   },
  ];

  // 9. Stream Groq response via SSE
  let groqResponse;
  try {
    groqResponse = await streamGroq(env, messages);
  } catch (err) {
    console.error('Groq streaming failed:', err.message);
    return apiResponse(
      request,
      JSON.stringify({ error: 'AI service unavailable. Please try again shortly.' }),
      503,
      { 'Content-Type': 'application/json' }
    );
  }

  const encoder    = new TextEncoder();
  const fullChunks = [];

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

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
        buffer = lines.pop();

        for (const line of lines) {
          const content = extractGroqContent(line.trim());
          if (content === null)     continue;
          if (content === '[DONE]') {
            await writer.write(encoder.encode('data: [DONE]\n\n'));
            break;
          }
          fullChunks.push(content);
          await writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
        }
      }

      if (buffer.trim()) {
        const content = extractGroqContent(buffer.trim());
        if (content && content !== '[DONE]') {
          fullChunks.push(content);
          await writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
        }
      }

      await writer.write(encoder.encode('data: [DONE]\n\n'));

    } catch (err) {
      console.error('Stream processing error:', err.message);
      await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`));
      await writer.write(encoder.encode('data: [DONE]\n\n'));
    } finally {
      await writer.close();
    }

    // 10. Cache the full response async (non-blocking)
    if (fullChunks.length > 0) {
      const fullResponse = fullChunks.join('');
      setExactCache(env, cacheKey, fullResponse).catch(() => {});
    }
  })();

  return new Response(readable, {
    headers: {
      ...corsHeaders(request),
      ...SECURITY_HEADERS,
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Cache':       'MISS',
      'X-Remaining':   String(remaining),
    },
  });
}
