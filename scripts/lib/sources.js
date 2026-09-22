/**
 * sources.js — single definition of everything that belongs in the RAG knowledge base.
 *
 * Both scripts/ingest.js (full rebuild) and scripts/sync-kb.js (incremental sync)
 * load sources from here, so the two can never drift apart. That matters: the
 * source `id` is what makes an existing Pinecone vector recognisable on the next
 * run. If the two callers disagreed on an id, sync would treat already-indexed
 * content as new and duplicate it.
 *
 * Each source is:
 *   { id, type, text, metadata, contentHash }
 *
 * contentHash is a sha256 of the assembled text. Stored in vector metadata, it
 * lets sync-kb.js tell "unchanged" from "edited" without re-embedding anything.
 */

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', '..');

// Hash the exact text we embed, so any edit upstream of chunking is detected.
function contentHash(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16);
}

// Pinecone rejects any vector ID that is not ASCII ("Vector ID must be ASCII").
// IDs are built from names in the data files, and names are not ASCII:
// "Georg Schröder" made every sync fail from the commit that added it.
//
// Only non-ASCII characters change. An ID that is already ASCII comes out byte
// for byte identical, which matters because the ID is how sync recognises a
// vector it has already indexed: changing existing IDs would re-embed them as
// new and prune the old ones as orphans.
const GERMAN = { ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue', ß: 'ss' };
function asciiId(id) {
  return id
    .replace(/[äöüÄÖÜß]/g, c => GERMAN[c])
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')   // é -> e
    .replace(/[^\x20-\x7E]/g, '_');                      // anything left
}

function makeSource(id, type, text, metadata = {}) {
  return { id: asciiId(id), type, text, metadata, contentHash: contentHash(text) };
}

// ─── PDFs in data/ ───────────────────────────────────────────────────────────
async function loadPDFs() {
  const { PDFParse } = require('pdf-parse');
  const dataDir = path.join(ROOT, 'data');

  if (!fs.existsSync(dataDir)) return [];

  const pdfs = fs.readdirSync(dataDir).filter(f => f.endsWith('.pdf'));
  const results = [];

  for (const pdfFile of pdfs) {
    try {
      const buffer = fs.readFileSync(path.join(dataDir, pdfFile));
      const parser = new PDFParse({ data: buffer });
      const data   = await parser.getText();
      const baseName = pdfFile.replace('.pdf', '').replace(/\s+/g, '_').toLowerCase();
      results.push(makeSource(`pdf_${baseName}`, 'pdf', data.text, { filename: pdfFile }));
    } catch (err) {
      console.warn(`  [WARN] Failed to parse ${pdfFile}: ${err.message}`);
    }
  }
  return results;
}

// ─── src/data/blogs/*.js ─────────────────────────────────────────────────────
// Fields are pulled out with regexes rather than by importing the module: these
// are ESM files using webpack's require.context, so plain Node cannot execute them.
// Every blog post's slug, title and date, newest first: the same order the
// blog page uses. The chatbot answers "what is the latest post" from this list,
// because similarity search cannot rank by date.
function listBlogs() {
  const blogsDir = path.join(ROOT, 'src', 'data', 'blogs');
  if (!fs.existsSync(blogsDir)) return [];
  return fs.readdirSync(blogsDir)
    .filter(f => f.endsWith('.js') && f !== 'index.js')
    .map(file => {
      const raw   = fs.readFileSync(path.join(blogsDir, file), 'utf-8');
      const title = raw.match(/title:\s*['"`](.+?)['"`]/);
      const date  = raw.match(/date:\s*['"`](.+?)['"`]/);
      const id    = raw.match(/\bid:\s*(\d+)/);
      // The series tells the model what a post is about. Without it, asked for
      // "posts about edge AI", it guessed from titles and got one wrong.
      const series = raw.match(/series:\s*['"`](.+?)['"`]/);
      const part   = raw.match(/\bpart:\s*(\d+)/);
      if (!title || !date) return null;
      return { slug: file.replace('.js', ''), title: title[1], date: date[1],
               series: series ? series[1] : null, part: part ? Number(part[1]) : null,
               id: id ? Number(id[1]) : 0 };
    })
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .map(({ id, ...post }) => post);
}

// The chatbot's standing facts about work and projects, generated rather than
// typed into the prompt. Typed by hand, they still named a job that ended in
// February 2025 and projects the site no longer shows.
function listRoles() {
  const roles = readJSON('experience.json') || [];
  const tx = siteText('experience');
  return roles.map((r, i) => ({
    role: r.role.replace(/\s*→\s*/g, ' to ').replace(/\s+/g, ' ').trim(),
    company: r.company, period: `${r.period} to ${r.end}`,
    type: tx[i]?.type || null,
    summary: tx[i]?.highlights?.[0] || null,
  }));
}

function listProjects() {
  const projects = readJSON('projects.json') || [];
  const tx = siteText('projects');
  return projects.map((p, i) => ({
    title: p.title, subtitle: tx[i]?.subtitle || null, tech: p.tech.slice(0, 5),
  }));
}

function siteHeadline() {
  return readJSON('..', 'i18n', 'en.json')?.hero?.role || null;
}

function loadBlogs() {
  const blogsDir = path.join(ROOT, 'src', 'data', 'blogs');
  if (!fs.existsSync(blogsDir)) return [];

  const files = fs.readdirSync(blogsDir).filter(f => f.endsWith('.js') && f !== 'index.js');
  const results = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(blogsDir, file), 'utf-8');

    const titleMatch   = raw.match(/title:\s*['"`](.+?)['"`]/);
    const excerptMatch = raw.match(/excerpt:\s*['"`](.+?)['"`]/);
    const dateMatch    = raw.match(/date:\s*['"`](.+?)['"`]/);
    const tagsMatch    = raw.match(/tags:\s*\[([^\]]+)\]/);
    const contentMatch = raw.match(/content:\s*`([\s\S]*?)`\s*,/);

    if (!contentMatch || !titleMatch) {
      console.log(`  [SKIP] ${file} — could not parse`);
      continue;
    }

    // Strip presentation syntax so the embedded text is prose, not markup.
    let content = contentMatch[1];
    content = content.replace(/```mermaid[\s\S]*?```/g, '');
    content = content.replace(/```[\s\S]*?```/g, '');
    content = content.replace(/\*+([^*]+)\*+/g, '$1');
    content = content.replace(/^#{1,3} /gm, '');
    content = content.replace(/`[^`]+`/g, '');

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
    results.push(makeSource(`blog_${slug}`, 'blog_post', blogText, {
      slug,
      title: titleMatch[1],
      tags:  tags.join(', '),
    }));
  }
  return results;
}

// ─── Structured JSON under src/data/ ─────────────────────────────────────────
function readJSON(...segments) {
  const p = path.join(ROOT, 'src', 'data', ...segments);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : null;
}

// What a visitor actually reads about each role and project lives in the
// English translation file, paired with the data files by position, exactly as
// ExperienceSection and ProjectsSection pair them. Without it the knowledge base
// held job titles and tech lists only, so the chatbot could not say what any
// role involved and filled the gap with guesses.
function siteText(section) {
  const en = readJSON('..', 'i18n', 'en.json');
  return en?.[section]?.items || [];
}

function loadExperience() {
  const expData = readJSON('experience.json');
  if (!expData) return [];

  const described = siteText('experience');

  return expData.map((role, i) => {
    const tx = described[i] || {};
    const text = `
Role: ${role.role}
Company: ${role.company}
Period: ${role.period} to ${role.end} (${role.duration})
Location: ${role.location}
${tx.type ? `Type: ${tx.type}\n` : ''}Skills: ${role.skills.join(', ')}
${role.subRoles ? `\nProgression:\n${role.subRoles.map(r => `- ${r.title} (${r.period})`).join('\n')}` : ''}
${tx.highlights?.length ? `\nWhat the role involves:\n${tx.highlights.map(h => `- ${h}`).join('\n')}` : ''}
      `.trim().replace(/\n{3,}/g, '\n\n');

    const id = `experience_${role.company.replace(/\s+/g, '_').toLowerCase()}`;
    return makeSource(id, 'work_experience', text, { company: role.company });
  });
}

function loadProjects() {
  const projData = readJSON('projects.json');
  if (!projData) return [];

  const described = siteText('projects');

  return projData.map((project, i) => {
    const tx = described[i] || {};
    const text = `
Project: ${project.title}${tx.subtitle ? ` (${tx.subtitle})` : ''}
${tx.category ? `Category: ${tx.category}\n` : ''}Technologies: ${project.tech.join(', ')}
GitHub: ${project.github}
${tx.description ? `\n${tx.description}` : ''}
${tx.highlights?.length ? `\nHighlights: ${tx.highlights.join('; ')}` : ''}
      `.trim().replace(/\n{3,}/g, '\n\n');

    const id = `project_${project.title.replace(/\s+/g, '_').toLowerCase().slice(0, 30)}`;
    return makeSource(id, 'project', text, { projectTitle: project.title });
  });
}

function loadSkills() {
  const skillsData = readJSON('skills.json');
  if (!skillsData) return [];

  const skillsText = `
Nishan Poojary's Technical Skills:

${skillsData.categories.map((cat, i) =>
  `Skills group ${i + 1}: ${cat.skills.map(s => s.name).join(', ')}`
).join('\n\n')}

Certifications:
${skillsData.certifications.map(c => `- ${c.title} — ${c.org}`).join('\n')}
    `.trim();

  return [makeSource('skills_data', 'skills', skillsText)];
}

function loadCV() {
  const cv = readJSON('cv.json');
  if (!cv) return [];

  const out = [];
  const p = cv.personal_information;

  out.push(makeSource('cv_personal', 'personal_info', `
Name: ${p.name}
Location: ${p.location}
Work Authorization: ${p.work_authorization}
Email: ${p.email}
Phone: ${p.phone}
GitHub: ${p.github_url}
LinkedIn: ${p.linkedin_url}
Portfolio: ${p.portfolio}
Blog: ${p.blog}
    `.trim()));

  out.push(makeSource('cv_education', 'education', `
Education:
${cv.education.map(e =>
  `${e.degree} in ${e.field}\n${e.institution}, ${e.city}, ${e.country}\n${e.start} – ${e.end}${e.grade ? ` | Grade: ${e.grade}` : ''}`
).join('\n\n')}
    `.trim()));

  out.push(makeSource('cv_lang_certs', 'certifications', `
Languages:
${cv.languages.map(l => `- ${l.language}: ${l.level}${l.notes ? ` (${l.notes})` : ''}`).join('\n')}

Certifications:
${cv.certifications.map(c => `- ${c.title} — ${c.issuer}`).join('\n')}
    `.trim()));

  const ps = cv.professional_summary;
  out.push(makeSource('cv_summary', 'professional_summary', `
Professional Summary:
${ps.years_of_experience} years of experience. ${ps.description}

Core Engineering Philosophy:
${ps.core_philosophy.map(c => `- ${c}`).join('\n')}
    `.trim()));

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
    out.push(makeSource(id, 'work_experience', roleText, { company: role.company }));
  }

  for (const proj of (cv.projects || [])) {
    const projText = `
Project: ${proj.name}
Status: ${proj.status}
${proj.timeline ? `Timeline: ${proj.timeline}` : ''}
${proj.production_url ? `Live: ${proj.production_url}` : ''}

Problems Solved:
${(proj.problems_solved || []).map(x => `- ${x}`).join('\n')}

Technical Implementation:
${(proj.technical_implementation || []).map(x => `- ${x}`).join('\n')}

Quantified Results:
${(proj.quantified_results || []).map(x => `- ${x}`).join('\n')}

Skills Demonstrated: ${(proj.skills_demonstrated || []).join(', ')}
      `.trim();
    const id = `cv_proj_${proj.name.replace(/\W+/g, '_').toLowerCase().slice(0, 40)}`;
    out.push(makeSource(id, 'project', projText, { projectTitle: proj.name }));
  }

  return out;
}

function loadProfile() {
  const prof = readJSON('profile.json');
  if (!prof) return [];

  const profileText = `
About Nishan Poojary:
Headline: ${prof.narrative.headline}
Summary: ${prof.narrative.exit_story}

Target Roles: ${prof.target_roles.primary.join(', ')}
Role Archetypes: ${prof.target_roles.archetypes.map(a => `${a.name} (${a.level}, ${a.fit} fit)`).join('; ')}

Superpowers:
${prof.narrative.superpowers.map(s => `- ${s}`).join('\n')}

Key Proof Points:
${prof.narrative.proof_points.map(x => `- ${x.name}: ${x.hero_metric}`).join('\n')}

Location: ${prof.location.city}, ${prof.location.country} (${prof.location.timezone})
Work Permit: ${prof.location.visa_status} — ${prof.location.work_permit}
Availability: ${prof.location.availability}
Compensation Target: ${prof.compensation.target_range} ${prof.compensation.currency}
Location Flexibility: ${prof.compensation.location_flexibility}
    `.trim();

  return [makeSource('profile_narrative', 'profile', profileText)];
}

/**
 * Load every source that belongs in the knowledge base.
 *
 * @param {object}   opts
 * @param {string[]} [opts.only]    Group filter: 'pdfs' | 'blogs' | 'json'
 * @param {string[]} [opts.sources] Explicit source-id allowlist, applied last
 * @returns {Promise<Array<{id,type,text,metadata,contentHash}>>}
 */
async function loadAllSources({ only = null, sources = null } = {}) {
  const wants = group => !only || only.includes(group);

  const all = [
    ...(wants('pdfs')  ? await loadPDFs() : []),
    ...(wants('blogs') ? loadBlogs()      : []),
    ...(wants('json')  ? [
      ...loadExperience(),
      ...loadProjects(),
      ...loadSkills(),
      ...loadCV(),
      ...loadProfile(),
    ] : []),
  ];

  return sources ? all.filter(s => sources.includes(s.id)) : all;
}

module.exports = { loadAllSources, contentHash, asciiId, listBlogs, listRoles, listProjects, siteHeadline, SOURCE_GROUPS: ['pdfs', 'blogs', 'json'] };
