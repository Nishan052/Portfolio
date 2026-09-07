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
 *   references — { text, url }[]   Links shown at the bottom
 *   githubUrl  — string   Optional GitHub link
 *
 * Optional, for posts that belong to a run of related posts:
 *   series     — string   Series name e.g. 'Edge AI'. Groups posts together.
 *   part       — number   1-based position within that series.
 *
 * A post with both gets a series bar at the top with links to the previous and
 * next part, so a reader who lands mid-series can find the start. Set them
 * together or not at all.
 */

// webpack require.context — auto-imports every .js file in this directory
// except index.js itself. No manual import needed when adding a new post.
const ctx = require.context('./', false, /^\.\/(?!index).*\.js$/);

const blogs = ctx
  .keys()
  .map(key => ctx(key).default)
  .filter(Boolean)
  // Newest first by date. `id` is only a tiebreaker for same-day posts, and is
  // otherwise just an identifier: nothing else reads it, and routing uses slug.
  .sort((a, b) =>
    (b.date ?? '').localeCompare(a.date ?? '') || (b.id ?? 0) - (a.id ?? 0),
  );

export default blogs;
