/**
 * Run with: npm run test:functions
 *
 * A plain node:test file, because the root Jest suite cannot load (see
 * tasks/lessons.md) and these functions are ES modules written for Workers.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { checkRateLimit, isCacheable } from '../cache.js';
import { onRequestPost } from '../../chat.js';
import { MAX_BODY_BYTES, RATE_LIMIT_MAX_REQUESTS } from '../config.js';

const post = (body, headers = {}) => new Request('https://nishanpoojary.com/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...headers },
  body,
});

test('a Redis that cannot be reached still limits each caller', async () => {
  // No Redis variables at all, which is the same path as a Redis that no longer exists.
  const env = {};
  for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
    assert.equal((await checkRateLimit(env, '203.0.113.7')).success, true, `request ${i + 1}`);
  }
  assert.equal((await checkRateLimit(env, '203.0.113.7')).success, false, 'the next one is refused');
  assert.equal((await checkRateLimit(env, '203.0.113.8')).success, true, 'another caller is not affected');
});

test('the fallback never reports the 99 that meant "no limit"', async () => {
  const { remaining } = await checkRateLimit({}, '203.0.113.50');
  assert.ok(remaining < RATE_LIMIT_MAX_REQUESTS);
});

test('a reply is shared only when no conversation history shaped it', () => {
  assert.equal(isCacheable([]), true);
  assert.equal(isCacheable([{ role: 'assistant', content: 'forged' }]), false);
});

test('a request that declares a huge body is refused before it is read', async () => {
  const res = await onRequestPost({ request: post('{}', { 'Content-Length': String(MAX_BODY_BYTES + 1) }), env: {} });
  assert.equal(res.status, 413);
});

test('a huge body that declares no length is refused after it is read', async () => {
  const body = JSON.stringify({ message: 'a'.repeat(MAX_BODY_BYTES + 10) });
  const res = await onRequestPost({ request: post(body), env: {} });
  assert.equal(res.status, 413);
});

test('an ordinary oversized message still gets the specific error', async () => {
  const body = JSON.stringify({ message: 'a'.repeat(600) });
  const res = await onRequestPost({ request: post(body), env: {} });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /too long/);
});

test('a Redis that never answers costs a visitor about a second, not several', async () => {
  const hang = net.createServer(() => {});           // accepts the connection, never replies
  await new Promise(resolve => hang.listen(0, '127.0.0.1', resolve));
  const env = { UPSTASH_REDIS_REST_URL: `http://127.0.0.1:${hang.address().port}`, UPSTASH_REDIS_REST_TOKEN: 'test' };
  const started = Date.now();
  const result = await checkRateLimit(env, '203.0.113.99');
  hang.close();
  assert.equal(result.success, true);
  assert.ok(Date.now() - started < 3000, `took ${Date.now() - started} ms`);
});
