import { useState, memo } from "react";
import scrollTo from "../utils/scrollTo";
import { useLanguage } from "../context/LanguageContext";

const NAV_KEYS = ["about", "experience", "projects", "skills", "contact"];

/**
 * Fixed top navigation bar.
 *
 * Props:
 *  isDark        {boolean}  — current theme
 *  toggleTheme   {function} — flip isDark
 *  scrolled      {boolean}  — true when page has scrolled > 20px (shows border)
 *  activeSection {string}   — id of the section currently in view
 *  lang          {string}   — "en" | "de"
 *  toggleLang    {function} — flip lang
 */
const Navbar = memo(({ isDark, toggleTheme, scrolled, activeSection, lang, toggleLang }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();

  const handleNav = (id) => {
    scrollTo(id);
    setMenuOpen(false);
  };

  return (
    <>
      {/* ── Desktop / main nav bar ─────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "var(--nav-bg)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
          transition: "border-color 0.3s ease",
          padding: "0 clamp(16px, 4vw, 32px)",
        }}
      >
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 64,
        }}>

          {/* Logo — clicking goes to hero */}
          <button className="logo-btn" onClick={() => scrollTo("hero")} aria-label="Go to top">
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.15rem", color: "var(--accent)" }}>N</span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.15rem", color: "var(--text)" }}>P</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.57rem", color: "var(--text-muted)", marginLeft: 3 }}>.dev</span>
          </button>

          {/* Desktop links */}
          <div className="nav-desktop" style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {NAV_KEYS.map((key) => (
              <button
                key={key}
                className={`nav-link ${activeSection === key ? "active" : ""}`}
                onClick={() => handleNav(key)}
              >
                {t.nav[key]}
              </button>
            ))}
          </div>

          {/* Right controls: lang toggle + theme toggle + hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

            {/* Language toggle — segmented EN | DE pill */}
            <div style={{
              display: "flex",
              borderRadius: 100,
              border: "1px solid var(--border)",
              overflow: "hidden",
              background: "var(--surface)",
            }}>
              {["en", "de"].map((l) => (
                <button
                  key={l}
                  onClick={() => { if (lang !== l) toggleLang(); }}
                  title={l === "en" ? "Switch to English" : "Auf Deutsch wechseln"}
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    padding: "5px 11px",
                    border: "none",
                    background: lang === l ? "var(--accent)" : "transparent",
                    color: lang === l ? "#fff" : "var(--text-muted)",
                    cursor: lang === l ? "default" : "pointer",
                    transition: "background 0.2s, color 0.2s",
                    lineHeight: 1,
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={toggleTheme}
              className="theme-toggle"
              title={isDark ? "Switch to Day mode" : "Switch to Night mode"}
            >
              <div className={`theme-toggle-knob ${isDark ? "right" : ""}`}>
                {isDark ? "🌙" : "☀️"}
              </div>
            </button>

            <button
              className={`hamburger ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen((p) => !p)}
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile dropdown ────────────────────────────────────────────────────── */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {NAV_KEYS.map((key, idx) => (
          <button
            key={key}
            className={`mobile-nav-link ${activeSection === key ? "active" : ""}`}
            onClick={() => handleNav(key)}
          >
            <span style={{
              color: "var(--accent)",
              fontFamily: "'DM Mono',monospace",
              fontSize: 11, minWidth: 22, opacity: 0.7,
            }}>
              0{idx + 1}.
            </span>
            {t.nav[key]}
          </button>
        ))}

        {/* Language toggle in mobile menu — segmented pill */}
        <div style={{ padding: "10px 24px" }}>
          <div style={{
            display: "inline-flex",
            borderRadius: 100,
            border: "1px solid var(--border)",
            overflow: "hidden",
            background: "var(--surface)",
          }}>
            {["en", "de"].map((l) => (
              <button
                key={l}
                onClick={() => { if (lang !== l) toggleLang(); }}
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  padding: "6px 14px",
                  border: "none",
                  background: lang === l ? "var(--accent)" : "transparent",
                  color: lang === l ? "#fff" : "var(--text-muted)",
                  cursor: lang === l ? "default" : "pointer",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
});

export default Navbar;
