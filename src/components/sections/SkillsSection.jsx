import { memo } from "react";
import { useTranslation } from "react-i18next";
import skillsData from "../../data/skills.json";
import "./SkillsSection.css";

/**
 * Skills section — three category grids + certifications list.
 *
 * Structural data (skill names, icons, certifications) from src/data/skills.json.
 * Translated category names from src/i18n/en.json | de.json → skills.categoryNames[].
 */
const SkillsSection = memo(() => {
  const { categories, certifications } = skillsData;
  const { t } = useTranslation();

  // Array of translated category name strings, e.g. ["Data & ML", "Frontend & Backend", "Tools & DevOps"]
  const categoryNames = t("skills.categoryNames", { returnObjects: true });

  return (
    <section id="skills" aria-labelledby="skills-heading" className="section">
      <div className="section-overlay" aria-hidden="true" />
      <div className="container">
        <div className="divider" aria-hidden="true" />

        <div style={{ marginBottom: 46 }}>
          <p className="section-tag fade-up">{t("skills.tag")}</p>
          <h2 id="skills-heading" className="section-title fade-up fade-up-delay-1">{t("skills.title")}</h2>
        </div>

        {/* ── Skill category grids ──────────────────────────────────────────────── */}
        <div className="skills-categories">
          {categories.map((cat, ci) => (
            <div key={ci} className={`fade-up fade-up-delay-${ci + 1}`}>
              {/* Category label */}
              <div className="skills-category-label">
                <span aria-hidden="true" className="skills-category-prefix">{"// "}</span>
                {categoryNames[ci] || ""}
              </div>

              {/* Icon grid */}
              <ul className="skills-grid">
                {cat.skills.map((s) => (
                  <li key={s.name} className="skill-item">
                    <span aria-hidden="true" className="skill-icon">{s.icon}</span>
                    <span className="skill-name">{s.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Certifications ────────────────────────────────────────────────────── */}
        <div className="certs-section fade-up">
          <div className="certs-label">
            <span aria-hidden="true" className="skills-category-prefix">{"// "}</span>
            {t("skills.certifications")}
          </div>

          <div className="certs-grid">
            {certifications.map((c) => (
              <div key={c.title} className="card cert-card">
                <div className="cert-title">
                  <span aria-hidden="true">🏆</span> {c.title}
                </div>
                <div className="cert-org">{c.org}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

export default SkillsSection;
