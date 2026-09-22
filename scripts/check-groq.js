#!/usr/bin/env node
/**
 * check-groq.js — the Groq models this repo names still exist, and the account
 * is still on the free plan.
 *
 *   GROQ_API_KEY=... node scripts/check-groq.js
 *
 * Runs in the knowledge base workflow before every sync, weekly at least.
 *
 * 1. Every model id in the code must be served by the account. Two retirements
 *    went unnoticed in September 2026: the chat widget's fallback, which turned
 *    every rate limit into "AI service unavailable", and the sync's enrichment
 *    model, which quietly indexed chunks without context while every run
 *    reported success. A missing model fails this check.
 *
 * 2. This site runs on Groq's free plan and must never be billed. The free plan
 *    cannot charge: past a limit it returns 429. Charges need the account to be
 *    upgraded, which nothing in code can do or undo. What code can do is notice:
 *    the free plan's limits are 8,000 tokens a minute and 1,000 requests a day
 *    per model, and higher limits mean the account is on a paid plan. That is a
 *    warning, not a failure, because Groq could also raise the free limits.
 */
const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FREE_PLAN = { tokensPerMinute: 8000, requestsPerDay: 1000 };

/** Every Groq model id the code will call. */
function modelsInCode() {
  const llm = fs.readFileSync(path.join(ROOT, 'functions/api/lib/llm.js'), 'utf-8');
  const table = llm.slice(llm.indexOf('const MODELS = ['), llm.indexOf('];', llm.indexOf('const MODELS = [')));
  const chat = [...table.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
  const ctx = fs.readFileSync(path.join(ROOT, 'scripts/lib/contextual.js'), 'utf-8');
  const enrich = /ENRICH_MODEL\s*=\s*process\.env\.ENRICH_MODEL\s*\|\|\s*'([^']+)'/.exec(ctx)?.[1];
  return { chat, enrich: process.env.ENRICH_MODEL || enrich };
}

async function main() {
  const key = process.env.GROQ_API_KEY;
  if (!key) { console.error('GROQ_API_KEY is not set'); process.exit(1); }
  const auth = { Authorization: `Bearer ${key}` };

  const { chat, enrich } = modelsInCode();
  const res = await fetch('https://api.groq.com/openai/v1/models', { headers: auth });
  if (!res.ok) { console.error(`listing models failed: ${res.status}`); process.exit(1); }
  const served = new Set((await res.json()).data.map(m => m.id));

  let missing = 0;
  for (const [use, id] of [...chat.map(id => ['chat', id]), ['enrichment', enrich]]) {
    const ok = served.has(id);
    missing += !ok;
    console.log(`${ok ? 'ok     ' : 'MISSING'} ${use.padEnd(10)} ${id}`);
  }

  // One token from the first chat model, to read the account's limits.
  const probe = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: chat[0], max_tokens: 1, messages: [{ role: 'user', content: 'ok' }] }),
  });
  const tpm = Number(probe.headers.get('x-ratelimit-limit-tokens'));
  const rpd = Number(probe.headers.get('x-ratelimit-limit-requests'));
  if (tpm && rpd) {
    const paid = tpm > FREE_PLAN.tokensPerMinute || rpd > FREE_PLAN.requestsPerDay;
    console.log(`limits  ${tpm} tokens/min, ${rpd} requests/day: ${paid ? 'ABOVE the free plan' : 'free plan'}`);
    if (paid) {
      console.log('::warning::Groq limits are above the free plan, so the account looks upgraded and can be billed. ' +
                  'Check console.groq.com/settings/billing.');
    }
  }

  if (missing) {
    console.error(`\n${missing} model(s) are no longer served. Pick a replacement from GET /openai/v1/models.`);
    process.exit(1);
  }
}

if (require.main === module) main();
module.exports = { modelsInCode };
