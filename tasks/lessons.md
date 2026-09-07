# Lessons

Durable gotchas learned while working on this repo. Read at session start.

## Never trust an SDK write call that logs success — verify the effect

`@pinecone-database/pinecone` v7 takes **options objects**, not bare arrays:

```js
index.deleteMany({ ids })   // correct
index.deleteMany(ids)       // resolves fine, deletes NOTHING, throws nothing
index.fetch({ ids })        // correct
index.fetch(ids)            // throws "Must pass in at least 1 recordID"
```

The `deleteMany` case is the dangerous one: it fails *silently*. A sync can log
"Removing 6 stale chunks", exit 0, and leave all 6 in the index still answering
queries. Found only by re-reading the index after the delete rather than trusting
the log line.

**Rule:** for any operation whose whole purpose is a side effect on a remote store,
assert the effect afterwards. Applies double to deletes.

## Pinecone reads are eventually consistent

A `fetch` immediately after a successful `deleteMany` can still return the deleted
records. Verification of a delete must poll with backoff before concluding failure —
otherwise the correctness check itself becomes a false-alarm generator.

## Embedding-model mismatch fails silently

This index is 768-dim `bge-base-en-v1.5` (matching `functions/api/lib/embed.js`).
Local Ollama has `nomic-embed-text`, also 768-dim. Indexing with the wrong one
produces vectors of the right *shape* and the wrong *geometry*: no error anywhere,
retrieval quality just quietly degrades. Dimension agreement is not model agreement.

**Rule:** locally, embed via `EMBED_PROVIDER=cloudflare` and only enrich via Ollama.

## Detecting "what changed" from git diffs is fragile

The old ingest workflow used `git diff --diff-filter=A HEAD~1 HEAD`. It missed edits
(only saw additions), missed squashed pushes (`fetch-depth: 2`), and had no way to
notice that a previous run had failed — one blog sat unindexed indefinitely.

**Rule:** prefer reconciling desired state against actual state. It is idempotent
and self-healing; a diff-based pipeline is neither.

## Verify extraction against ground truth before building on it

When lifting the source-loading logic out of `ingest.js`, the ids it generates had to
match the live index exactly or every source would have been re-ingested as "new".
Diffing generated ids against the real index (49/49, zero orphans) caught this before
any expensive or destructive work ran.
