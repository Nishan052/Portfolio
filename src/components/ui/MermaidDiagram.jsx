import { useEffect, useState, useId, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { LuX } from 'react-icons/lu';
import { ThemeContext } from '../../context/ThemeContext';

/*
 * ── Diagram palette ─────────────────────────────────────────────────────────
 * One place decides what a diagram looks like, in both themes.
 *
 * A post says what a node *means* — `class D bad` — and never what colour it
 * is, because a colour written into an article is a colour that cannot follow
 * the reader into light mode. The four class names come from
 * design/DIAGRAM_BOOK.md in the edge-agents repository:
 *
 *   step   an ordinary stage, the default
 *   good   the path that works, the answer
 *   bad    where it breaks, the cost
 *   muted  context that is present but is not the subject
 */
const PALETTE = {
  dark: {
    surface:     '#0b1220',   // the board; matches .mermaid-wrap exactly
    line:        '#00e5ff',
    text:        '#e2e8f0',
    clusterBkg:  'rgba(148,163,184,0.05)',
    clusterEdge: 'rgba(148,163,184,0.22)',
    title:       '#94a3b8',
    step:        { fill: '#111a2e', stroke: '#334155' },
    good:        { fill: '#0d2b33', stroke: '#00e5ff' },
    bad:         { fill: '#241033', stroke: '#a855f7' },
    muted:       { fill: '#0d1117', stroke: '#1f2937', text: '#64748b' },
  },
  light: {
    surface:     '#f2f6ff',
    line:        '#2563eb',
    text:        '#0f172a',
    clusterBkg:  'rgba(15,23,42,0.03)',
    clusterEdge: 'rgba(15,23,42,0.12)',
    title:       '#475569',
    step:        { fill: '#f1f5f9', stroke: '#cbd5e1' },
    good:        { fill: '#e0f2fe', stroke: '#2563eb' },
    bad:         { fill: '#f3e8ff', stroke: '#7c3aed' },
    muted:       { fill: '#f8fafc', stroke: '#e2e8f0', text: '#94a3b8' },
  },
};

/**
 * Prepend a per-diagram init directive and the class definitions for this
 * theme, after removing any the post carried.
 *
 * Per-diagram rather than mermaid.initialize(), because initialize() is global
 * and several diagrams render at once on a post: whichever finished last would
 * decide the colours for all of them.
 */
function themeConfig(mode) {
  const p = PALETTE[mode] || PALETTE.dark;
  return {
    startOnLoad: false,
    fontSize: 15,
    theme: 'base',
    flowchart: { nodeSpacing: 50, rankSpacing: 60, padding: 20, useMaxWidth: true, wrappingWidth: 150 },
    sequence:  { useMaxWidth: true },
    themeVariables: {
      background:          p.surface,
      mainBkg:             p.step.fill,
      primaryColor:        p.step.fill,
      primaryTextColor:    p.text,
      primaryBorderColor:  p.step.stroke,
      lineColor:           p.line,
      textColor:           p.text,
      titleColor:          p.title,
      clusterBkg:          p.clusterBkg,
      clusterBorder:       p.clusterEdge,
      edgeLabelBackground: p.surface,
      nodeTextColor:       p.text,
      fontFamily:          "'Outfit', system-ui, sans-serif",
      fontSize:            '15px',
    },
  };
}

/**
 * Strip any class colours the post carried and append this theme's.
 *
 * A post says what a node *means* and never what colour it is, so the same
 * markdown renders correctly in both themes.
 */
function themed(definition, mode) {
  const p = PALETTE[mode] || PALETTE.dark;

  // classDef belongs to flowcharts. A sequenceDiagram rejects it outright, and
  // appending it to one rendered "Syntax error in text" on every sequence
  // diagram in the blog.
  const kind = definition.trim().split(/\s|\n/)[0];
  if (kind !== 'flowchart' && kind !== 'graph') return definition;

  const cls = (name, c, textColor) =>
    `  classDef ${name} fill:${c.fill},stroke:${c.stroke},stroke-width:${
      name === 'step' ? '1.5px' : name === 'muted' ? '1px' : '2px'
    },color:${textColor || p.text}`;

  const body = definition
    .split('\n')
    .filter((l) => !/^\s*classDef\s+(step|good|bad|muted)\b/.test(l))
    .join('\n');

  return [
    body,
    cls('step', p.step),
    cls('good', p.good),
    cls('bad', p.bad),
    cls('muted', p.muted, p.muted.text),
  ].join('\n');
}

// ── Mermaid, loaded once ─────────────────────────────────────────────────────
// initialize() is global and decides colours, so it is called per render from
// inside renderQueue rather than here: a page holds several diagrams and the
// reader can change theme under them.
let mermaidPromise = null;
/** Serialises every render on the page; see the render effect for why. */
let renderQueue = Promise.resolve();
function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(async (m) => {
      const mermaid = m.default;

      // Icon shapes. The pack is the same Lucide set the videos use, so a
      // diagram and a video of the same idea share one icon language. Loaded
      // lazily alongside mermaid itself, so it costs nothing until a post with
      // a diagram is opened.
      try {
        mermaid.registerIconPacks([
          { name: 'lucide', loader: () => import('@iconify-json/lucide').then((i) => i.icons) },
        ]);
      } catch {
        // An older mermaid has no icon support. Diagrams without icons still render.
      }

      // Layout only. Every colour arrives per diagram, from the %%{init}%%
      // directive `themed()` prepends, because a colour fixed here is a colour
      // that survives into light mode: hardcoding lineColor left cyan arrows
      // and dark label backgrounds on a white page.
      mermaid.initialize({
        startOnLoad: false,
        fontSize: 15,
        // useMaxWidth scales the SVG down to the column instead of letting it
        // overflow behind a horizontal scrollbar. A diagram you have to scroll
        // sideways is not read at a glance, which is the only way these are read.
        // Full size is still one click away in the expand modal.
        flowchart: { nodeSpacing: 50, rankSpacing: 60, padding: 20, useMaxWidth: true, wrappingWidth: 150 },
        sequence:  { useMaxWidth: true },
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

// ── SVG expand icon (no emoji) ────────────────────────────────────────────────
function ExpandIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MermaidDiagram({ definition, caption }) {
  const theme = useContext(ThemeContext);
  const mode  = theme?.name === 'light' ? 'light' : 'dark';
  const source = useMemo(() => themed(definition, mode), [definition, mode]);
  // Handed to CSS so label knockouts and act headings use the same colours the
  // SVG was rendered with, in whichever theme the reader has chosen.
  const vars = useMemo(() => {
    const p = PALETTE[mode] || PALETTE.dark;
    return {
      '--diagram-surface': p.surface,
      '--diagram-title': p.title,
      '--diagram-cluster': p.clusterBkg,
      '--diagram-cluster-edge': p.clusterEdge,
    };
  }, [mode]);
  const [svg, setSvg]   = useState('');
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const uid = useId().replace(/:/g, '');

  // Lock scroll and handle Escape when modal is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  // Render diagram
  useEffect(() => {
    if (!definition) return;
    let cancelled = false;

    // mermaid.initialize() is global, so the colours belong to whichever call
    // ran last. Queueing every render behind the previous one means each
    // diagram is initialised and drawn as one uninterrupted step.
    renderQueue = renderQueue.then(async () => {
      const mermaid = await getMermaid();
      try {
        mermaid.initialize(themeConfig(mode));
        const { svg: rendered } = await mermaid.render(`mermaid-${uid}-${mode}`, source);
        if (cancelled) return;

        // Give the ROOT svg its viewBox size as real width and height, so it
        // sizes like an <img>: scaled down to fit the column, never stretched
        // up. Only the root: a diagram carries one nested <svg> per icon, and
        // an SVG with no width and no height fills its whole viewport, so
        // stripping those attributes globally drew every Lucide glyph at the
        // size of the entire diagram.
        const processed = rendered.replace(
          /^([\s\S]*?)<svg\b([^>]*)>/i,
          (_m, before, attrs) => {
            const vb = /viewBox="[\d.\-]+ [\d.\-]+ ([\d.]+) ([\d.]+)"/.exec(attrs);
            let a = attrs
              .replace(/\s+style="[^"]*max-width:[^"]*"/i, '')
              .replace(/\s+width="[^"]*"/i, '')
              .replace(/\s+height="[^"]*"/i, '');
            if (vb) {
              a = ` width="${Math.round(+vb[1])}" height="${Math.round(+vb[2])}"` + a;
            }
            return `${before}<svg${a}>`;
          },
        );

        setSvg(processed);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    });

    return () => { cancelled = true; };
  }, [source, uid, mode]);

  if (error) return (
    <div style={{
      background: '#1e0a0a', border: '1px solid #7f1d1d',
      borderRadius: 8, padding: '12px 16px', color: '#fca5a5',
      fontSize: '0.8rem', fontFamily: "'DM Mono', monospace",
    }}>
      Diagram error: {error}
    </div>
  );

  if (!svg) return (
    <div style={{
      textAlign: 'center', padding: '32px',
      color: 'var(--text-muted)', fontSize: '0.85rem',
    }}>
      Loading diagram…
    </div>
  );

  return (
    <>
      <figure className="mermaid-figure">
        {/* .mermaid-frame is the position context so the expand button
            stays fixed at the bottom-right of the visible frame even
            while the user scrolls inside .mermaid-wrap */}
        <div className="mermaid-frame">
          <div className="mermaid-wrap" style={vars}>
            <div dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
          <button
            className="mermaid-expand-btn"
            onClick={() => setOpen(true)}
            aria-label="Expand diagram to full screen"
          >
            <ExpandIcon />
            <span>expand</span>
          </button>
        </div>
        {caption && (
          <figcaption className="mermaid-caption">{caption}</figcaption>
        )}
      </figure>

      {open && createPortal(
        <div
          className="mermaid-modal-overlay"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Diagram full view"
        >
          <button
            className="mermaid-modal-close"
            onClick={() => setOpen(false)}
            aria-label="Close diagram"
          >
            <LuX size={16} aria-hidden="true" />
          </button>
          <div
            className="mermaid-modal-content"
            style={vars}
            onClick={(e) => e.stopPropagation()}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>,
        document.body
      )}
    </>
  );
}
