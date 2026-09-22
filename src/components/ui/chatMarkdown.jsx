import React from 'react';

/**
 * chatMarkdown — render the small slice of Markdown the chatbot writes.
 *
 * The model answers in Markdown, and the widget printed it raw, so a title came
 * out as **Your retriever found the answer**. This turns it into elements.
 *
 * Deliberately tiny rather than a Markdown library: the widget loads on every
 * page, and all it ever needs is bold, italics, inline code, links and lists.
 * It builds React elements and never sets HTML, so nothing the model writes can
 * inject markup. Unfinished syntax mid-stream (a lone "**") shows as plain text
 * until the closing marker arrives, then snaps into place.
 */

// Order matters: bold before italics, so "**x**" is not read as two italics.
const INLINE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\)|\*[^*\s][^*\n]*\*|_[^_\s][^_\n]*_)/g;

function safeHref(url) {
  // Links the model writes go to the open web or to this site, nowhere else.
  if (/^https?:\/\//i.test(url)) return url;
  if (/^(www\.|nishanpoojary\.com)/i.test(url)) return `https://${url}`;
  if (url.startsWith('/')) return url;
  return null;
}

export function renderInline(text, keyPrefix = 'i') {
  const out = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyPrefix}-${n++}`;
    if (tok.startsWith('**') || tok.startsWith('__')) {
      out.push(<strong key={key}>{renderInline(tok.slice(2, -2), key)}</strong>);
    } else if (tok.startsWith('`')) {
      out.push(<code key={key}>{tok.slice(1, -1)}</code>);
    } else if (tok.startsWith('[')) {
      const [, label, url] = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = safeHref(url);
      out.push(href
        ? <a key={key} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
        : label);
    } else {
      out.push(<em key={key}>{renderInline(tok.slice(1, -1), key)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const BULLET = /^\s*[-*•]\s+/;
const NUMBER = /^\s*\d+[.)]\s+/;
const INDENT = /^\s{2,}\S/;

/**
 * Group lines into paragraphs and lists. Line by line rather than per block,
 * because the model mixes them without blank lines: a bold heading, then
 * bullets, each followed by an indented description that belongs to it.
 */
function toBlocks(text) {
  const blocks = [];
  let cur = null;
  const close = () => { if (cur) blocks.push(cur); cur = null; };

  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    if (!line.trim()) { close(); continue; }
    const kind = BULLET.test(line) ? 'ul' : NUMBER.test(line) ? 'ol' : null;
    if (kind) {
      if (!cur || cur.type !== kind) { close(); cur = { type: kind, items: [] }; }
      cur.items.push([line.replace(kind === 'ol' ? NUMBER : BULLET, '')]);
    } else if (cur && cur.type !== 'p' && INDENT.test(line)) {
      cur.items[cur.items.length - 1].push(line.trim());   // continues the item
    } else {
      if (!cur || cur.type !== 'p') { close(); cur = { type: 'p', lines: [] }; }
      cur.lines.push(line.trim());
    }
  }
  close();
  return blocks;
}

const withBreaks = (lines, key) => lines.map((l, i) => (
  <React.Fragment key={i}>
    {i > 0 && <br />}
    {renderInline(l, `${key}-${i}`)}
  </React.Fragment>
));

export default function ChatMarkdown({ text }) {
  if (!text) return null;
  return toBlocks(text).map((block, b) => {
    if (block.type === 'p') {
      return <p key={b} className="chat-md-p">{withBreaks(block.lines, b)}</p>;
    }
    const Tag = block.type;
    return (
      <Tag key={b} className="chat-md-list">
        {block.items.map((lines, i) => <li key={i}>{withBreaks(lines, `${b}-${i}`)}</li>)}
      </Tag>
    );
  });
}
