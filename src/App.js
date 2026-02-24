import { useState, useEffect, useCallback } from "react";

// ── Context & theme ────────────────────────────────────────────────────────────
import { ThemeContext, THEMES } from "./context/ThemeContext";

// ── Hooks ──────────────────────────────────────────────────────────────────────
import useScrollAnimation from "./hooks/useScrollAnimation";
import useParallax        from "./hooks/useParallax";
import useActiveSection   from "./hooks/useActiveSection";

// ── Components ─────────────────────────────────────────────────────────────────
import ThreeBackground  from "./components/ThreeBackground";
import FloatingOrbs     from "./components/FloatingOrbs";
import Navbar           from "./components/Navbar";
import HeroSection      from "./components/HeroSection";
import AboutSection     from "./components/AboutSection";
import ExperienceSection from "./components/ExperienceSection";
import ProjectsSection  from "./components/ProjectsSection";
import SkillsSection    from "./components/SkillsSection";
import ContactSection   from "./components/ContactSection";
import Footer           from "./components/Footer";

// ── Global styles (CSS custom properties injected by App) ─────────────────────
import "./styles.css";

/**
 * Injects CSS custom properties onto :root based on the active theme object.
 * Called whenever isDark changes.
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

export default function App() {
  const [isDark,   setIsDark]   = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const theme         = isDark ? THEMES.dark : THEMES.light;
  const activeSection = useActiveSection();

  // Apply CSS variables whenever theme changes
  useEffect(() => { applyThemeVars(theme); }, [theme]);

  // Scroll sentinel for nav border
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const toggleTheme = useCallback(() => setIsDark((p) => !p), []);

  // Global animation hooks
  useScrollAnimation();
  useParallax();

  return (
    <ThemeContext.Provider value={theme}>
      {/* Fixed canvas background */}
      <ThreeBackground isDark={isDark} />
      <FloatingOrbs    isDark={isDark} />

      {/* Navigation */}
      <Navbar
        isDark={isDark}
        toggleTheme={toggleTheme}
        scrolled={scrolled}
        activeSection={activeSection}
      />

      {/* Page sections */}
      <main style={{ position: "relative", zIndex: 1 }}>
        <HeroSection />
        <AboutSection />
        <ExperienceSection />
        <ProjectsSection />
        <SkillsSection />
        <ContactSection />
      </main>

      <Footer />
    </ThemeContext.Provider>
  );
}
