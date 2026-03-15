/**
 * __tests__/utils/test-helpers.js - Common test utilities and helpers
 * 
 * Provides:
 * - Test data factories
 * - Mock generators
 * - Assertion helpers
 * - Common test setup/teardown
 */

/**
 * Create test message with optional overrides
 */
export function createTestMessage(overrides = {}) {
  return {
    message: 'What is your experience?',
    lang: 'en',
    history: [],
    ...overrides,
  };
}

/**
 * Create test embedding vector
 */
export function createTestEmbedding(dims = 768) {
  return Array(dims).fill(0).map(() => Math.random());
}

/**
 * Create test chunk from vector search result
 */
export function createTestChunk(overrides = {}) {
  return {
    source: 'test-doc.md',
    text: 'Test content about portfolio and experience.',
    score: 0.95,
    metadata: {
      section: 'experience',
      date: '2024-01-01',
    },
    ...overrides,
  };
}

/**
 * Create test case for retrieval quality testing
 */
export function createTestCase(overrides = {}) {
  return {
    id: 'test_001',
    question: 'What experience do you have?',
    expected_sources: ['experience.json', 'projects.json'],
    difficulty: 'easy',
    ...overrides,
  };
}

/**
 * Wait for async operations
 */
export async function waitFor(condition, timeout = 1000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (condition()) return true;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  return false;
}

/**
 * Mock successful API response
 */
export function mockSuccessResponse(data = {}) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  });
}

/**
 * Mock failed API response
 */
export function mockErrorResponse(status = 500, message = 'Server Error') {
  return Promise.reject(
    new Error(`HTTP ${status}: ${message}`)
  );
}

/**
 * Assert array contains value
 */
export function assertIncludes(array, value, message = '') {
  if (!array.includes(value)) {
    throw new Error(`Expected array to include ${value}. ${message}`);
  }
}

/**
 * Assert object has keys
 */
export function assertHasKeys(obj, keys, message = '') {
  for (const key of keys) {
    if (!(key in obj)) {
      throw new Error(`Expected object to have key "${key}". ${message}`);
    }
  }
}

/**
 * Assert number is within range
 */
export function assertInRange(value, min, max, message = '') {
  if (value < min || value > max) {
    throw new Error(
      `Expected ${value} to be between ${min} and ${max}. ${message}`
    );
  }
}

/**
 * Create test request context (for Cloudflare Workers)
 */
export function createTestRequest(body = {}, options = {}) {
  return {
    method: options.method || 'POST',
    headers: new Map([
      ['Content-Type', 'application/json'],
      ['Origin', 'http://localhost:3000'],
      ['CF-Connecting-IP', options.ip || '192.168.1.1'],
      ...(options.headers || []),
    ]),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

/**
 * Create test environment object
 */
export function createTestEnv(overrides = {}) {
  return {
    GROQ_API_KEY: 'test-groq-key-12345',
    UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'test-token',
    PINECONE_API_KEY: 'test-pinecone-key',
    PINECONE_INDEX_NAME: 'portfolio',
    PINECONE_NAMESPACE: 'test',
    ...overrides,
  };
}

/**
 * Compare floating point numbers with tolerance
 */
export function assertAlmostEqual(a, b, tolerance = 0.0001, message = '') {
  if (Math.abs(a - b) > tolerance) {
    throw new Error(
      `Expected ${a} to be approximately equal to ${b} (tolerance: ${tolerance}). ${message}`
    );
  }
}

/**
 * Measure function execution time
 */
export async function measureTime(fn) {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
}

export default {
  createTestMessage,
  createTestEmbedding,
  createTestChunk,
  createTestCase,
  waitFor,
  mockSuccessResponse,
  mockErrorResponse,
  assertIncludes,
  assertHasKeys,
  assertInRange,
  createTestRequest,
  createTestEnv,
  assertAlmostEqual,
  measureTime,
};
