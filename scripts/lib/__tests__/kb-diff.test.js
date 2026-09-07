/**
 * Unit tests for the knowledge-base reconciliation logic.
 *
 * This module decides what gets deleted from Pinecone, so it is tested in
 * isolation rather than only through a live sync.
 */

const { groupBySource, diffKb, staleChunkIds, checkPruneCap } = require('../kb-diff');

const src = (id, contentHash) => ({ id, contentHash, type: 'blog_post', text: '', metadata: {} });

describe('groupBySource', () => {
  it('groups chunk ids under their source and sorts numerically', () => {
    expect(groupBySource(['blog_a_0', 'blog_a_10', 'blog_a_2'])).toEqual({ blog_a: [0, 2, 10] });
  });

  it('does not let a source id swallow a longer one sharing its prefix', () => {
    const grouped = groupBySource(['project_a_0', 'project_ab_0', 'project_ab_1']);
    expect(grouped).toEqual({ project_a: [0], project_ab: [0, 1] });
  });

  it('keeps underscores and digits inside a source id intact', () => {
    expect(groupBySource(['cv_work_infosys_3'])).toEqual({ cv_work_infosys: [3] });
    expect(groupBySource(['blog_nifty50-stock_1'])).toEqual({ 'blog_nifty50-stock': [1] });
  });

  it('ignores ids that are not chunk ids', () => {
    expect(groupBySource(['not-a-chunk', 'blog_a_0'])).toEqual({ blog_a: [0] });
  });
});

describe('diffKb', () => {
  const current = {
    bySource: { blog_known: [0, 1, 2], blog_edited: [0, 1], blog_legacy: [0] },
    hashes:   { blog_known: 'hash1', blog_edited: 'oldhash', blog_legacy: null },
  };

  it('marks a source absent from the index as new', () => {
    const { toIngest } = diffKb([src('blog_brand_new', 'h')], current);
    expect(toIngest).toHaveLength(1);
    expect(toIngest[0].reason).toBe('new');
    expect(toIngest[0].source.id).toBe('blog_brand_new');
  });

  it('skips a source whose hash still matches', () => {
    const { unchanged, toIngest } = diffKb([src('blog_known', 'hash1')], current);
    expect(unchanged.map(s => s.id)).toEqual(['blog_known']);
    expect(toIngest).toHaveLength(0);
  });

  it('marks a source with a differing hash as changed and records its existing chunks', () => {
    const { toIngest } = diffKb([src('blog_edited', 'newhash')], current);
    expect(toIngest[0].reason).toBe('changed');
    expect(toIngest[0].existingChunkIds).toEqual(['blog_edited_0', 'blog_edited_1']);
  });

  it('adopts pre-hash vectors instead of paying to re-embed them', () => {
    const { toAdopt, toIngest } = diffKb([src('blog_legacy', 'h')], current);
    expect(toIngest).toHaveLength(0);
    expect(toAdopt[0].chunkIds).toEqual(['blog_legacy_0']);
  });

  it('re-ingests pre-hash vectors when explicitly asked', () => {
    const { toAdopt, toIngest } = diffKb([src('blog_legacy', 'h')], current, { reingestUnhashed: true });
    expect(toAdopt).toHaveLength(0);
    expect(toIngest[0].reason).toBe('unhashed');
  });

  it('reports indexed sources missing from the repo as orphans', () => {
    const { orphanSources } = diffKb([src('blog_known', 'hash1')], current);
    expect(orphanSources.map(o => o.id).sort()).toEqual(['blog_edited', 'blog_legacy']);
    expect(orphanSources.find(o => o.id === 'blog_edited').chunkIds)
      .toEqual(['blog_edited_0', 'blog_edited_1']);
  });

  it('reports no orphans when pruning is disabled', () => {
    const { orphanSources } = diffKb([src('blog_known', 'hash1')], current, { prune: false });
    expect(orphanSources).toEqual([]);
  });

  it('treats a completely empty index as all-new', () => {
    const { toIngest, orphanSources } = diffKb([src('a', 'h'), src('b', 'h')], { bySource: {}, hashes: {} });
    expect(toIngest.map(t => t.reason)).toEqual(['new', 'new']);
    expect(orphanSources).toEqual([]);
  });
});

describe('staleChunkIds', () => {
  it('returns the tail chunks left behind when a source shrinks', () => {
    const existing = ['blog_a_0', 'blog_a_1', 'blog_a_2', 'blog_a_3'];
    expect(staleChunkIds(existing, 2)).toEqual(['blog_a_2', 'blog_a_3']);
  });

  it('returns nothing when the source grew or stayed the same size', () => {
    const existing = ['blog_a_0', 'blog_a_1'];
    expect(staleChunkIds(existing, 2)).toEqual([]);
    expect(staleChunkIds(existing, 5)).toEqual([]);
  });

  it('handles a source with no previous chunks', () => {
    expect(staleChunkIds([], 3)).toEqual([]);
    expect(staleChunkIds(undefined, 3)).toEqual([]);
  });
});

describe('checkPruneCap', () => {
  it('allows a deletion inside the cap', () => {
    expect(checkPruneCap(10, 500, 20).ok).toBe(true);
  });

  it('blocks a deletion over the cap and explains why', () => {
    const result = checkPruneCap(400, 500, 20);
    expect(result.ok).toBe(false);
    expect(result.pct).toBe(80);
    expect(result.message).toMatch(/Refusing to prune/);
  });

  it('allows the boundary case exactly at the cap', () => {
    expect(checkPruneCap(100, 500, 20).ok).toBe(true);
  });

  it('is a no-op when there is nothing to delete or nothing indexed', () => {
    expect(checkPruneCap(0, 500).ok).toBe(true);
    expect(checkPruneCap(5, 0).ok).toBe(true);
  });
});
