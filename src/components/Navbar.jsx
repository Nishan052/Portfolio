import { useState, memo } from "react";
import scrollTo from "../utils/scrollTo";
import { useLanguage } from "../context/LanguageContext";

/**
 * Fixed top navigation bar.
 *
 * Props:
 *  isDark        {boolean}  — current theme
 *  toggleTheme   {function} — flip isDark
 *  scrolled      {boolean}  — true when page has scrolled > 20px (shows border)
 *  activeSection {string}   — id of the section currently in view
 */
const Navbar = memo(({ isDark, toggleTheme, scrolled, activeSection }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const NAV_ITEMS = t.nav.items;

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
          <button className="logo-btn" onClick={() => scrollTo("hero")} aria-label={t.nav.logoAriaLabel}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.15rem", color: "var(--accent)" }}>N</span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.15rem", color: "var(--text)" }}>P</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.57rem", color: "var(--text-muted)", marginLeft: 3 }}>.dev</span>
          </button>

          {/* Desktop links */}
          <div className="nav-desktop" style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {NAV_ITEMS.map((id) => (
              <button
                key={id}
                className={`nav-link ${activeSection === id ? "active" : ""}`}
                onClick={() => handleNav(id)}
              >
                {t.nav.labels[id]}
              </button>
            ))}
          </div>

          {/* Right controls: language toggle + theme toggle + hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

            {/* EN | DE language toggle */}
            <button
              onClick={() => setLang(lang === "en" ? "de" : "en")}
              aria-label={t.nav.langToggleAriaLabel}
              style={{
                fontFamily:    "'DM Mono',monospace",
                fontSize:      "0.72rem",
                letterSpacing: 1,
                color:         "var(--text-muted)",
                background:    "none",
                border:        "1px solid var(--border)",
                borderRadius:  6,
                padding:       "3px 9px",
                cursor:        "pointer",
                transition:    "color 0.2s, border-color 0.2s",
                whiteSpace:    "nowrap",
              }}
            >
              {lang === "en"
                ? <><span style={{ color: "var(--accent)" }}>EN</span> | DE</>
                : <>EN | <span style={{ color: "var(--accent)" }}>DE</span></>
              }
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              title={isDark ? t.nav.themeToggleDark : t.nav.themeToggleLight}
            >
              <div className={`theme-toggle-knob ${isDark ? "right" : ""}`}>
                {isDark ? "🌙" : "☀️"}
              </div>
            </button>

            <button
              className={`hamburger ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen((p) => !p)}
              aria-label={t.nav.hamburgerAriaLabel}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile dropdown ────────────────────────────────────────────────────── */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {NAV_ITEMS.map((id, idx) => (
          <button
            key={id}
            className={`mobile-nav-link ${activeSection === id ? "active" : ""}`}
            onClick={() => handleNav(id)}
          >
            <span style={{
              color: "var(--accent)",
              fontFamily: "'DM Mono',monospace",
              fontSize: 11, minWidth: 22, opacity: 0.7,
            }}>
              0{idx + 1}.
            </span>
            {t.nav.labels[id]}
          </button>
        ))}
      </div>
    </>
  );
});

export default Navbar;
