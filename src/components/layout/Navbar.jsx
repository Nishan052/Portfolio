import { useState, memo, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import scrollTo from "../../utils/scrollTo";
import siteConfig from "../../config/site";
import "./Navbar.css";

const NAV_KEYS = ["about", "experience", "projects", "skills", "contact"];

const Navbar = memo(({ isDark, toggleTheme, scrolled, activeSection }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const navigate     = useNavigate();
  const location     = useLocation();
  const hamburgerRef  = useRef(null);
  const mobileMenuRef = useRef(null);
  const prevMenuOpen  = useRef(false);

  const currentLang = i18n.language;
  const isOnBlog    = location.pathname.startsWith("/blogs");

  const switchLang = useCallback((l) => {
    if (currentLang !== l) i18n.changeLanguage(l);
  }, [currentLang, i18n]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && menuOpen) setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  // Return focus to hamburger when mobile menu closes
  useEffect(() => {
    if (prevMenuOpen.current && !menuOpen && hamburgerRef.current) {
      hamburgerRef.current.focus();
    }
    prevMenuOpen.current = menuOpen;
  }, [menuOpen]);

  // Focus trap: keep Tab/Shift+Tab within mobile menu when open
  useEffect(() => {
    if (!menuOpen || !mobileMenuRef.current) return;
    const menu      = mobileMenuRef.current;
    const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(menu.querySelectorAll(FOCUSABLE));
      if (focusable.length < 2) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [menuOpen]);

  const handleNav = useCallback((id) => {
    if (isOnBlog) {
      navigate("/");
      setTimeout(() => scrollTo(id), 100);
    } else {
      scrollTo(id);
    }
    setMenuOpen(false);
  }, [isOnBlog, navigate]);

  const handleBlogsClick = useCallback(() => {
    navigate("/blogs");
    setMenuOpen(false);
  }, [navigate]);

  return (
    <>
      {/* ── Desktop / main nav bar ─────────────────────────────────────────────── */}
      <nav
        aria-label={t("a11y.primaryNav")}
        className={`navbar${scrolled ? " navbar--scrolled" : ""}`}
      >
        <div className="navbar-inner">

          {/* Logo */}
          <button
            className="logo-btn"
            onClick={() => scrollTo("hero")}
            aria-label={`${siteConfig.profile.firstName} ${siteConfig.profile.lastName} — ${t("a11y.scrollDown")}`}
            type="button"
          >
            <span className="logo-first">{siteConfig.profile.logoFirst}</span>
            <span className="logo-second">{siteConfig.profile.logoSecond}</span>
            <span className="logo-domain">{siteConfig.profile.logoDomain}</span>
          </button>

          {/* Desktop links */}
          <div className="nav-desktop">
            {NAV_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                className={`nav-link ${!isOnBlog && activeSection === key ? "active" : ""}`}
                onClick={() => handleNav(key)}
                aria-current={!isOnBlog && activeSection === key ? "page" : undefined}
              >
                {t(`nav.${key}`)}
              </button>
            ))}
            <button
              type="button"
              className={`nav-blog-btn ${isOnBlog ? "active" : ""}`}
              onClick={handleBlogsClick}
              aria-current={isOnBlog ? "page" : undefined}
            >
              ✦ {t("nav.blog")}
            </button>
          </div>

          {/* Right controls */}
          <div className="nav-controls">

            {/* Language toggle — segmented EN | DE pill */}
            <div
              role="group"
              aria-label={t("a11y.languageToggle")}
              className="lang-toggle"
            >
              {["en", "de"].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => switchLang(l)}
                  aria-label={l === "en" ? t("a11y.switchToEn") : t("a11y.switchToDe")}
                  aria-pressed={currentLang === l}
                  className={`lang-btn ${currentLang === l ? "lang-btn--active" : "lang-btn--inactive"}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label={isDark ? t("a11y.switchToLight") : t("a11y.switchToDark")}
              aria-pressed={isDark}
            >
              <div className={`theme-toggle-knob ${isDark ? "right" : ""}`} aria-hidden="true">
                {isDark ? "🌙" : "☀️"}
              </div>
            </button>

            <button
              ref={hamburgerRef}
              type="button"
              className={`hamburger ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen((p) => !p)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? t("a11y.closeMenu") : t("a11y.openMenu")}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile dropdown ────────────────────────────────────────────────────── */}
      <div
        ref={mobileMenuRef}
        id="mobile-menu"
        className={`mobile-menu ${menuOpen ? "open" : ""}`}
        aria-hidden={!menuOpen}
      >
        {NAV_KEYS.map((key, idx) => (
          <button
            key={key}
            type="button"
            className={`mobile-nav-link ${!isOnBlog && activeSection === key ? "active" : ""}`}
            onClick={() => handleNav(key)}
            aria-current={!isOnBlog && activeSection === key ? "page" : undefined}
            tabIndex={menuOpen ? 0 : -1}
          >
            <span aria-hidden="true" className="mobile-nav-num">0{idx + 1}.</span>
            {t(`nav.${key}`)}
          </button>
        ))}
        <button
          type="button"
          className={`mobile-nav-link ${isOnBlog ? "active" : ""}`}
          onClick={handleBlogsClick}
          aria-current={isOnBlog ? "page" : undefined}
          tabIndex={menuOpen ? 0 : -1}
          style={{ color: "var(--accent)", fontFamily: "'DM Mono',monospace", fontWeight: 700 }}
        >
          <span aria-hidden="true" className="mobile-nav-num">0{NAV_KEYS.length + 1}.</span>
          ✦ {t("nav.blog")}
        </button>

        {/* Language toggle in mobile menu */}
        <div className="mobile-lang-row">
          <div
            role="group"
            aria-label={t("a11y.languageToggle")}
            className="mobile-lang-toggle"
          >
            {["en", "de"].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => switchLang(l)}
                aria-label={l === "en" ? t("a11y.switchToEn") : t("a11y.switchToDe")}
                aria-pressed={currentLang === l}
                tabIndex={menuOpen ? 0 : -1}
                className={`mobile-lang-btn ${currentLang === l ? "lang-btn--active" : "lang-btn--inactive"}`}
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
