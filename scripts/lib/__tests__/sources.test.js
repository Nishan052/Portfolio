const { asciiId, loadAllSources } = require('../sources');

describe('asciiId', () => {
  test('an ID that is already ASCII is unchanged, so indexed vectors keep matching', () => {
    expect(asciiId('experience_novigo_solutions')).toBe('experience_novigo_solutions');
    expect(asciiId('project_rag_portfolio_assistant')).toBe('project_rag_portfolio_assistant');
  });

  test('German characters are transliterated, not dropped', () => {
    expect(asciiId('experience_georg_schröder_maritime_unternehmensberatung'))
      .toBe('experience_georg_schroeder_maritime_unternehmensberatung');
    expect(asciiId('straße_über_äpfel')).toBe('strasse_ueber_aepfel');
  });

  test('other accents lose their mark, and anything else becomes an underscore', () => {
    expect(asciiId('café_naïve')).toBe('cafe_naive');
    expect(asciiId('名前')).toBe('__');
  });
});

describe('every source in the repo', () => {
  // The test that would have caught it. Pinecone refuses a non-ASCII ID at
  // upsert time, which in CI is minutes into a run and after the unit tests
  // have already passed.
  test('has an ID Pinecone will accept', async () => {
    const sources = await loadAllSources({ only: ['blogs', 'json'] });
    const bad = sources.map(s => s.id).filter(id => !/^[\x20-\x7E]+$/.test(id));
    expect(bad).toEqual([]);
  });
});
