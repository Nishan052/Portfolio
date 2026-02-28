import { memo } from "react";
import { useTranslation } from "react-i18next";

/**
 * Full-viewport hero section with name, role, description,
 * CTA buttons, stat counters, and a floating avatar.
 */
const HeroSection = memo(() => {
  const { t } = useTranslation();

  const STATS = [
    { label: t("hero.stats.yearsExp"),  value: "4+" },
    { label: t("hero.stats.companies"), value: "2"  },
    { label: t("hero.stats.languages"), value: "5"  },
  ];

  return (
  <section
    id="hero"
    className="section"
    style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center",
      background:
        "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(0,229,255,0.07) 0%, transparent 70%)",
      paddingTop: 110,
    }}
  >
    <div className="section-overlay" />
    <div className="container">

      {/* Two-column grid — right column (avatar) hides on tablet/mobile via CSS */}
      <div
        className="hero-grid"
        style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "center" }}
      >
        {/* ── Left: text content ──────────────────────────────────────────────── */}
        <div>
          <p className="hero-role fade-up">{t("hero.role")}</p>
          <div className="glow-line fade-up fade-up-delay-1" />

          <h1 className="hero-name fade-up fade-up-delay-1">
            <span style={{ color: "var(--text)" }}>Nishan</span><br />
            <span className="hero-name-accent">Poojary</span>
          </h1>

          <p
            className="fade-up fade-up-delay-2"
            style={{
              marginTop: 22, color: "var(--text-muted)",
              lineHeight: 1.75, fontSize: "clamp(0.95rem,2vw,1.1rem)",
              maxWidth: 520,
            }}
          >
            {t("hero.description")}
          </p>

          {/* CTA buttons */}
          <div
            className="hero-btns fade-up fade-up-delay-3"
            style={{ display: "flex", gap: 14, marginTop: 32, flexWrap: "wrap" }}
          >
            <a href="mailto:nishanchandrashekarpoojary@gmail.com" className="btn-primary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              {t("hero.cta")}
            </a>

            <a href="https://github.com/Nishan052" target="_blank" rel="noreferrer" className="btn-ghost">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
              </svg>
              {t("hero.github")}
            </a>
          </div>

          {/* Stat counters */}
          <div
            className="stats-row fade-up fade-up-delay-4"
            style={{ display: "flex", gap: 36, marginTop: 44, flexWrap: "wrap" }}
          >
            {STATS.map((s) => (
              <div key={s.label}>
                <div style={{
                  fontFamily: "'Syne',sans-serif", fontWeight: 800,
                  fontSize: "1.75rem", color: "var(--accent)", lineHeight: 1,
                }}>
                  {s.value}
                </div>
                <div style={{
                  fontSize: 10, color: "var(--text-muted)", marginTop: 5,
                  fontFamily: "'DM Mono',monospace", letterSpacing: 1,
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: floating avatar ───────────────────────────────────────────── */}
        <div
          className="parallax-slow hero-avatar"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}
        >
          <div style={{
            width: 190, height: 190, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent-soft), rgba(168,85,247,0.15))",
            border: "2px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "4.5rem",
            boxShadow: "0 0 60px var(--accent-soft), 0 0 100px rgba(168,85,247,0.1)",
            animation: "float 4s ease-in-out infinite",
          }}>
            👨‍💻
          </div>
          <span className="skill-pill">📍 Berlin, Germany</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{ marginTop: 72, display: "flex", justifyContent: "center" }}>
        <div className="scroll-indicator">
          <span>SCROLL</span>
          <span style={{ fontSize: "1.1rem" }}>↓</span>
        </div>
      </div>
    </div>
  </section>
  );
});

export default HeroSection;
