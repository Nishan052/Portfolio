/**
 * chunk.js — Text chunking utility for ingestion pipeline
 * Splits text into overlapping chunks of ~800 tokens (1 token ≈ 4 chars)
 */

const MAX_CHARS = 3200;   // ~800 tokens
const OVERLAP_CHARS = 600; // ~150 tokens overlap

/**
 * Chunk a text string into overlapping segments.
 * @param {string} text - Full document text
 * @returns {{ text: string, chunkIndex: number, totalChunks: number }[]}
 */
function chunkText(text) {
  if (!text || text.trim().length === 0) return [];

  // Normalize whitespace
  const normalized = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  if (normalized.length <= MAX_CHARS) {
    return [{ text: normalized, chunkIndex: 0, totalChunks: 1 }];
  }

  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    let end = start + MAX_CHARS;

    if (end >= normalized.length) {
      // Last chunk — take the rest
      chunks.push(normalized.slice(start).trim());
      break;
    }

    // Try to break at a paragraph boundary first
    let breakAt = normalized.lastIndexOf('\n\n', end);
    if (breakAt <= start + MAX_CHARS / 2) {
      // No good paragraph break — try sentence boundary
      breakAt = normalized.lastIndexOf('. ', end);
      if (breakAt <= start + MAX_CHARS / 2) {
        // No good sentence break — try newline
        breakAt = normalized.lastIndexOf('\n', end);
        if (breakAt <= start + MAX_CHARS / 2) {
          // No good break — just cut at max
          breakAt = end;
        }
      }
    }

    const chunk = normalized.slice(start, breakAt + 1).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move start forward, respecting overlap
    start = Math.max(start + 1, breakAt + 1 - OVERLAP_CHARS);
  }

  const totalChunks = chunks.length;
  return chunks.map((text, chunkIndex) => ({ text, chunkIndex, totalChunks }));
}

module.exports = { chunkText };
