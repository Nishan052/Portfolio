/**
 * src/data/blogs/index.js
 *
 * Auto-assembled blog registry.
 *
 * To add a new blog post:
 *   1. Create a new file in this directory:  src/data/blogs/your-post-slug.js
 *   2. Export a default object matching the blog post shape (see any existing file).
 *   3. Import it below and add it to the `blogs` array (newest first).
 *
 * Post shape:
 *   slug, title, category, emoji, color, date, readTime, tags,
 *   excerpt, content (markdown string), references (array), githubUrl (optional)
 *
 * Categories: "project" | "research" | "news"
 */

import nifty50          from './nifty50-stock-prediction';
import signaldock       from './signaldock-mqtt-iot';
import barcodeScanner   from './barcode-scanner-tinyml';
import faceVerification from './tinyml-face-verification';
import angularRouting   from './angular-spa-routing';
import pythonData       from './python-data-analysis';

// ── Add new posts at the TOP (newest first) ─────────────────────────────────
const blogs = [
  nifty50,
  signaldock,
  barcodeScanner,
  faceVerification,
  angularRouting,
  pythonData,
];

export default blogs;
