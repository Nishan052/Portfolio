/**
 * chunk.js — Smart paragraph-based chunking for the RAG ingestion pipeline
 *
 * Strategy:
 *   1. Split on double-newlines (paragraph boundaries).
 *   2. Classify each paragraph: heading | subheading | content
 *   3. Headings/subheadings attach to the content block that follows them.
 *   4. Related consecutive content paragraphs are merged into one chunk.
 *   5. keywords (top single words) and keyTerms (top multi-word phrases) are
 *      extracted algorithmically — no LLM required.
 *
 * Each chunk: { text, paragraphType, keywords, keyTerms, chunkIndex, totalChunks }
 */

// ─── Stop words ───────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','was','are','were','be','been','being','have','has','had','do',
  'does','did','will','would','could','should','may','might','must','shall',
  'can','it','its','this','that','these','those','i','we','you','he','she',
  'they','as','not','no','so','if','than','then','when','where','how','what',
  'which','who','whom','all','each','every','both','few','more','most','other',
  'some','such','up','out','about','into','through','during','before','after',
  'between','under','within','across','per','also','only','just','well','very',
  'our','their','his','her','your','my','any','there','here','using','used',
  'use','new','one','two','three','four','five','six','seven','eight',
]);

// Words that signal a paragraph continues the previous one
const CONTINUERS = new Set([
  'furthermore','additionally','moreover','besides','however','nevertheless',
  'nonetheless','consequently','therefore','thus','hence','accordingly',
  'meanwhile','subsequently','specifically','notably','similarly','likewise',
  'conversely','instead','otherwise','finally','lastly',
]);

// ─── Keyword extraction ───────────────────────────────────────────────────────

function extractKeywords(text, topN = 8) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

function extractKeyTerms(text, topN = 6) {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);

  const freq = {};
  for (let i = 0; i < tokens.length - 1; i++) {
    const w1 = tokens[i];
    const w2 = tokens[i + 1];
    if (STOP_WORDS.has(w1) || STOP_WORDS.has(w2)) continue;
    const bigram = `${w1} ${w2}`;
    freq[bigram] = (freq[bigram] || 0) + 1;

    if (i < tokens.length - 2) {
      const w3 = tokens[i + 2];
      if (!STOP_WORDS.has(w3)) {
        const trigram = `${w1} ${w2} ${w3}`;
        freq[trigram] = (freq[trigram] || 0) + 1;
      }
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([term]) => term);
}

// ─── Paragraph classification ─────────────────────────────────────────────────

function classifyParagraph(para) {
  const trimmed   = para.trim();
  const lines     = trimmed.split('\n');
  const words     = trimmed.split(/\s+/);
  const wordCount = words.length;
  const charCount = trimmed.length;

  // Multi-line blocks are always content
  if (lines.length > 2) return 'content';

  const endsWithSentence = /[.!?]$/.test(lines[0].trim());
  const isAllCaps   = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
  const upperWords  = words.filter(w => w.length > 3 && /^[A-Z]/.test(w));
  const isTitleCase = upperWords.length >= Math.max(1, Math.floor(wordCount * 0.6));
  const isNumbered  = /^(\d+\.|[IVXLC]+\.|\*|•|-)/.test(trimmed);

  if (charCount <= 60 && wordCount <= 6 && !endsWithSentence) {
    return isAllCaps || isTitleCase ? 'heading' : 'subheading';
  }
  if (charCount <= 100 && wordCount <= 10 && !endsWithSentence && !isNumbered) {
    return 'subheading';
  }
  return 'content';
}

// ─── Relatedness check ────────────────────────────────────────────────────────

function isRelated(paraA, paraB) {
  const opener = paraB.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
  if (CONTINUERS.has(opener)) return true;

  const kA = new Set(extractKeywords(paraA, 15));
  const kB = new Set(extractKeywords(paraB, 15));
  return [...kA].filter(w => kB.has(w)).length >= 2;
}

// ─── Main export ──────────────────────────────────────────────────────────────

const MAX_GROUP_CHARS = 1200;

/**
 * Split a document into smart paragraph chunks with embedded metadata.
 *
 * @param {string} text
 * @returns {{
 *   text:          string,
 *   paragraphType: 'heading'|'subheading'|'content',
 *   keywords:      string[],
 *   keyTerms:      string[],
 *   chunkIndex:    number,
 *   totalChunks:   number,
 * }[]}
 */
function chunkText(text) {
  if (!text || text.trim().length === 0) return [];

  const normalized = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const rawParas   = normalized.split('\n\n').map(p => p.trim()).filter(Boolean);
  const classified = rawParas.map(p => ({ text: p, type: classifyParagraph(p) }));

  const groups = [];
  let i = 0;

  while (i < classified.length) {
    const cur = classified[i];

    if (cur.type === 'heading' || cur.type === 'subheading') {
      // Accumulate consecutive headings/subheadings
      let header = cur.text;
      let j = i + 1;
      while (j < classified.length &&
             (classified[j].type === 'heading' || classified[j].type === 'subheading')) {
        header += '\n' + classified[j].text;
        j++;
      }

      if (j < classified.length && classified[j].type === 'content') {
        // Fuse heading with its content block
        groups.push({ text: header + '\n\n' + classified[j].text, type: 'content' });
        i = j + 1;
      } else {
        // Orphan heading — append to previous group or keep solo
        if (groups.length > 0) {
          groups[groups.length - 1].text += '\n\n' + header;
        } else {
          groups.push({ text: header, type: 'heading' });
        }
        i = j;
      }
      continue;
    }

    // Content — merge with following related paragraphs up to size cap
    let body = cur.text;
    let j = i + 1;
    while (
      j < classified.length &&
      classified[j].type === 'content' &&
      body.length < MAX_GROUP_CHARS &&
      isRelated(body, classified[j].text)
    ) {
      body += '\n\n' + classified[j].text;
      j++;
    }

    groups.push({ text: body, type: 'content' });
    i = j;
  }

  const totalChunks = groups.length;
  return groups.map((g, chunkIndex) => ({
    text:          g.text,
    paragraphType: g.type,
    keywords:      extractKeywords(g.text),
    keyTerms:      extractKeyTerms(g.text),
    chunkIndex,
    totalChunks,
  }));
}

module.exports = { chunkText };
