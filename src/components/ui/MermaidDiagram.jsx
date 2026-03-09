import { useEffect, useState, useId } from 'react';
import { createPortal } from 'react-dom';

// ── Initialize Mermaid once at module level ──────────────────────────────────
// Calling mermaid.initialize() inside each component causes race conditions
// when multiple diagrams render simultaneously on the same page.
let mermaidPromise = null;
function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((m) => {
      const mermaid = m.default;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        fontSize: 15,
        flowchart: { nodeSpacing: 50, rankSpacing: 60, padding: 15, useMaxWidth: false },
        sequence:  { useMaxWidth: false },
        themeVariables: {
          background:          '#0d1117',
          primaryColor:        '#1e293b',
          primaryTextColor:    '#e2e8f0',
          primaryBorderColor:  '#334155',
          lineColor:           '#00e5ff',
          secondaryColor:      '#1e293b',
          tertiaryColor:       '#1e293b',
          edgeLabelBackground: '#0d1117',
          fontFamily:          "'Outfit', sans-serif",
          fontSize:            '15px',
        },
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

    getMermaid().then(async (mermaid) => {
      try {
        const { svg: rendered } = await mermaid.render(`mermaid-${uid}`, definition);
        if (cancelled) return;

        // Strip Mermaid's hardcoded pixel constraints — CSS controls sizing
        const processed = rendered
          .replace(/(<svg[^>]*)\s+style="[^"]*max-width:[^"]*"/gi, '$1')
          .replace(/(<svg[^>]*)\s+width="[\d.]+px?"/gi, '$1')
          .replace(/(<svg[^>]*)\s+height="[\d.]+px?"/gi, '$1');

        setSvg(processed);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    });

    return () => { cancelled = true; };
  }, [definition, uid]);

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
          <div className="mermaid-wrap">
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
            ✕
          </button>
          <div
            className="mermaid-modal-content"
            onClick={(e) => e.stopPropagation()}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>,
        document.body
      )}
    </>
  );
}
