import { memo } from "react";
import { useTranslation } from "react-i18next";
import experiences from "../../data/experience.json";
import "./ExperienceSection.css";

/**
 * Renders a vertical stack of experience cards.
 *
 * Structural data (company, role, dates, location, skills, subRoles) comes from
 * src/data/experience.json.
 *
 * Translatable text (type label, highlights) comes from
 * src/i18n/en.json | de.json via i18next.
 */
const ExperienceSection = memo(() => {
  const { t } = useTranslation();

  const title    = t("experience.title",    { returnObjects: true });
  // Array of { type, highlights[] } — one entry per experience item
  const expItems = t("experience.items",    { returnObjects: true });

  return (
  <section id="experience" aria-labelledby="experience-heading" className="section">
    <div className="section-overlay" aria-hidden="true" />
    <div className="container">
      <div className="divider" aria-hidden="true" />

      <div style={{ marginBottom: 46 }}>
        <p className="section-tag fade-up">{t("experience.tag")}</p>
        <h2 id="experience-heading" className="section-title fade-up fade-up-delay-1">
          {title[0]}<br />{title[1]}
        </h2>
      </div>

      <div className="exp-list">
        {experiences.map((exp, i) => {
          const tx = expItems[i] || {};
          return (
            <article
              key={`${exp.company}-${i}`}
              className={`exp-card fade-up fade-up-delay-${(i % 3) + 1}`}
            >
              {/* Left accent bar */}
              <div aria-hidden="true" className="exp-accent-bar" />

              <div className="exp-row">
                {/* ── Left: role details ──────────────────────────────────────── */}
                <div>
                  {/* Title + type badge */}
                  <div className="exp-header">
                    <h3 className="exp-role">{exp.role}</h3>
                    {tx.type && (
                      <span className="exp-type-badge">{tx.type}</span>
                    )}
                  </div>

                  <div className="exp-company">{exp.company}</div>

                  {/* Sub-roles (e.g. Infosys progression) */}
                  {exp.subRoles && (
                    <div className="exp-sub-roles" role="list" aria-label={t("a11y.subRoles")}>
                      {exp.subRoles.map((r) => (
                        <div key={r.title} role="listitem" className="exp-sub-role">
                          <span className="exp-sub-role-title">{r.title}</span>
                          <span className="exp-sub-role-period">{r.period}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bullet highlights */}
                  <ul className="exp-highlights">
                    {(tx.highlights || []).map((point, j) => (
                      <li key={j} className="exp-highlight-item">
                        <span aria-hidden="true" className="exp-highlight-bullet">›</span>
                        {point}
                      </li>
                    ))}
                  </ul>

                  {/* Skill pills */}
                  <div className="exp-skill-pills" aria-label={t("a11y.technologies")}>
                    {exp.skills.map((s) => (
                      <span key={s} className="skill-pill" style={{ fontSize: 10 }}>{s}</span>
                    ))}
                  </div>
                </div>

                {/* ── Right: date meta ────────────────────────────────────────── */}
                <div className="exp-meta">
                  <div className="exp-meta-dates">
                    <div>{exp.period}</div>
                    <div>—</div>
                    <div>{exp.end}</div>
                  </div>
                  <div className="exp-meta-duration">{exp.duration}</div>
                  <div className="exp-meta-location">
                    <span aria-hidden="true">📍</span> {exp.location}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  </section>
  );
});

export default ExperienceSection;
