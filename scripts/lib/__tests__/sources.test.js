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

describe('blog titles', () => {
  // A title with an apostrophe is written 'A model\'s speed' in the module, and
  // a lazy regex cut it at the backslash, so the chatbot knew the post as
  // "A language model\".
  test('keep their apostrophes and are never cut at a backslash', () => {
    const { listBlogs } = require('../sources');
    const titles = Object.fromEntries(listBlogs().map(p => [p.slug, p.title]));
    expect(titles['feasibility-ceiling-holds'])
      .toBe("A language model's speed on your device is set by memory bandwidth");
    for (const title of Object.values(titles)) expect(title).not.toMatch(/\\$/);
  });

  // The same cut hit excerpts: 13 posts were summarised in the knowledge base as
  // "For my master\\" because their excerpts hold an apostrophe.
  test('excerpts with an apostrophe are read whole for the knowledge base', async () => {
    const sources = await loadAllSources({ only: ['blogs'] });
    const post = sources.find(s => s.id === 'blog_nifty50-stock-prediction');
    expect(post.text).toMatch(/Summary: For my master's, three of us forecast/);
    for (const s of sources) expect(s.text).not.toMatch(/Summary: .*\\\n/);
  });

  test('read the same way for the knowledge base', async () => {
    const sources = await loadAllSources({ only: ['blogs'] });
    const post = sources.find(s => s.id === 'blog_feasibility-ceiling-holds');
    expect(post.metadata.title).toBe("A language model's speed on your device is set by memory bandwidth");
  });
});

describe('the chatbot site index', () => {
  // The chatbot answers "what is the latest post" from this file, so a stale
  // copy is a wrong answer in production. It is regenerated on every build;
  // this catches a commit that changed a post without regenerating it.
  test('matches the data and blog files', () => {
    const { execFileSync } = require('child_process');
    const path = require('path');
    expect(() => execFileSync('node',
      [path.join(__dirname, '..', '..', 'build-site-index.js'), '--check'],
      { stdio: 'pipe' })).not.toThrow();
  });
});

describe('roles and projects carry what the site says about them', () => {
  // The chatbot only knows what is indexed. It used to get titles and tech
  // lists alone, so asked about edge AI it could not mention the current role's
  // edge deployment work, which the site describes in plain sight.
  const fs = require('fs');
  const path = require('path');
  const read = (...p) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'src', ...p), 'utf-8'));

  test('every role and project has its translated description, one for one', () => {
    const en = read('i18n', 'en.json');
    expect(en.experience.items).toHaveLength(read('data', 'experience.json').length);
    expect(en.projects.items).toHaveLength(read('data', 'projects.json').length);
  });

  test('the indexed text includes those descriptions', async () => {
    const en = read('i18n', 'en.json');
    const sources = await loadAllSources({ only: ['json'] });
    const text = sources.map(s => s.text).join('\n');
    for (const item of en.experience.items) {
      for (const h of item.highlights) expect(text).toContain(h);
    }
    for (const item of en.projects.items) expect(text).toContain(item.description);
  });
});

describe('the Groq model check', () => {
  // check-groq.js reads model ids out of the source. If it ever reads none, the
  // live check passes vacuously, which is how two retired models went unseen.
  test('finds every chat model and the enrichment model', () => {
    const { modelsInCode } = require('../../check-groq');
    const { chat, enrich } = modelsInCode();
    expect(chat.length).toBeGreaterThanOrEqual(2);
    for (const id of [...chat, enrich]) expect(id).toMatch(/^[\w.-]+\/[\w.-]+$|^[\w.-]+$/);
    expect(enrich).toBeTruthy();
  });
});
