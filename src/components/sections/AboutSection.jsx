import { memo } from "react";
import { useTranslation } from "react-i18next";
import siteConfig from "../../config/site";
import "./AboutSection.css";

/**
 * About section — two-column layout:
 * left  → bio text + skill pills
 * right → info cards (education, background, languages, focus)
 */
const AboutSection = memo(() => {
  const { t } = useTranslation();

  const title = t("about.title", { returnObjects: true });
  const cards = t("about.cards", { returnObjects: true });

  return (
  <section id="about" aria-labelledby="about-heading" className="section">
    <div className="section-overlay" aria-hidden="true" />
    <div className="container">
      <div className="divider" aria-hidden="true" />

      <div className="about-grid about-grid-container">
        {/* ── Left: bio ───────────────────────────────────────────────────────── */}
        <div>
          <p className="section-tag fade-up">{t("about.tag")}</p>
          <h2 id="about-heading" className="section-title fade-up fade-up-delay-1">
            {title[0]}<br />{title[1]}
          </h2>
          <p className="about-bio fade-up fade-up-delay-2">{t("about.bio1")}</p>
          <p className="about-bio fade-up fade-up-delay-3">{t("about.bio2")}</p>

          <div className="about-skills-row fade-up fade-up-delay-4">
            {siteConfig.about.highlightSkills.map((s) => (
              <span key={s} className="skill-pill">{s}</span>
            ))}
          </div>
        </div>

        {/* ── Right: info cards ────────────────────────────────────────────────── */}
        <div className="about-cards-col">
          {cards.map((item, i) => (
            <div
              key={i}
              className={`card about-card-inner fade-up fade-up-delay-${i + 1}`}
            >
              <span aria-hidden="true" className="about-card-icon">{item.icon}</span>
              <div>
                <div className="about-card-title">{item.title}</div>
                <div className="about-card-desc">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
  );
});

export default AboutSection;
