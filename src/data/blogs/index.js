/**
 * src/data/blogs/index.js
 *
 * Auto-assembled blog registry — NO MANUAL EDITS NEEDED.
 *
 * To add a new blog post:
 *   1. Create a new file in this directory: src/data/blogs/your-post-slug.js
 *   2. Export a default object with the required shape (see any existing file).
 *   Done. It will appear automatically, sorted newest-first by the `date` field.
 *
 * Required post shape:
 *   slug       — string   URL-safe identifier e.g. 'my-post-title'
 *   title      — string   Full display title
 *   category   — string   'project' | 'research' | 'news'
 *   iconKey    — string   Icon key used for the post icon (e.g. 'Brain', 'Python')
 *   color      — string   Hex accent colour e.g. '#6366f1'
 *   date       — string   ISO date e.g. '2026-03-08'  ← controls sort order
 *   readTime   — string   e.g. '10 min'
 *   tags       — string[] e.g. ['AI', 'RAG']
 *   excerpt    — string   One-sentence description shown in list view
 *   content    — string   Full markdown content (supports mermaid fences)
 *   references — { label, url }[]  Links shown at the bottom
 *   githubUrl  — string   Optional GitHub link
 */

// webpack require.context — auto-imports every .js file in this directory
// except index.js itself. No manual import needed when adding a new post.
const ctx = require.context('./', false, /^\.\/(?!index).*\.js$/);

const blogs = ctx
  .keys()
  .map(key => ctx(key).default)
  .filter(Boolean)
  .sort((a, b) => (b.id ?? 0) - (a.id ?? 0)); // highest id first = newest

export default blogs;
