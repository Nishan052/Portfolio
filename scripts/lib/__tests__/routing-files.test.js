const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { listBlogs } = require('../sources');

const PUBLIC = path.join(__dirname, '..', '..', '..', 'public');
const read = name => fs.readFileSync(path.join(PUBLIC, name), 'utf-8');

describe('the sitemap and the route rules', () => {
  // A new post is a new route. A post missing from _redirects would 404 in
  // production, and one missing from the sitemap would never be crawled.
  test('match the blog files', () => {
    expect(() => execFileSync('node',
      [path.join(__dirname, '..', '..', 'build-routing-files.js'), '--check'],
      { stdio: 'pipe' })).not.toThrow();
  });

  // A route added to App.js without a rule would 404 on a direct visit, though
  // it works when reached by a click, which is easy to miss in development.
  test('cover every route App.js declares', () => {
    const app = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'src', 'App.js'), 'utf-8');
    const paths = [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map(m => m[1])
      .filter(p => p !== '/' && p !== '*' && !p.includes(':'));   // the catch-all is the 404 page, so it gets no rule
    expect(paths.length).toBeGreaterThan(0);
    for (const route of paths) expect(read('_redirects')).toContain(`${route} / 200`);
  });

  test('list every post in both files', () => {
    const sitemap = read('sitemap.xml');
    const redirects = read('_redirects');
    for (const { slug } of listBlogs()) {
      expect(sitemap).toContain(`/blogs/${slug}</loc>`);
      expect(redirects).toContain(`/blogs/${slug} / 200`);
    }
  });

  // Cloudflare Pages redirects a request for /index.html to /, so a rule that
  // rewrites to it sends every real route to the home page.
  test('never rewrite to index.html or any other .html file', () => {
    const rules = read('_redirects').split('\n').filter(l => l && !l.startsWith('#'));
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) expect(rule).toMatch(/^\S+ \/ 200$/);
  });

  test('keep the redirecting and the older home page routes out of the sitemap', () => {
    const sitemap = read('sitemap.xml');
    expect(sitemap).not.toContain('/deck');
    expect(sitemap).not.toContain('/classic');
  });
});

describe('the 404 page', () => {
  // Cloudflare Pages treats the site as a single-page app, answering every
  // unknown path with a 200, until a top-level 404.html exists.
  test('exists, so unknown paths get a real 404', () => {
    expect(read('404.html')).toContain('Page not found');
  });

  test('links to the home page', () => {
    expect(read('404.html')).toContain('<a href="/">');
  });

  test('is not indexed', () => {
    expect(read('404.html')).toContain('name="robots" content="noindex"');
  });
});

describe('robots.txt', () => {
  test('points crawlers at the sitemap', () => {
    expect(read('robots.txt')).toContain('Sitemap: https://nishanpoojary.com/sitemap.xml');
  });
});
