/**
 * kb-diff.js — pure reconciliation logic for the knowledge base.
 *
 * Deliberately free of network and filesystem access: this is the part that
 * decides what gets embedded and, more importantly, what gets *deleted*, so it
 * is unit-tested in isolation (see __tests__/kb-diff.test.js).
 *
 * Vector ids are `${sourceId}_${chunkIndex}`, which is what lets us recover the
 * indexed state from Pinecone itself and skip a separate manifest file.
 */

/**
 * Turn a flat list of vector ids into { sourceId: [chunkIndex, ...] }.
 *
 * Splitting on the final `_<digits>` is what keeps `project_a` from swallowing
 * `project_ab_0` — the separator is part of the match, not a bare prefix test.
 */
function groupBySource(ids) {
  const bySource = {};
  for (const id of ids) {
    const m = /^(.*)_(\d+)$/.exec(id);
    if (!m) continue;  // not a chunk id we produced — leave it alone
    const [, sourceId, chunkIndex] = m;
    (bySource[sourceId] ||= []).push(Number(chunkIndex));
  }
  for (const key of Object.keys(bySource)) bySource[key].sort((a, b) => a - b);
  return bySource;
}

/**
 * Reconcile desired state (the repo) against current state (Pinecone).
 *
 * @param {Array}  desired  Sources from sources.js — { id, contentHash, ... }
 * @param {object} current  { bySource: {id: [chunkIdx]}, hashes: {id: hash|null} }
 * @param {object} opts
 * @param {boolean} [opts.reingestUnhashed]  Re-embed rather than adopt vectors
 *                                           that predate contentHash tracking
 * @param {boolean} [opts.prune]             Include orphaned sources for deletion
 *
 * Outcomes per source:
 *   new      — in the repo, absent from Pinecone            -> embed
 *   changed  — hash differs from the stored one             -> embed + drop stale chunks
 *   adopt    — indexed before hashes existed, no hash stored -> stamp metadata only
 *   unchanged— hash matches                                  -> no work, no cost
 *   orphan   — in Pinecone, no longer in the repo            -> delete (when pruning)
 */
function diffKb(desired, current, { reingestUnhashed = false, prune = true } = {}) {
  const { bySource = {}, hashes = {} } = current;

  const toIngest  = [];
  const toAdopt   = [];
  const unchanged = [];

  for (const source of desired) {
    const chunks = bySource[source.id];

    if (!chunks || chunks.length === 0) {
      toIngest.push({ source, reason: 'new', staleChunkIds: [] });
      continue;
    }

    const storedHash = hashes[source.id];

    // Indexed before contentHash existed. Re-embedding would cost a full LLM +
    // embedding pass for content we have no evidence has changed, so by default
    // we just stamp the hash on and let the next run do a real comparison.
    if (!storedHash) {
      if (reingestUnhashed) {
        toIngest.push({ source, reason: 'unhashed', staleChunkIds: [] });
      } else {
        toAdopt.push({ source, chunkIds: chunks.map(i => `${source.id}_${i}`) });
      }
      continue;
    }

    if (storedHash === source.contentHash) {
      unchanged.push(source);
      continue;
    }

    // Edited. Re-embedding overwrites chunks 0..n-1 by id, but if the post got
    // shorter the tail chunks would survive as orphans that still match queries.
    // We cannot know the new chunk count until chunking runs, so the caller
    // resolves this after vectorizing; here we record every existing chunk id.
    toIngest.push({
      source,
      reason: 'changed',
      existingChunkIds: chunks.map(i => `${source.id}_${i}`),
      staleChunkIds: [],
    });
  }

  const desiredIds   = new Set(desired.map(s => s.id));
  const orphanSources = prune
    ? Object.keys(bySource)
        .filter(id => !desiredIds.has(id))
        .map(id => ({ id, chunkIds: bySource[id].map(i => `${id}_${i}`) }))
    : [];

  return { toIngest, toAdopt, unchanged, orphanSources };
}

/**
 * Given the chunk ids a source previously had and the count it has now,
 * return the ids left behind by a shrink.
 */
function staleChunkIds(existingChunkIds = [], newChunkCount) {
  return existingChunkIds.filter(id => {
    const m = /_(\d+)$/.exec(id);
    return m && Number(m[1]) >= newChunkCount;
  });
}

/**
 * Guard against a catastrophic delete. A broken source loader or a bad checkout
 * makes every source look orphaned; without this, one green CI run would empty
 * the index. Refusing to proceed is always recoverable — deleting is not.
 */
function checkPruneCap(deleteCount, totalCount, maxPct = 20) {
  if (deleteCount === 0 || totalCount === 0) return { ok: true, pct: 0 };
  const pct = (deleteCount / totalCount) * 100;
  return {
    ok: pct <= maxPct,
    pct: Number(pct.toFixed(1)),
    message: `Refusing to prune ${deleteCount}/${totalCount} vectors (${pct.toFixed(1)}%) — over the ${maxPct}% safety cap. `
           + `This usually means sources failed to load, not that content was really deleted. `
           + `Re-run with --max-prune-pct=<higher> if the deletion is genuinely intended.`,
  };
}

module.exports = { groupBySource, diffKb, staleChunkIds, checkPruneCap };
