import "./SiteBackdrop.css";

/**
 * A quiet, CSS-only backdrop for reading pages: two soft colour washes and a faint dot grid on the
 * page colour. The home deck has its own WebGL field; this is what the blog gets instead, so a long
 * article never pays for a canvas.
 */
export default function SiteBackdrop() {
  return <div className="site-backdrop" aria-hidden="true" />;
}
