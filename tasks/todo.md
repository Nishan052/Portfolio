# Weekly Incremental KB Sync Pipeline

Goal: keep the RAG knowledge base in sync with the repo as a new blog ships each week,
by reconciling Pinecone against the repo instead of guessing from git diffs.

## Tasks

- [x] `scripts/lib/sources.js` — single definition of every KB source + contentHash
- [x] `scripts/lib/vectorize.js` — embedText / processSource / upsertBatched engine
- [x] `scripts/lib/kb-diff.js` — pure diff logic (new/changed/adopt/orphan/stale/prune-cap)
- [x] `scripts/sync-kb.js` — reconciling orchestrator with dry-run + report
- [x] Refactor `scripts/ingest.js` to full-rebuild only, on shared libs (fixes PDF filter bug)
- [x] `scripts/lib/__tests__/kb-diff.test.js` — unit tests for the diff logic
- [x] `.github/workflows/kb-sync.yml` (weekly cron + push + dispatch); delete `ingest-new-content.yml`
- [x] `package.json` — kb:sync / kb:sync:dry / kb:status scripts

## Verification

- [x] Dry run reports exactly 2 new blogs, 47 adopt, 0 orphans
- [x] Unit tests pass
- [x] Real sync via Ollama: 528 -> ~555 vectors
- [x] Re-run is a no-op (idempotent)
- [x] Editing one blog marks exactly that source `changed`
- [x] Removing a blog file marks exactly that source for prune
- [~] `npm run test:quality-gate` — script is missing from the repo (pre-existing); verified retrieval directly instead

## Review

Built a reconciling sync that compares the repo against Pinecone directly rather than
reading git history, so a missed or failed run self-heals on the next pass.

**Outcome:** index went 528 -> 560 vectors. The two blogs that the old push-triggered
workflow had silently missed (`kmeans-centroids-convergence-rag-routing`,
`edgetpu-position-dominates`) are now indexed and retrieve as top matches
(0.887 and 0.694). The other 49 sources were adopted with a metadata-only hash
stamp — no re-embedding, no LLM calls, no cost.

**Verified end to end:** exact-match of generated source ids against the live index
(49/49, zero orphans); idempotent re-run (51 unchanged, zero writes); single-source
change detection; orphan detection; prune safety cap aborting with exit 1; filtered
scope disabling prune; live stale-chunk deletion on a shrinking post (8 -> 2 chunks,
chunks 2..7 removed and confirmed gone); retrieval of both new blogs.

**Bugs found and fixed along the way:**
- `deleteMany(ids)` with a bare array resolves successfully but deletes nothing.
  The SDK wants `deleteMany({ ids })`. Caught only because the live shrink test
  checked the index afterwards instead of trusting the log line.
- `upsertBatched` never cleared `lastErr` after a successful retry, so a batch that
  failed once then succeeded still threw.
- `--pdf-files` filtered on `metadata.file` while the loader set `metadata.filename`,
  so the flag silently skipped every PDF.
- Added a guard against embedding with a model other than bge-base-en-v1.5, which
  would produce correctly-sized but geometrically wrong vectors and silently
  degrade retrieval with nothing visible in logs.

**Pre-existing breakage found, left alone (out of scope, reported to user):**
- `__tests__/setup.js` breaks the entire root Jest suite (a `jest.mock` factory
  references `document`). Worked around with a separate node-env config for the
  script tests, which should not load a jsdom setup anyway.
- `tests/quality-gate.js` and the other `test:*` scripts reference files that do
  not exist in the repo.
- `scripts/debug-rag.js` embeds with `@cf/nomic-ai/nomic-embed-text-v1.5` — wrong
  model for this index, and a dead Cloudflare route.
