#!/usr/bin/env node
/**
 * ingest.js — RAG ingestion pipeline
 * Runs locally with Node.js. Reads portfolio data, chunks text into semantic
 * paragraphs, enriches each chunk with an LLM, embeds the enriched text, and
 * upserts to Pinecone.
 *
 * Providers (set in .env.local):
 *   EMBED_PROVIDER=ollama     (default) — Ollama bge-base-en-v1.5, no rate limits
 *   EMBED_PROVIDER=cloudflare           — Cloudflare Workers AI REST API
 *
 *   ENRICH_PROVIDER=ollama   (default) — Ollama llama3.2, no rate limits
 *   ENRICH_PROVIDER=groq               — Groq API
 *
 * IMPORTANT: bge-base-en-v1.5 is the same underlying model in both Ollama and
 * Cloudflare Workers AI. Vectors are fully compatible across providers.
 *
 * Ollama prerequisites:
 *   ollama pull bge-base-en-v1.5   # embedding model
 *   ollama pull llama3.2           # enrichment model (or any capable model)
 *
 * Required env vars:
 *   Always:    PINECONE_API_KEY, PINECONE_HOST
 *   Ollama:    OLLAMA_BASE_URL (default http://localhost:11434)
 *   Cloudflare embed: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN
 *   Groq enrich:      GROQ_API_KEY
 *
 * Usage:
 *   node scripts/ingest.js                             # skips if vectors already exist
 *   node scripts/ingest.js --force                     # clears index and re-ingests everything
 *   node scripts/ingest.js --blog-slugs=my-new-blog    # incremental: only that blog
 *   node scripts/ingest.js --pdf-files=Report.pdf      # incremental: only that PDF
 *
 * Sources ingested:
 *   - PDFs in data/
 *   - src/data/experience.json
 *   - src/data/projects.json
 *   - src/data/skills.json
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.dev.vars' });

const fs = require('fs');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');
const { chunkText }               = require('./lib/chunk');
const { generateContextualChunk } = require('./lib/contextual');

// ─── Config ───────────────────────────────────────────────────────────────────
const PINECONE_API_KEY  = process.env.PINECONE_API_KEY;
const PINECONE_HOST     = process.env.PINECONE_HOST;
const PINECONE_INDEX    = process.env.PINECONE_INDEX || 'portfolio-rag';
const EMBED_PROVIDER    = (process.env.EMBED_PROVIDER   || 'ollama').toLowerCase();  // 'ollama' | 'cloudflare'
const ENRICH_PROVIDER   = (process.env.ENRICH_PROVIDER  || 'ollama').toLowerCase();  // 'ollama' | 'groq'
const OLLAMA_BASE       = process.env.OLLAMA_BASE_URL   || 'http://localhost:11434';
const OLLAMA_EMBED_MODEL= process.env.OLLAMA_EMBED_MODEL|| 'nomic-embed-text';
const OLLAMA_LLM        = process.env.OLLAMA_LLM_MODEL  || 'llama3.2';
const CF_ACCOUNT_ID     = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN      = process.env.CLOUDFLARE_API_TOKEN;
const CF_EMBED_MODEL    = '@cf/baai/bge-base-en-v1.5';
const FORCE             = process.argv.includes('--force');
const CLEAR_FIRST       = process.argv.includes('--clear') || FORCE;
const BATCH_SIZE        = 100;
// Only relevant when ENRICH_PROVIDER=groq to avoid hitting free-tier RPM
const ENRICH_DELAY_MS   = parseInt(process.env.ENRICH_DELAY_MS || '0', 10);

// ─── Incremental / partial ingest flags ──────────────────────────────────────
// --blog-slugs=slug1,slug2   only process those blog files (comma-separated, no .js)
// --pdf-files=a.pdf,b.pdf    only process those PDF files (comma-separated)
// When either flag is set: skip all other sources, never clear the index.
const _blogSlugsArg = process.argv.find(a => a.startsWith('--blog-slugs='));
const BLOG_SLUGS    = _blogSlugsArg ? _blogSlugsArg.split('=')[1].split(',').map(s => s.trim()).filter(Boolean) : null;
const _pdfFilesArg  = process.argv.find(a => a.startsWith('--pdf-files='));
const PDF_FILES     = _pdfFilesArg  ? _pdfFilesArg.split('=')[1].split(',').map(s => s.trim()).filter(Boolean)  : null;
const INCREMENTAL   = BLOG_SLUGS !== null || PDF_FILES !== null;

// ─── Validate ─────────────────────────────────────────────────────────────────
if (!PINECONE_API_KEY) {
  console.error('[ERROR] PINECONE_API_KEY not set.');
  process.exit(1);
}
if (!PINECONE_HOST) {
  console.error('[ERROR] PINECONE_HOST not set.');
  process.exit(1);
}
if (EMBED_PROVIDER === 'cloudflare' && (!CF_ACCOUNT_ID || !CF_API_TOKEN)) {
  console.error('[ERROR] EMBED_PROVIDER=cloudflare requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.');
  process.exit(1);
}
if (ENRICH_PROVIDER === 'groq' && !process.env.GROQ_API_KEY) {
  console.error('[ERROR] ENRICH_PROVIDER=groq requires GROQ_API_KEY.');
  process.exit(1);
}

// ─── Embed ────────────────────────────────────────────────────────────────────
// Ollama (default): bge-base-en-v1.5 — same model weights as Cloudflare Workers
//   AI, so vectors are fully compatible. No rate limits, runs locally.
// Cloudflare: Workers AI REST API — use in CI or when Ollama is unavailable.
async function embedText(text) {
  const input = text.trim().slice(0, 8000);

  if (EMBED_PROVIDER === 'ollama') {
    // Ollama /api/embed (v0.3+) — returns { embeddings: [[...]] }
    const response = await fetch(`${OLLAMA_BASE}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, input: [input] }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Ollama embed ${response.status}: ${await response.text()}`);
    const data = await response.json();
    if (!Array.isArray(data.embeddings?.[0])) throw new Error('Ollama returned no embedding data');
    return data.embeddings[0];
  }

  // EMBED_PROVIDER === 'cloudflare'
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_EMBED_MODEL}`;
  const MAX_EMBED_RETRIES = 4;
  for (let attempt = 1; attempt <= MAX_EMBED_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: [input] }),
        signal: AbortSignal.timeout(45000),
      });
      if (!response.ok) throw new Error(`Cloudflare AI embed ${response.status}: ${await response.text()}`);
      const data = await response.json();
      if (!Array.isArray(data.result?.data?.[0])) throw new Error('Cloudflare AI returned no embedding data');
      return data.result.data[0];
    } catch (err) {
      if (attempt === MAX_EMBED_RETRIES) throw err;
      const wait = attempt * 3000;
      process.stdout.write(`[retry ${attempt}]... `);
      await sleep(wait);
    }
  }
}

// ─── Throttle helper ──────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Process a source into Pinecone vectors ───────────────────────────────────
// Each chunk is:
//   1. LLM-enriched (context + keyPoints + keyTerms via Groq)
//   2. The enriched contextualText is embedded (not raw chunk)
//   3. Both raw text and enriched metadata stored in Pinecone
async function processSource(sourceId, sourceType, fullText, metadata = {}) {
  const chunks = chunkText(fullText);
  console.log(`  ${chunks.length} chunks`);

  const vectors = [];
  for (const chunk of chunks) {
    process.stdout.write(`    chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks} [${chunk.paragraphType}] enriching... `);

    // Step 1: LLM enrichment — generates context, keyPoints, keyTerms
    // contextualText = "<2-3 context sentences>\n\n<original chunk>" — this is what gets embedded
    const enriched = await generateContextualChunk(fullText, chunk);
    process.stdout.write('embedding... ');

    // Step 2: Embed the enriched text so the vector captures full document context
    const embedding = await embedText(enriched.contextualText);
    process.stdout.write('[OK]\n');

    vectors.push({
      id: `${sourceId}_${chunk.chunkIndex}`,
      values: embedding,
      metadata: {
        text:          chunk.text,              // original text — shown in RAG context at query time
        keyPoints:     enriched.keyPoints,      // LLM-generated insights — surfaced in RAG context
        keyTerms:      enriched.keyTerms,       // LLM-generated terms
        keywords:      chunk.keywords,          // algorithmic fallback keywords
        paragraphType: chunk.paragraphType,
        source:        sourceId,
        type:          sourceType,
        chunkIndex:    chunk.chunkIndex,
        totalChunks:   chunk.totalChunks,
        timestamp:     new Date().toISOString().split('T')[0],
        ...metadata,
      }
    });

    // Throttle to respect Groq free-tier rate limits (default 2s between calls)
    if (chunk.chunkIndex < chunks.length - 1) await sleep(ENRICH_DELAY_MS);
  }

  return vectors;
}

// ─── Batch upsert to Pinecone (with retry) ───────────────────────────────────
async function upsertBatched(index, vectors) {
  const MAX_RETRIES = 4;
  let total = 0;
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch     = vectors.slice(i, i + BATCH_SIZE);
    const batchNum  = Math.ceil((i + 1) / BATCH_SIZE);
    let lastErr;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await index.upsert({ records: batch });
        break; // success
      } catch (err) {
        lastErr = err;
        const delay = 2000 * attempt; // 2s, 4s, 6s, 8s
        console.warn(`  [WARN] Batch ${batchNum} attempt ${attempt} failed: ${err.message}`);
        if (attempt < MAX_RETRIES) {
          console.log(`  Retrying in ${delay / 1000}s...`);
          await sleep(delay);
        }
      }
    }
    if (lastErr && total < i + batch.length) {
      // all retries exhausted for this batch
      throw lastErr;
    }
    total += batch.length;
    console.log(`  Upserted batch ${batchNum} (${total}/${vectors.length} vectors)`);
  }
}

// ─── Load PDFs from data/ ─────────────────────────────────────────────────────
async function loadPDFs() {
  const { PDFParse } = require('pdf-parse');
  const dataDir = path.join(__dirname, '..', 'data');

  if (!fs.existsSync(dataDir)) {
    console.log('  No data/ directory found, skipping PDFs');
    return [];
  }

  const pdfs = fs.readdirSync(dataDir).filter(f => f.endsWith('.pdf'));
  const results = [];

  for (const pdfFile of pdfs) {
    const filePath = path.join(dataDir, pdfFile);
    try {
      const buffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      const baseName = pdfFile.replace('.pdf', '').replace(/\s+/g, '_').toLowerCase();
      results.push({
        id: `pdf_${baseName}`,
        type: 'pdf',
        text: data.text,
        metadata: { filename: pdfFile }
      });
      console.log(`  [OK] Loaded: ${pdfFile} (${data.total} pages, ${data.text.length} chars)`);
    } catch (err) {
      console.warn(`  [WARN] Failed to parse ${pdfFile}: ${err.message}`);
    }
  }

  return results;
}

// ─── Ollama preflight check ───────────────────────────────────────────────────
async function checkOllama() {
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { models = [] } = await r.json();
    const names = models.map(m => m.name);

    const hasEmbed = names.some(n => n.includes('nomic-embed-text'));
    const hasLLM   = names.some(n => n.includes(OLLAMA_LLM));

    if (EMBED_PROVIDER === 'ollama' && !hasEmbed) {
      console.error(`[ERROR] Embedding model not found in Ollama. Run:\n  ollama pull ${OLLAMA_EMBED_MODEL}`);
      process.exit(1);
    }
    if (ENRICH_PROVIDER === 'ollama' && !hasLLM) {
      console.error(`[ERROR] LLM model not found in Ollama. Run:\n  ollama pull ${OLLAMA_LLM}`);
      process.exit(1);
    }
    const embedInfo  = EMBED_PROVIDER   === 'ollama' ? ` embed: ${OLLAMA_EMBED_MODEL},` : '';
    console.log(`[OK] Ollama running —${embedInfo} llm: ${OLLAMA_LLM}`);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.name === 'TimeoutError' || err.message.includes('fetch')) {
      console.error(`[ERROR] Ollama is not running. Start it with:\n  ollama serve`);
    } else {
      console.error(`[ERROR] Ollama preflight failed: ${err.message}`);
    }
    process.exit(1);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\nPortfolio RAG Ingestion Pipeline\n');
  console.log(`  Embed provider:  ${EMBED_PROVIDER}  (${EMBED_PROVIDER === 'ollama' ? `ollama ${OLLAMA_BASE} model=${OLLAMA_EMBED_MODEL}` : 'Cloudflare Workers AI'})`);
  console.log(`  Enrich provider: ${ENRICH_PROVIDER}  (${ENRICH_PROVIDER === 'ollama' ? `ollama ${OLLAMA_BASE} model=${OLLAMA_LLM}` : 'Groq'})`);
  console.log(`  Force re-ingest: ${FORCE}\n`);

  // Verify Ollama is reachable and required models are pulled
  if (EMBED_PROVIDER === 'ollama' || ENRICH_PROVIDER === 'ollama') {
    await checkOllama();
  }

  // Connect to Pinecone
  const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
  const index = pc.index(PINECONE_INDEX, PINECONE_HOST);
  console.log(`[OK] Connected to Pinecone index: ${PINECONE_INDEX}`);

  // Skip guard — only applies to full ingestion runs, not incremental
  if (!INCREMENTAL) {
    const stats = await index.describeIndexStats();
    const existing = stats.totalRecordCount ?? 0;
    if (existing > 0 && !FORCE) {
      console.log(`\nPinecone already has ${existing} vectors. Run with --force to re-ingest.\n`);
      process.exit(0);
    }
  }

  if (INCREMENTAL) {
    console.log(`\n[INCREMENTAL] blog-slugs: ${BLOG_SLUGS ? BLOG_SLUGS.join(', ') : 'all'} | pdf-files: ${PDF_FILES ? PDF_FILES.join(', ') : 'all'}`);
  }

  // Clear existing vectors if requested (never on incremental)
  if (CLEAR_FIRST && !INCREMENTAL) {
    console.log('\nClearing existing vectors...');
    try {
      await index.deleteAll();
      console.log('[OK] Cleared all vectors');
    } catch (err) {
      if (err.status === 404 || (err.message && err.message.includes('404'))) {
        console.log('[OK] Namespace already empty');
      } else {
        throw err;
      }
    }
  }

  const allVectors = [];

  // ── Source 1: PDFs ──────────────────────────────────────────────────────────
  if (!INCREMENTAL || PDF_FILES !== null) {
    console.log('\nLoading PDFs from data/...');
    const pdfs = await loadPDFs();
    for (const pdf of pdfs) {
      // In incremental mode, skip PDFs not in the --pdf-files list
      if (PDF_FILES && !PDF_FILES.includes(pdf.metadata?.file)) continue;
      console.log(`\n  Processing: ${pdf.id}`);
      const vecs = await processSource(pdf.id, pdf.type, pdf.text, pdf.metadata);
      allVectors.push(...vecs);
    }
  }

  // ── Source 2: experience.json (skipped in incremental mode) ─────────────────
  if (!INCREMENTAL) {
    console.log('\nLoading experience.json...');
    const expPath = path.join(__dirname, '..', 'src', 'data', 'experience.json');
    if (fs.existsSync(expPath)) {
      const expData = JSON.parse(fs.readFileSync(expPath, 'utf-8'));
      for (const role of expData) {
        const text = `
Role: ${role.role}
Company: ${role.company}
Period: ${role.period} to ${role.end} (${role.duration})
Location: ${role.location}
Skills: ${role.skills.join(', ')}
${role.subRoles ? `\nProgression:\n${role.subRoles.map(r => `- ${r.title} (${r.period})`).join('\n')}` : ''}
      `.trim();

        const id = `experience_${role.company.replace(/\s+/g, '_').toLowerCase()}`;
        console.log(`\n  Processing: ${id}`);
        const vecs = await processSource(id, 'work_experience', text, { company: role.company });
        allVectors.push(...vecs);
      }
    }
  }

  // ── Source 3: projects.json (skipped in incremental mode) ──────────────────
  if (!INCREMENTAL) {
    console.log('\nLoading projects.json...');
    const projPath = path.join(__dirname, '..', 'src', 'data', 'projects.json');
    if (fs.existsSync(projPath)) {
      const projData = JSON.parse(fs.readFileSync(projPath, 'utf-8'));
      for (const project of projData) {
        const text = `
Project: ${project.title}
Technologies: ${project.tech.join(', ')}
GitHub: ${project.github}
      `.trim();

        const id = `project_${project.title.replace(/\s+/g, '_').toLowerCase().slice(0, 30)}`;
        console.log(`\n  Processing: ${id}`);
        const vecs = await processSource(id, 'project', text, { projectTitle: project.title });
        allVectors.push(...vecs);
      }
    }
  }

  // ── Source 4: skills.json (skipped in incremental mode) ───────────────────
  if (!INCREMENTAL) {
    console.log('\nLoading skills.json...');
    const skillsPath = path.join(__dirname, '..', 'src', 'data', 'skills.json');
    if (fs.existsSync(skillsPath)) {
      const skillsData = JSON.parse(fs.readFileSync(skillsPath, 'utf-8'));
      const skillsText = `
Nishan Poojary's Technical Skills:

${skillsData.categories.map((cat, i) =>
  `Skills group ${i + 1}: ${cat.skills.map(s => s.name).join(', ')}`
).join('\n\n')}

Certifications:
${skillsData.certifications.map(c => `- ${c.title} — ${c.org}`).join('\n')}
    `.trim();

      console.log('\n  Processing: skills_data');
      const vecs = await processSource('skills_data', 'skills', skillsText);
      allVectors.push(...vecs);
    }
  }

  // ── Source 5: blog posts ───────────────────────────────────────────────────
  // In incremental mode, BLOG_SLUGS filters which files are processed.
  if (!INCREMENTAL || BLOG_SLUGS !== null) {
    console.log('\nLoading blog posts...');
    const blogsDir = path.join(__dirname, '..', 'src', 'data', 'blogs');
    if (fs.existsSync(blogsDir)) {
      const allBlogFiles = fs.readdirSync(blogsDir).filter(f => f.endsWith('.js') && f !== 'index.js');
      const blogFiles    = BLOG_SLUGS
        ? allBlogFiles.filter(f => BLOG_SLUGS.includes(f.replace('.js', '')))
        : allBlogFiles;

      if (BLOG_SLUGS && blogFiles.length === 0) {
        console.warn(`  [WARN] No matching blog files found for slugs: ${BLOG_SLUGS.join(', ')}`);
      }
    for (const file of blogFiles) {
      const raw = fs.readFileSync(path.join(blogsDir, file), 'utf-8');

      // Extract fields from the JS module without executing it
      const titleMatch   = raw.match(/title:\s*['"`](.+?)['"`]/);
      const excerptMatch = raw.match(/excerpt:\s*['"`](.+?)['"`]/);
      const dateMatch    = raw.match(/date:\s*['"`](.+?)['"`]/);
      const tagsMatch    = raw.match(/tags:\s*\[([^\]]+)\]/);

      // Extract content template literal — strip mermaid fences and markdown syntax
      const contentMatch = raw.match(/content:\s*`([\s\S]*?)`\s*,/);
      if (!contentMatch || !titleMatch) {
        console.log(`  [SKIP] ${file} — could not parse`);
        continue;
      }

      let content = contentMatch[1];
      // eslint-disable-next-line no-useless-escape
      content = content.replace(/```mermaid[\s\S]*?```/g, '');   // strip mermaid blocks
      content = content.replace(/```[\s\S]*?```/g, '');           // strip other code fences
      content = content.replace(/\*+([^*]+)\*+/g, '$1');          // strip bold/italic
      content = content.replace(/^#{1,3} /gm, '');                // strip heading markers
      content = content.replace(/`[^`]+`/g, '');                  // strip inline code

      const tags = tagsMatch
        ? tagsMatch[1].replace(/['"`]/g, '').split(',').map(t => t.trim()).filter(Boolean)
        : [];

      const blogText = `
Blog Post: ${titleMatch[1]}
Published: ${dateMatch ? dateMatch[1] : 'unknown'}
Tags: ${tags.join(', ')}
Summary: ${excerptMatch ? excerptMatch[1] : ''}

${content.trim()}
      `.trim();

      const slug = file.replace('.js', '');
      const id   = `blog_${slug}`;
      console.log(`\n  Processing: ${id}`);
      const vecs = await processSource(id, 'blog_post', blogText, {
        slug,
        title: titleMatch[1],
        tags: tags.join(', '),
      });
      allVectors.push(...vecs);
    }
    } // end if (fs.existsSync(blogsDir))
  } // end if (!INCREMENTAL || BLOG_SLUGS !== null)

  // ── Source 6: cv.json (skipped in incremental mode) ─────────────────────
  if (!INCREMENTAL) {
  console.log('\nLoading cv.json...');
  const cvPath = path.join(__dirname, '..', 'src', 'data', 'cv.json');
  if (fs.existsSync(cvPath)) {
    const cv = JSON.parse(fs.readFileSync(cvPath, 'utf-8'));
    const p  = cv.personal_information;

    // Personal info + work authorisation block
    const personalText = `
Name: ${p.name}
Location: ${p.location}
Work Authorization: ${p.work_authorization}
Email: ${p.email}
Phone: ${p.phone}
GitHub: ${p.github_url}
LinkedIn: ${p.linkedin_url}
Portfolio: ${p.portfolio}
Blog: ${p.blog}
    `.trim();
    console.log('\n  Processing: cv_personal');
    allVectors.push(...await processSource('cv_personal', 'personal_info', personalText));

    // Education block
    const eduText = `
Education:
${cv.education.map(e =>
  `${e.degree} in ${e.field}\n${e.institution}, ${e.city}, ${e.country}\n${e.start} – ${e.end}${e.grade ? ` | Grade: ${e.grade}` : ''}`
).join('\n\n')}
    `.trim();
    console.log('\n  Processing: cv_education');
    allVectors.push(...await processSource('cv_education', 'education', eduText));

    // Languages + certifications block
    const langCertText = `
Languages:
${cv.languages.map(l => `- ${l.language}: ${l.level}${l.notes ? ` (${l.notes})` : ''}`).join('\n')}

Certifications:
${cv.certifications.map(c => `- ${c.title} — ${c.issuer}`).join('\n')}
    `.trim();
    console.log('\n  Processing: cv_lang_certs');
    allVectors.push(...await processSource('cv_lang_certs', 'certifications', langCertText));

    // Professional summary block
    const ps = cv.professional_summary;
    const summaryText = `
Professional Summary:
${ps.years_of_experience} years of experience. ${ps.description}

Core Engineering Philosophy:
${ps.core_philosophy.map(c => `- ${c}`).join('\n')}
    `.trim();
    console.log('\n  Processing: cv_summary');
    allVectors.push(...await processSource('cv_summary', 'professional_summary', summaryText));

    // Detailed work experience from cv.json (richer than experience.json)
    for (const role of (cv.work_experience || [])) {
      const roleText = `
Role: ${role.title} at ${role.company}
Location: ${role.city}, ${role.country}
Period: ${role.start} – ${role.end}
Domain: ${role.domain}

Responsibilities:
${role.responsibilities.map(r => `- ${r}`).join('\n')}

Key Skills: ${role.key_skills.join(', ')}
      `.trim();
      const id = `cv_work_${role.company.replace(/\s+/g, '_').toLowerCase()}`;
      console.log(`\n  Processing: ${id}`);
      allVectors.push(...await processSource(id, 'work_experience', roleText, { company: role.company }));
    }

    // Detailed project entries from cv.json
    for (const proj of (cv.projects || [])) {
      const projText = `
Project: ${proj.name}
Status: ${proj.status}
${proj.timeline ? `Timeline: ${proj.timeline}` : ''}
${proj.production_url ? `Live: ${proj.production_url}` : ''}

Problems Solved:
${(proj.problems_solved || []).map(p => `- ${p}`).join('\n')}

Technical Implementation:
${(proj.technical_implementation || []).map(p => `- ${p}`).join('\n')}

Quantified Results:
${(proj.quantified_results || []).map(p => `- ${p}`).join('\n')}

Skills Demonstrated: ${(proj.skills_demonstrated || []).join(', ')}
      `.trim();
      const id = `cv_proj_${proj.name.replace(/\W+/g, '_').toLowerCase().slice(0, 40)}`;
      console.log(`\n  Processing: ${id}`);
      allVectors.push(...await processSource(id, 'project', projText, { projectTitle: proj.name }));
    }
  } // end if (fs.existsSync(cvPath))
  } // end if (!INCREMENTAL)

  // ── Source 7: profile.json (skipped in incremental mode) ─────────────────
  if (!INCREMENTAL) {
  console.log('\nLoading profile.json...');
  const profilePath = path.join(__dirname, '..', 'src', 'data', 'profile.json');
  if (fs.existsSync(profilePath)) {
    const prof = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));

    const profileText = `
About Nishan Poojary:
Headline: ${prof.narrative.headline}
Summary: ${prof.narrative.exit_story}

Target Roles: ${prof.target_roles.primary.join(', ')}
Role Archetypes: ${prof.target_roles.archetypes.map(a => `${a.name} (${a.level}, ${a.fit} fit)`).join('; ')}

Superpowers:
${prof.narrative.superpowers.map(s => `- ${s}`).join('\n')}

Key Proof Points:
${prof.narrative.proof_points.map(p => `- ${p.name}: ${p.hero_metric}`).join('\n')}

Location: ${prof.location.city}, ${prof.location.country} (${prof.location.timezone})
Work Permit: ${prof.location.visa_status} — ${prof.location.work_permit}
Availability: ${prof.location.availability}
Compensation Target: ${prof.compensation.target_range} ${prof.compensation.currency}
Location Flexibility: ${prof.compensation.location_flexibility}
    `.trim();

    console.log('\n  Processing: profile_narrative');
    allVectors.push(...await processSource('profile_narrative', 'profile', profileText));
  } // end if (fs.existsSync(profilePath))
  } // end if (!INCREMENTAL)

  // ── Upsert all to Pinecone ─────────────────────────────────────────────────
  console.log(`\nUpserting ${allVectors.length} vectors to Pinecone...`);
  await upsertBatched(index, allVectors);

  console.log('\n[OK] Ingestion complete!');
  console.log(`     Total vectors: ${allVectors.length}`);
  console.log(`     Verify at: https://app.pinecone.io\n`);
}

main().catch(err => {
  console.error('\n[ERROR] Ingestion failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
