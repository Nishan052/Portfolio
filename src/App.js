// Initialise i18next BEFORE anything else renders
import "./i18n/index.js";

import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

// ── Context & theme ────────────────────────────────────────────────────────────
import { ThemeContext, THEMES } from "./context/ThemeContext";

// ── Hooks ──────────────────────────────────────────────────────────────────────
import useScrollAnimation from "./hooks/useScrollAnimation";
import useParallax        from "./hooks/useParallax";
import useActiveSection   from "./hooks/useActiveSection";

// ── Layout ─────────────────────────────────────────────────────────────────────
import ThreeBackground   from "./components/layout/ThreeBackground";
import FloatingOrbs      from "./components/layout/FloatingOrbs";
import Navbar            from "./components/layout/Navbar";

// ── Sections ───────────────────────────────────────────────────────────────────
import HeroSection       from "./components/sections/HeroSection";
import AboutSection      from "./components/sections/AboutSection";
import ExperienceSection from "./components/sections/ExperienceSection";
import ProjectsSection   from "./components/sections/ProjectsSection";
import SkillsSection     from "./components/sections/SkillsSection";
import ContactSection    from "./components/sections/ContactSection";
import Footer            from "./components/layout/Footer";

// ── UI ─────────────────────────────────────────────────────────────────────────
import ChatWidget        from "./components/ui/ChatWidget";

// ── Pages ──────────────────────────────────────────────────────────────────────
import BlogsList from "./pages/BlogsList/BlogsList";
import BlogPost  from "./pages/BlogPost/BlogPost";

// ── Global styles ──────────────────────────────────────────────────────────────
import "./styles/global.css";

/**
 * Injects CSS custom properties onto :root based on the active theme object.
 */
function applyThemeVars(theme) {
  const root = document.documentElement;
  root.style.setProperty("--bg",              theme.bg);
  root.style.setProperty("--surface",         theme.surface);
  root.style.setProperty("--surface-hover",   theme.surfaceHover);
  root.style.setProperty("--text",            theme.text);
  root.style.setProperty("--text-muted",      theme.textMuted);
  root.style.setProperty("--accent",          theme.accent);
  root.style.setProperty("--accent-soft",     theme.accentSoft);
  root.style.setProperty("--accent2",         theme.accent2);
  root.style.setProperty("--border",          theme.border);
  root.style.setProperty("--nav-bg",          theme.navBg);
  root.style.setProperty("--section-overlay", theme.sectionOverlay);
}

/**
 * Home page — owns animation hooks so they re-run on every mount.
 * This ensures fade-up elements animate correctly after navigating back from /blogs.
 */
function HomePage() {
  useScrollAnimation();
  useParallax();
  return (
    <main id="main-content" style={{ position: "relative", zIndex: 1 }}>
      <HeroSection />
      <AboutSection />
      <ExperienceSection />
      <ProjectsSection />
      <SkillsSection />
      <ContactSection />
      <Footer />
    </main>
  );
}

/**
 * Renders ChatWidget only when not on a blog page.
 * Must be inside BrowserRouter to use useLocation.
 */
function BlogAwareChatWidget() {
  const location = useLocation();
  if (location.pathname.startsWith("/blogs")) return null;
  return <ChatWidget />;
}

/**
 * Inner shell — must be inside BrowserRouter so hooks like
 * useActiveSection (which calls useLocation) work correctly.
 */
function AppShell({ isDark, toggleTheme }) {
  const [scrolled, setScrolled] = useState(false);
  const { t }         = useTranslation();
  const activeSection = useActiveSection();

  // Scroll sentinel for nav border
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      {/* Skip to main content link (WCAG 2.4.1) */}
      <a href="#main-content" className="skip-link">
        {t("a11y.skipToMain")}
      </a>

      {/* Fixed canvas background — shown on all routes */}
      <ThreeBackground isDark={isDark} />
      <FloatingOrbs    isDark={isDark} />

      <Navbar
        isDark={isDark}
        toggleTheme={toggleTheme}
        scrolled={scrolled}
        activeSection={activeSection}
      />

      <Routes>
        {/* ── Home page ─────────────────────────────────────────────── */}
        <Route path="/" element={<HomePage />} />

        {/* ── Blog routes ───────────────────────────────────────────── */}
        <Route path="/blogs"      element={<BlogsList />} />
        <Route path="/blogs/:slug" element={<BlogPost />} />
      </Routes>

      {/* Floating AI chat widget — hidden on blog pages */}
      <BlogAwareChatWidget />
    </>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const { i18n }            = useTranslation();

  const theme = isDark ? THEMES.dark : THEMES.light;

  // Apply CSS variables whenever theme changes
  useEffect(() => { applyThemeVars(theme); }, [theme]);

  // Sync <html lang> attribute with i18n language (WCAG 3.1.1)
  useEffect(() => {
    document.documentElement.lang = i18n.language || "en";
  }, [i18n.language]);

  const toggleTheme = useCallback(() => setIsDark((p) => !p), []);

  return (
    <BrowserRouter>
      <ThemeContext.Provider value={theme}>
        <AppShell isDark={isDark} toggleTheme={toggleTheme} />
      </ThemeContext.Provider>
    </BrowserRouter>
  );
}
