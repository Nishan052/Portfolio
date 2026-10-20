/**
 * cache.js — Upstash Redis: rate limiting + exact response cache
 * Uses @upstash/redis and @upstash/ratelimit (both Workers-compatible via REST).
 */

import { Redis } from '@upstash/redis/cloudflare';
import { Ratelimit } from '@upstash/ratelimit';
import {
  CACHE_TTL_SECONDS,
  RATE_LIMIT_MAX_REQUESTS as RATE_LIMIT_REQUESTS,
  RATE_LIMIT_WINDOW,
  RATE_LIMIT_WINDOW_MS,
} from './config.js';

// How long one Redis call may take before it counts as down.
const REDIS_TIMEOUT_MS = 1500;

/**
 * Build an Upstash Redis client from env vars.
 *
 * No retries and a short timeout: with the client's defaults, a Redis that no
 * longer exists made every chat request wait several seconds, three times over,
 * before the limiter and the cache gave up and failed open.
 */
function getRedis(env) {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Upstash Redis env vars not set (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)');
  }
  return new Redis({
    url:    env.UPSTASH_REDIS_REST_URL,
    token:  env.UPSTASH_REDIS_REST_TOKEN,
    retry:  false,
    signal: () => AbortSignal.timeout(REDIS_TIMEOUT_MS),
  });
}

// Used only while Redis is unreachable. It lives in one isolate's memory, so it is a
// weaker limit than the shared one, but a dead Redis used to mean no limit at all.
const memoryHits = new Map();

function memoryLimit(identifier, now = Date.now()) {
  const recent = (memoryHits.get(identifier) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_REQUESTS) {
    memoryHits.set(identifier, recent);
    return { success: false, remaining: 0 };
  }
  recent.push(now);
  memoryHits.set(identifier, recent);

  if (memoryHits.size > 5000) {   // forget callers that have gone quiet
    for (const [key, times] of memoryHits) {
      if (!times.some(t => now - t < RATE_LIMIT_WINDOW_MS)) memoryHits.delete(key);
    }
  }
  return { success: true, remaining: RATE_LIMIT_REQUESTS - recent.length };
}

/**
 * A reply may be cached and shared only when it was a function of the question
 * alone. The key is the question, so a reply that also depended on conversation
 * history, which the client supplies and can forge, would be served to every
 * visitor who asked the same question.
 */
export function isCacheable(history) {
  return history.length === 0;
}

/**
 * Check rate limit for an IP address.
 * @param {object} env - CF environment
 * @param {string} ip  - Client IP
 * @returns {Promise<{ success: boolean, remaining: number }>}
 */
export async function checkRateLimit(env, ip) {
  try {
    const redis = getRedis(env);
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW),
      prefix:  'rl:chat',
    });

    const identifier = `ip_${ip}`;
    const { success, remaining } = await ratelimit.limit(identifier);
    return { success, remaining };
  } catch (err) {
    console.error('Rate limit check failed, using the in-memory limit:', err.message);
    return memoryLimit(`ip_${ip}`);
  }
}

/**
 * Compute a stable SHA-256 hash of a string (for cache keys).
 * Uses Web Crypto API (available in Workers).
 */
async function sha256(text) {
  const encoder  = new TextEncoder();
  const data     = encoder.encode(text.toLowerCase().trim());
  const hashBuf  = await crypto.subtle.digest('SHA-256', data);
  const hashArr  = Array.from(new Uint8Array(hashBuf));
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Look up an exact-match cache entry.
 * @param {object} env      - CF environment
 * @param {string} message  - The user's message (will be hashed)
 * @returns {Promise<string|null>} Cached response or null
 */
export async function getExactCache(env, message) {
  try {
    const redis  = getRedis(env);
    const key    = `cache:${await sha256(message)}`;
    const cached = await redis.get(key);
    return cached ?? null;
  } catch (err) {
    console.error('Cache get failed:', err.message);
    return null;
  }
}

/**
 * Store a response in the exact-match cache.
 * @param {object} env      - CF environment
 * @param {string} message  - The user's message
 * @param {string} response - The full LLM response to cache
 */
export async function setExactCache(env, message, response) {
  try {
    const redis = getRedis(env);
    const key   = `cache:${await sha256(message)}`;
    await redis.set(key, response, { ex: CACHE_TTL_SECONDS });
  } catch (err) {
    // Non-critical — log and continue
    console.error('Cache set failed:', err.message);
  }
}
