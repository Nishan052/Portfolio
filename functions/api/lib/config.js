/**
 * config.js — Central configuration for the Cloudflare Pages Function backend
 * ─────────────────────────────────────────────────────────────────────────────
 * All magic numbers and environment-specific values live here.
 * Import from this file instead of hardcoding values in chat.js.
 */

// ── CORS ──────────────────────────────────────────────────────────────────────

/** Origins that are allowed to call the API. */
export const ALLOWED_ORIGINS = [
  'https://nishanpoojary.com',
  'https://www.nishanpoojary.com',
  'https://portfolio-btv.pages.dev',
  'http://localhost:8788',
  'http://localhost:3000',
];

/** Fallback sent as Access-Control-Allow-Origin for unrecognised origins. */
export const PRIMARY_ORIGIN = 'https://nishanpoojary.com';

// ── Request validation ────────────────────────────────────────────────────────

/** Maximum length (chars) accepted for a single user message. */
export const MAX_MESSAGE_LENGTH = 500;

/** Maximum number of history turns included in the LLM context. */
export const MAX_HISTORY_MESSAGES = 6;

/** Maximum length (chars) accepted per individual history message. */
export const MAX_HISTORY_MESSAGE_LENGTH = 2000;

/**
 * Largest request body read at all. A full request is about 14,000 characters
 * (six history messages of 2,000 plus the question), so this leaves room for
 * non-ASCII text and refuses a body that is only there to cost parsing time.
 */
export const MAX_BODY_BYTES = 65_536;

// ── Rate limiting ─────────────────────────────────────────────────────────────

/** Sliding-window duration passed to Upstash Ratelimit. */
export const RATE_LIMIT_WINDOW = '1 m';

/** The same window in milliseconds, for the in-memory fallback limiter. */
export const RATE_LIMIT_WINDOW_MS = 60_000;

/** Maximum requests per window per IP. */
export const RATE_LIMIT_MAX_REQUESTS = 10;

// ── Caching ───────────────────────────────────────────────────────────────────

/** Cache TTL in seconds (default: 24 hours). */
export const CACHE_TTL_SECONDS = 86_400;

// ── Vector search ─────────────────────────────────────────────────────────────

/** Number of nearest-neighbour chunks to retrieve from Pinecone. */
export const VECTOR_SEARCH_TOP_K = 5;

/** Minimum cosine similarity score for a chunk to be included. */
export const VECTOR_SEARCH_MIN_SCORE = 0.55;
