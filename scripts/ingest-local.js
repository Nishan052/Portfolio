#!/usr/bin/env node
/**
 * ingest-local.js — Full RAG ingestion pipeline
 * Runs locally with Node.js. Reads portfolio data, creates contextual chunks,
 * embeds them with Ollama, and upserts to Pinecone.
 *
 * Prerequisites:
 *   1. Ollama running: ollama serve
 *   2. Models pulled: ollama pull llama3.2:3b && ollama pull nomic-embed-text
 *   3. .env.local exists with PINECONE_API_KEY and PINECONE_HOST
 *
 * Usage:
 *   node scripts/ingest-local.js           # full run
 *   node scripts/ingest-local.js --clear   # delete existing vectors first
 *   SKIP_CONTEXT=true node scripts/ingest-local.js  # skip LLM context (faster)
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.dev.vars' });

const fs = require('fs');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');
const { chunkText } = require('./lib/chunk');
const { generateContextualChunk } = require('./lib/contextual');

// ─── Config ──────────────────────────────────────────────────────────────────
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_HOST    = process.env.PINECONE_HOST;
const PINECONE_INDEX   = process.env.PINECONE_INDEX || 'portfolio-rag';
const OLLAMA_BASE      = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const EMBED_MODEL      = process.env.EMBED_MODEL || 'nomic-embed-text';
const SKIP_CONTEXT     = process.env.SKIP_CONTEXT === 'true';
const CLEAR_FIRST      = process.argv.includes('--clear');
const BATCH_SIZE       = 100;

// ─── Validate ─────────────────────────────────────────────────────────────────
if (!PINECONE_API_KEY) {
  console.error('❌ PINECONE_API_KEY not set. Add it to .env.local or .dev.vars');
  process.exit(1);
}
if (!PINECONE_HOST) {
  console.error('❌ PINECONE_HOST not set. Add it to .env.local or .dev.vars');
  process.exit(1);
}

// ─── Embed via Ollama ─────────────────────────────────────────────────────────
async function embedText(text) {
  const response = await fetch(`${OLLAMA_BASE}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Ollama embed error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error('Invalid embedding response from Ollama');
  }
  return data.embedding;
}

// ─── Check Ollama availability ────────────────────────────────────────────────
async function checkOllama() {
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error('Not OK');
    const data = await r.json();
    const models = (data.models || []).map(m => m.name);
    const hasEmbed = models.some(m => m.includes('nomic-embed'));
    const hasLLM   = models.some(m => m.includes('llama3') || m.includes('llama'));
    console.log(`✓ Ollama running. Models: ${models.join(', ')}`);
    if (!hasEmbed) {
      console.warn('⚠ nomic-embed-text not found. Run: ollama pull nomic-embed-text');
    }
    if (!hasLLM && !SKIP_CONTEXT) {
      console.warn('⚠ llama3.2:3b not found. Run: ollama pull llama3.2:3b');
      console.warn('  Or set SKIP_CONTEXT=true to skip context generation');
    }
    return { hasEmbed, hasLLM };
  } catch {
    console.error('❌ Ollama not running. Start it with: ollama serve');
    process.exit(1);
  }
}

// ─── Process a source into Pinecone vectors ───────────────────────────────────
async function processSource(sourceId, sourceType, fullText, metadata = {}) {
  const chunks = chunkText(fullText);
  console.log(`  ${chunks.length} chunks`);

  const vectors = [];
  for (const chunk of chunks) {
    let chunkText = chunk.text;

    // Contextual Retrieval: prepend LLM-generated context
    if (!SKIP_CONTEXT) {
      process.stdout.write(`    chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks} context... `);
      chunkText = await generateContextualChunk(fullText, chunk);
      process.stdout.write('✓\n');
    }

    // Embed the contextual chunk
    const embedding = await embedText(chunkText);

    vectors.push({
      id: `${sourceId}_${chunk.chunkIndex}`,
      values: embedding,
      metadata: {
        text: chunkText,
        source: sourceId,
        type: sourceType,
        chunkIndex: chunk.chunkIndex,
        totalChunks: chunk.totalChunks,
        timestamp: new Date().toISOString().split('T')[0],
        ...metadata,
      }
    });
  }

  return vectors;
}

// ─── Batch upsert to Pinecone ─────────────────────────────────────────────────
async function upsertBatched(index, vectors) {
  let total = 0;
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE);
    await index.upsert({ records: batch });
    total += batch.length;
    console.log(`  ↑ Upserted batch ${Math.ceil((i + 1) / BATCH_SIZE)} (${total}/${vectors.length} vectors)`);
  }
}

// ─── Load PDF sources ─────────────────────────────────────────────────────────
async function loadPDFs() {
  const { PDFParse } = require('pdf-parse');
  const ragDataDir = path.join(__dirname, '..', 'ragData');

  if (!fs.existsSync(ragDataDir)) {
    console.log('  No ragData/ directory found, skipping PDFs');
    return [];
  }

  const pdfs = fs.readdirSync(ragDataDir).filter(f => f.endsWith('.pdf'));
  const results = [];

  for (const pdfFile of pdfs) {
    const filePath = path.join(ragDataDir, pdfFile);
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
      console.log(`  ✓ Loaded PDF: ${pdfFile} (${data.total} pages, ${data.text.length} chars)`);
    } catch (err) {
      console.warn(`  ⚠ Failed to parse ${pdfFile}: ${err.message}`);
    }
  }

  return results;
}

// ─── Load GitHub READMEs ──────────────────────────────────────────────────────
async function loadGitHubREADMEs() {
  const { Octokit } = require('@octokit/rest');
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = 'Nishan052';
  const repos = ['Stock-Price-Prediction', 'Routing-app', 'python'];
  const results = [];

  for (const repo of repos) {
    try {
      const { data } = await octokit.repos.getReadme({ owner, repo });
      const text = Buffer.from(data.content, 'base64').toString('utf-8');
      results.push({
        id: `github_${repo.toLowerCase()}`,
        type: 'github_readme',
        text,
        metadata: { repo: `${owner}/${repo}` }
      });
      console.log(`  ✓ Loaded README: ${owner}/${repo} (${text.length} chars)`);
    } catch (err) {
      console.warn(`  ⚠ Could not fetch README for ${owner}/${repo}: ${err.message}`);
    }
  }

  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Portfolio RAG Ingestion Pipeline\n');
  console.log(`Mode: ${SKIP_CONTEXT ? 'Fast (no context generation)' : 'Full (with Contextual Retrieval)'}`);
  console.log(`Clear first: ${CLEAR_FIRST}\n`);

  // Check Ollama
  await checkOllama();

  // Connect to Pinecone
  const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
  const index = pc.index(PINECONE_INDEX, PINECONE_HOST);
  console.log(`✓ Connected to Pinecone index: ${PINECONE_INDEX}`);

  // Optionally clear existing vectors
  if (CLEAR_FIRST) {
    console.log('\n🗑  Clearing existing vectors...');
    await index.deleteAll();
    console.log('  ✓ Cleared all vectors');
  }

  const allVectors = [];

  // ── Source 1: PDFs ──────────────────────────────────────────────────────────
  console.log('\n📄 Loading PDFs from ragData/...');
  const pdfs = await loadPDFs();
  for (const pdf of pdfs) {
    console.log(`\n  Processing: ${pdf.id}`);
    const vecs = await processSource(pdf.id, pdf.type, pdf.text, pdf.metadata);
    allVectors.push(...vecs);
  }

  // ── Source 2: Portfolio Context Markdown ───────────────────────────────────
  console.log('\n📝 Loading portfolio context markdown...');
  const mdPath = path.join(__dirname, '..', 'NishanPoojary_Portfolio_ProjectContext.md');
  if (fs.existsSync(mdPath)) {
    const mdText = fs.readFileSync(mdPath, 'utf-8');
    console.log(`  ${mdText.length} chars`);
    console.log('\n  Processing: context_md');
    const vecs = await processSource('context_md', 'portfolio_context', mdText);
    allVectors.push(...vecs);
  } else {
    console.log('  ⚠ NishanPoojary_Portfolio_ProjectContext.md not found, skipping');
  }

  // ── Source 3: experience.json ──────────────────────────────────────────────
  console.log('\n💼 Loading experience.json...');
  const expPath = path.join(__dirname, '..', 'src', 'data', 'experience.json');
  if (fs.existsSync(expPath)) {
    const expData = JSON.parse(fs.readFileSync(expPath, 'utf-8'));
    // Create one document per role for better context
    for (const role of expData) {
      const text = `
Role: ${role.role}
Company: ${role.company}
Period: ${role.period} to ${role.end} (${role.duration})
Location: ${role.location}
Type: ${role.type}
Skills: ${role.skills.join(', ')}

Key Responsibilities & Achievements:
${role.highlights.map(h => `• ${h}`).join('\n')}
${role.subRoles ? `\nProgression:\n${role.subRoles.map(r => `• ${r.title} (${r.period})`).join('\n')}` : ''}
      `.trim();

      const id = `experience_${role.company.replace(/\s+/g, '_').toLowerCase()}`;
      console.log(`\n  Processing: ${id}`);
      const vecs = await processSource(id, 'work_experience', text, { company: role.company });
      allVectors.push(...vecs);
    }
  }

  // ── Source 4: projects.json ────────────────────────────────────────────────
  console.log('\n🔧 Loading projects.json...');
  const projPath = path.join(__dirname, '..', 'src', 'data', 'projects.json');
  if (fs.existsSync(projPath)) {
    const projData = JSON.parse(fs.readFileSync(projPath, 'utf-8'));
    for (const project of projData) {
      const text = `
Project: ${project.title}
Subtitle: ${project.subtitle}
Category: ${project.category}

Description: ${project.description}

Technologies used: ${project.tech.join(', ')}
Key highlights: ${project.highlights.join(', ')}
GitHub: ${project.github}
      `.trim();

      const id = `project_${project.title.replace(/\s+/g, '_').toLowerCase().slice(0, 30)}`;
      console.log(`\n  Processing: ${id}`);
      const vecs = await processSource(id, 'project', text, { projectTitle: project.title });
      allVectors.push(...vecs);
    }
  }

  // ── Source 5: skills.json ──────────────────────────────────────────────────
  console.log('\n🧠 Loading skills.json...');
  const skillsPath = path.join(__dirname, '..', 'src', 'data', 'skills.json');
  if (fs.existsSync(skillsPath)) {
    const skillsData = JSON.parse(fs.readFileSync(skillsPath, 'utf-8'));
    const skillsText = `
Nishan Poojary's Technical Skills:

${skillsData.categories.map(cat =>
  `${cat.name}:\n${cat.skills.map(s => `• ${s.name}`).join(', ')}`
).join('\n\n')}

Certifications:
${skillsData.certifications.map(c => `• ${c.title} — ${c.org}`).join('\n')}
    `.trim();

    console.log(`\n  Processing: skills_data`);
    const vecs = await processSource('skills_data', 'skills', skillsText);
    allVectors.push(...vecs);
  }

  // ── Source 6: GitHub READMEs ───────────────────────────────────────────────
  console.log('\n🐙 Fetching GitHub READMEs...');
  const readmes = await loadGitHubREADMEs();
  for (const readme of readmes) {
    console.log(`\n  Processing: ${readme.id}`);
    const vecs = await processSource(readme.id, readme.type, readme.text, readme.metadata);
    allVectors.push(...vecs);
  }

  // ── Upsert all to Pinecone ─────────────────────────────────────────────────
  console.log(`\n📤 Upserting ${allVectors.length} vectors to Pinecone...`);
  await upsertBatched(index, allVectors);

  console.log('\n✅ Ingestion complete!');
  console.log(`   Total vectors: ${allVectors.length}`);
  console.log(`   Verify at: https://app.pinecone.io\n`);
}

main().catch(err => {
  console.error('\n❌ Ingestion failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
