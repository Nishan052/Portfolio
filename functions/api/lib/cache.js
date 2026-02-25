/**
 * cache.js — Upstash Redis: rate limiting + exact response cache
 * Uses @upstash/redis and @upstash/ratelimit (both Workers-compatible via REST).
 */

import { Redis } from '@upstash/redis/cloudflare';
import { Ratelimit } from '@upstash/ratelimit';

// Cache TTL: 24 hours
const CACHE_TTL_SECONDS = 86400;

// Rate limit: 10 requests per minute per IP (sliding window)
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW   = '1 m';

/**
 * Build an Upstash Redis client from env vars.
 */
function getRedis(env) {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Upstash Redis env vars not set (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)');
  }
  return new Redis({
    url:   env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
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
    // If Redis is unreachable, fail open (allow the request)
    console.error('Rate limit check failed, allowing request:', err.message);
    return { success: true, remaining: 99 };
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
