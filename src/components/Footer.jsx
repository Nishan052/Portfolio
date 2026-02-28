import { memo } from "react";
import { useLanguage } from "../context/LanguageContext";

/**
 * Site footer — minimal one-liner with copyright.
 */
const Footer = memo(() => {
  const { t } = useLanguage();
  const f = t.footer;
  return (
  <footer style={{
    borderTop: "1px solid var(--border)",
    padding: "26px 24px",
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: 12,
    fontFamily: "'DM Mono', monospace",
    position: "relative",
    zIndex: 1,
    background: "var(--nav-bg)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  }}>
    <div>
      {f.built} <span style={{ color: "var(--accent)" }}>♥</span> {f.by}
    </div>
    <div style={{ marginTop: 4, opacity: 0.4, fontSize: 10 }}>
      © 2026 · Berlin, Germany
    </div>
  </footer>
  );
});

export default Footer;
