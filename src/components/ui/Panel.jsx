import { useEffect, useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { LuX } from 'react-icons/lu';
import { ThemeContext } from '../../context/ThemeContext';
import './Panel.css';

/**
 * A diagram panel: an SVG built by edge-agents' render_panel.py and inlined
 * into the page.
 *
 * Inlined, not <img>. The SVG carries structure and CSS classes but no colours
 * and no font files, so it needs the page's stylesheet and webfonts to look
 * like anything. An <img> is an isolated document and would get neither, which
 * would also mean shipping a second copy of every panel for light mode.
 */
export default function Panel({ src, alt }) {
  const theme = useContext(ThemeContext);
  const mode = theme?.name === 'light' ? 'light' : 'dark';
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${r.status} ${src}`))))
      .then((t) => { if (!cancelled) setSvg(t); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [src]);

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

  if (error) {
    return <div className="panel-error">Panel failed to load: {error}</div>;
  }
  if (!svg) {
    return <div className="panel-loading">Loading diagram…</div>;
  }

  return (
    <>
      <figure className="panel-figure">
        <div className="panel-frame">
          <div
            className="panel-holder"
            data-theme={mode}
            role="img"
            aria-label={alt || 'Diagram'}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <button
            className="panel-expand-btn"
            onClick={() => setOpen(true)}
            aria-label="Expand diagram to full screen"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            <span>expand</span>
          </button>
        </div>
        {/* The visible caption is the article's own italic line beneath the
            figure, the same convention every other post uses. `alt` is the
            accessible description and is not shown twice. */}
      </figure>

      {open && createPortal(
        <div
          className="panel-modal-overlay"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Diagram full view"
        >
          <button
            className="panel-modal-close"
            onClick={() => setOpen(false)}
            aria-label="Close diagram"
          >
            <LuX size={16} aria-hidden="true" />
          </button>
          <div
            className="panel-modal-content panel-holder"
            data-theme={mode}
            onClick={(e) => e.stopPropagation()}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>,
        document.body,
      )}
    </>
  );
}
