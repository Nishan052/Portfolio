import { memo } from "react";
import { useLanguage } from "../context/LanguageContext";
import skillsData from "../data/skills.json";

/**
 * Skills section — three category grids + certifications list.
 * Data comes from src/data/skills.json.
 * Category names and certification titles switch to *_de variants when German is active.
 */
const SkillsSection = memo(() => {
  const { lang, t } = useLanguage();
  const sk = t.skills;
  const { categories, certifications } = skillsData;

  return (
    <section id="skills" className="section">
      <div className="section-overlay" />
      <div className="container">
        <div className="divider" />

        <div style={{ marginBottom: 46 }}>
          <p className="section-tag fade-up">{sk.tag}</p>
          <h2 className="section-title fade-up fade-up-delay-1">{sk.title}</h2>
        </div>

        {/* ── Skill category grids ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
          {categories.map((cat, ci) => {
            const catName = (lang === "de" && cat.name_de) ? cat.name_de : cat.name;
            return (
              <div key={cat.name} className={`fade-up fade-up-delay-${ci + 1}`}>
                {/* Category label */}
                <div style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 10,
                  letterSpacing: 2, textTransform: "uppercase",
                  color: "var(--text-muted)", marginBottom: 13,
                }}>
                  <span style={{ color: "var(--accent)" }}>{"// "}</span>
                  {catName}
                </div>

                {/* Icon grid */}
                <div className="skills-grid">
                  {cat.skills.map((s) => (
                    <div key={s.name} className="skill-item">
                      <span className="skill-icon">{s.icon}</span>
                      <span style={{ color: "var(--text)", fontSize: 11 }}>{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Certifications ────────────────────────────────────────────────────── */}
        <div className="fade-up" style={{ marginTop: 48 }}>
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 10,
            letterSpacing: 2, textTransform: "uppercase",
            color: "var(--text-muted)", marginBottom: 16,
          }}>
            <span style={{ color: "var(--accent)" }}>{"// "}</span>{sk.certificationsLabel}
          </div>

          <div
            className="certs-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 11 }}
          >
            {certifications.map((c) => {
              const certTitle = (lang === "de" && c.title_de) ? c.title_de : c.title;
              return (
                <div key={c.title} className="card" style={{ padding: "13px 17px" }}>
                  <div style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 3 }}>
                    🏆 {certTitle}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--accent)", fontFamily: "'DM Mono',monospace" }}>
                    {c.org}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
});

export default SkillsSection;
