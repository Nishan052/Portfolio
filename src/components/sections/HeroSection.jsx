import { memo } from "react";
import { useTranslation } from "react-i18next";
import siteConfig from "../../config/site";
import "./HeroSection.css";

/**
 * Full-viewport hero section with name, role, description,
 * CTA buttons, stat counters, and a floating avatar.
 */
const HeroSection = memo(() => {
  const { t } = useTranslation();

  const STATS = [
    { label: t("hero.stats.yearsExp"),  value: siteConfig.stats.yearsExperience },
    { label: t("hero.stats.companies"), value: siteConfig.stats.companiesCount  },
    { label: t("hero.stats.languages"), value: siteConfig.stats.languagesCount  },
  ];

  return (
  <section
    id="hero"
    aria-labelledby="hero-name"
    className="section hero-section"
  >
    <div className="section-overlay" aria-hidden="true" />
    <div className="container">

      {/* Two-column grid — right column (avatar) hides on tablet/mobile via CSS */}
      <div className="hero-grid">
        {/* ── Left: text content ──────────────────────────────────────────────── */}
        <div>
          <p className="hero-role fade-up">{t("hero.role")}</p>
          <div className="glow-line fade-up fade-up-delay-1" aria-hidden="true" />

          <h1 id="hero-name" className="hero-name fade-up fade-up-delay-1">
            <span style={{ color: "var(--text)" }}>{siteConfig.profile.firstName}</span><br />
            <span className="hero-name-accent">{siteConfig.profile.lastName}</span>
          </h1>

          <p className="hero-description fade-up fade-up-delay-2">
            {t("hero.description")}
          </p>

          {/* CTA buttons */}
          <div className="hero-cta-group fade-up fade-up-delay-3">
            <a href={`mailto:${siteConfig.contact.email}`} className="btn-primary">
              <svg aria-hidden="true" focusable="false" width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              {t("hero.cta")}
            </a>

            <a href={siteConfig.contact.githubUrl} target="_blank" rel="noreferrer" className="btn-ghost"
              aria-label={`${t("hero.github")} (${t("a11y.externalLink")})`}>
              <svg aria-hidden="true" focusable="false" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
              </svg>
              {t("hero.github")}
            </a>
          </div>

          {/* Stat counters */}
          <div
            className="hero-stats-row fade-up fade-up-delay-4"
            role="list"
            aria-label={t("a11y.heroStats")}
          >
            {STATS.map((s) => (
              <div key={s.label} role="listitem">
                <div className="hero-stat-value" aria-hidden="true">{s.value}</div>
                <div className="hero-stat-label">
                  <span className="sr-only">{s.value} </span>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: floating avatar ───────────────────────────────────────────── */}
        <div
          role="img"
          aria-label={t("a11y.avatar")}
          className="parallax-slow hero-avatar hero-avatar-col"
        >
          <div aria-hidden="true" className="hero-avatar-circle">
            {siteConfig.profile.avatarEmoji}
          </div>
          <span className="skill-pill"><span aria-hidden="true">📍</span> {siteConfig.profile.location}</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div aria-hidden="true" className="hero-scroll-wrapper">
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
