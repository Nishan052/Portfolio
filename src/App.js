// Initialise i18next BEFORE anything else renders
import "./i18n/index.js";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

// ── Context & theme ────────────────────────────────────────────────────────────
import { ThemeContext, THEMES } from "./context/ThemeContext";

// ── Hooks ──────────────────────────────────────────────────────────────────────
import useScrollAnimation from "./hooks/useScrollAnimation";
import useParallax        from "./hooks/useParallax";
import useActiveSection   from "./hooks/useActiveSection";

// ── Layout ─────────────────────────────────────────────────────────────────────
import FloatingOrbs      from "./components/layout/FloatingOrbs";
import Navbar            from "./components/layout/Navbar";
import SiteBar           from "./components/layout/SiteBar";
import SiteBackdrop      from "./components/layout/SiteBackdrop";

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

// ── Home deck (particle scene deck) ─────────────────────────────────────────────
import DeckPage from "./deck/DeckPage";

// ── Global styles ──────────────────────────────────────────────────────────────
import "./styles/tokens.css";
import "./styles/global.css";

// ThreeBackground is lazy-loaded — Three.js (304 KiB) should not block initial render
const ThreeBackground = lazy(() => import("./components/layout/ThreeBackground"));

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
 * The older full-width chrome (skip link, 3D background, orbs, Navbar) that only the classic home
 * page still uses. Owns the two hooks that exist just for it.
 */
function ClassicChrome({ isDark, toggleTheme }) {
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

      {/* Fixed canvas background — lazy-loaded so Three.js doesn't block LCP */}
      <Suspense fallback={null}>
        <ThreeBackground isDark={isDark} />
      </Suspense>
      <FloatingOrbs isDark={isDark} />

      <Navbar
        isDark={isDark}
        toggleTheme={toggleTheme}
        scrolled={scrolled}
        activeSection={activeSection}
      />
    </>
  );
}

/** Blog pages: the shared slim bar over a quiet CSS backdrop (no canvas on a reading page). */
function BlogChrome({ isDark, toggleTheme }) {
  const { t } = useTranslation();
  return (
    <>
      <SiteBackdrop />
      <SiteBar variant="solid" showLang={false} isDark={isDark} toggleTheme={toggleTheme}>
        <Link className="sb-pill sb-mono" to="/">{t("nav.portfolio")}</Link>
      </SiteBar>
    </>
  );
}

/**
 * Picks the page chrome for the route. The home deck draws its own background, bar and dock, so it
 * gets none. Must be inside BrowserRouter.
 */
function RouteChrome(props) {
  const { pathname } = useLocation();
  if (pathname === "/") return null;
  if (pathname.startsWith("/blogs")) return <BlogChrome {...props} />;
  return <ClassicChrome {...props} />;
}

function AppShell({ isDark, toggleTheme }) {
  return (
    <>
      <RouteChrome isDark={isDark} toggleTheme={toggleTheme} />

      <Routes>
        {/* ── Home: the particle scene deck ─────────────────────────── */}
        <Route path="/" element={<DeckPage toggleTheme={toggleTheme} />} />
        <Route path="/deck" element={<Navigate to="/" replace />} />

        {/* ── Previous single-page home, kept until it is retired ───── */}
        <Route path="/classic" element={<HomePage />} />

        {/* ── Blog routes ───────────────────────────────────────────── */}
        <Route path="/blogs"      element={<BlogsList />} />
        <Route path="/blogs/:slug" element={<BlogPost />} />
      </Routes>

      {/* Floating AI chat widget — hidden on blog pages */}
      <BlogAwareChatWidget />
    </>
  );
}

function readSavedTheme() {
  try { return localStorage.getItem("theme"); } catch (e) { return null; }
}

export default function App() {
  const [isDark, setIsDark] = useState(() => readSavedTheme() !== "light");
  const { i18n }            = useTranslation();

  const theme = isDark ? THEMES.dark : THEMES.light;

  // The palette is CSS (src/styles/tokens.css), keyed on this attribute
  useEffect(() => { document.documentElement.dataset.theme = theme.name; }, [theme]);

  // Sync <html lang> attribute with i18n language (WCAG 3.1.1)
  useEffect(() => {
    document.documentElement.lang = i18n.language || "en";
  }, [i18n.language]);

  const toggleTheme = useCallback(() => setIsDark((p) => !p), []);

  // remember the choice across visits, like the language
  useEffect(() => { try { localStorage.setItem("theme", theme.name); } catch (e) { /* storage unavailable */ } }, [theme]);

  return (
    <BrowserRouter>
      <ThemeContext.Provider value={theme}>
        <AppShell isDark={isDark} toggleTheme={toggleTheme} />
      </ThemeContext.Provider>
    </BrowserRouter>
  );
}
