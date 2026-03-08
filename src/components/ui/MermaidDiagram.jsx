import { useEffect, useRef, useState, useId } from 'react';

/**
 * Lazily initialises Mermaid and renders a diagram from a definition string.
 * Post-processes the rendered SVG to strip Mermaid's hardcoded pixel dimensions
 * so CSS can control the actual display size (fully responsive).
 */
export default function MermaidDiagram({ definition, caption }) {
  const ref                   = useRef(null);
  const [svg, setSvg]         = useState('');
  const [error, setError]     = useState(null);
  const uid = useId().replace(/:/g, '');   // mermaid ids can't contain colons

  useEffect(() => {
    if (!definition) return;

    let cancelled = false;

    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          fontSize: 16,
          themeVariables: {
            background:          '#0d1117',
            primaryColor:        '#00e5ff',
            primaryTextColor:    '#e2e8f0',
            primaryBorderColor:  '#1e293b',
            lineColor:           '#00e5ff',
            secondaryColor:      '#1e293b',
            tertiaryColor:       '#1e293b',
            edgeLabelBackground: '#0d1117',
            fontFamily:          "'Outfit', sans-serif",
            fontSize:            '16px',
          },
        });

        const { svg: rendered } = await mermaid.render(`mermaid-${uid}`, definition);

        if (cancelled) return;

        // Strip Mermaid's hardcoded pixel constraints so CSS controls the size
        const processed = rendered
          // Remove style="max-width: NNNpx;" from the <svg> tag
          .replace(/(<svg[^>]*)\s+style="[^"]*max-width:[^"]*"/gi, '$1')
          // Remove explicit width="NNNpx" from the <svg> tag
          .replace(/(<svg[^>]*)\s+width="[\d.]+px?"/gi, '$1')
          // Remove explicit height="NNNpx" from the <svg> tag (let viewBox drive it)
          .replace(/(<svg[^>]*)\s+height="[\d.]+px?"/gi, '$1')
          // Inject width="100%" so the SVG fills its container
          .replace('<svg ', '<svg width="100%" ');

        setSvg(processed);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();

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
    <figure className="mermaid-figure">
      <div className="mermaid-wrap">
        <div ref={ref} dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
      {caption && (
        <figcaption className="mermaid-caption">{caption}</figcaption>
      )}
    </figure>
  );
}
