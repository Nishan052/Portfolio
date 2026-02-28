import { memo } from "react";
import experiences from "../data/experience.json";
import { useLanguage } from "../context/LanguageContext";

/**
 * Renders a vertical stack of experience cards.
 * Data comes from src/data/experience.json — edit that file to update content.
 */
const ExperienceSection = memo(() => {
  const { t, lang } = useLanguage();
  const e = t.experience;
  return (
  <section id="experience" className="section">
    <div className="section-overlay" />
    <div className="container">
      <div className="divider" />

      <div style={{ marginBottom: 46 }}>
        <p className="section-tag fade-up">{e.tag}</p>
        <h2 className="section-title fade-up fade-up-delay-1">
          {e.title[0]}<br />{e.title[1]}
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {experiences.map((exp, i) => (
          <div
            key={`${exp.company}-${i}`}
            className={`fade-up fade-up-delay-${(i % 3) + 1}`}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: "clamp(18px,3vw,26px) clamp(18px,3vw,30px)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Left accent bar */}
            <div style={{
              position: "absolute", top: 0, left: 0, width: 3, height: "100%",
              background: "linear-gradient(to bottom, var(--accent), var(--accent2))",
              borderRadius: "3px 0 0 3px",
            }} />

            <div
              className="exp-row"
              style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start" }}
            >
              {/* ── Left: role details ─────────────────────────────────────────── */}
              <div>
                {/* Title + badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                  <h3 style={{
                    fontFamily: "'Syne',sans-serif", fontWeight: 700,
                    fontSize: "clamp(0.98rem,2.5vw,1.12rem)",
                  }}>
                    {exp.role}
                  </h3>
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 100,
                    background: "var(--accent-soft)", color: "var(--accent)",
                    fontFamily: "'DM Mono',monospace",
                  }}>
                    {(lang === 'de' && exp.type_de) ? exp.type_de : exp.type}
                  </span>
                </div>

                <div style={{ color: "var(--accent)", fontWeight: 600, marginBottom: 10, fontSize: "0.93rem" }}>
                  {exp.company}
                </div>

                {/* Sub-roles (e.g. Infosys progression) */}
                {exp.subRoles && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                    {exp.subRoles.map((r) => (
                      <div key={r.title} style={{
                        padding: "4px 11px", borderRadius: 8,
                        background: "rgba(168,85,247,0.08)",
                        border: "1px solid rgba(168,85,247,0.2)",
                        fontSize: 11, fontFamily: "'DM Mono',monospace",
                      }}>
                        <span style={{ color: "var(--accent2)", fontWeight: 600 }}>{r.title}</span>
                        <span style={{ color: "var(--text-muted)", marginLeft: 7 }}>{r.period}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bullet highlights */}
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                  {((lang === 'de' && exp.highlights_de) ? exp.highlights_de : exp.highlights).map((point, j) => (
                    <li key={j} style={{
                      fontSize: "0.845rem", color: "var(--text-muted)",
                      lineHeight: 1.68, paddingLeft: 15, position: "relative",
                    }}>
                      <span style={{ position: "absolute", left: 0, color: "var(--accent)" }}>›</span>
                      {point}
                    </li>
                  ))}
                </ul>

                {/* Skill pills */}
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 14 }}>
                  {exp.skills.map((s) => (
                    <span key={s} className="skill-pill" style={{ fontSize: 10 }}>{s}</span>
                  ))}
                </div>
              </div>

              {/* ── Right: date meta ───────────────────────────────────────────── */}
              <div className="exp-meta" style={{ textAlign: "right", minWidth: 115, flexShrink: 0 }}>
                <div style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 11,
                  color: "var(--text-muted)", lineHeight: 1.75,
                }}>
                  <div>{exp.period}</div>
                  <div>—</div>
                  <div>{exp.end}</div>
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: "var(--accent)", fontFamily: "'DM Mono',monospace" }}>
                  {exp.duration}
                </div>
                <div style={{ marginTop: 3, fontSize: 11, color: "var(--text-muted)" }}>
                  📍 {exp.location}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
  );
});

export default ExperienceSection;
