import { memo } from "react";
import { useLanguage } from "../context/LanguageContext";

// Icons stay universal — matched to locale cards by index
const ICONS = ["🎓", "🏢", "🌍", "📊"];

const HIGHLIGHT_SKILLS = ["Python", "R", "SQL", "Angular", "Power BI", "TensorFlow"];

/**
 * About section — two-column layout:
 * left  → bio text + skill pills
 * right → info cards (education, background, languages, focus)
 * All visible strings come from the active locale (t.about).
 */
const AboutSection = memo(() => {
  const { t } = useLanguage();
  const a = t.about;

  return (
    <section id="about" className="section">
      <div className="section-overlay" />
      <div className="container">
        <div className="divider" />

        <div
          className="about-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(28px, 5vw, 60px)",
            alignItems: "start",
          }}
        >
          {/* ── Left: bio ───────────────────────────────────────────────────────── */}
          <div>
            <p className="section-tag fade-up">{a.tag}</p>
            <h2 className="section-title fade-up fade-up-delay-1">
              {a.titleLine1}<br />{a.titleLine2}
            </h2>
            <p
              style={{ color: "var(--text-muted)", lineHeight: 1.82, marginBottom: 18, fontSize: "0.95rem" }}
              className="fade-up fade-up-delay-2"
            >
              {a.bio1}
            </p>
            <p
              style={{ color: "var(--text-muted)", lineHeight: 1.82, fontSize: "0.95rem" }}
              className="fade-up fade-up-delay-3"
            >
              {a.bio2}
            </p>

            <div
              style={{ marginTop: 22, display: "flex", gap: 9, flexWrap: "wrap" }}
              className="fade-up fade-up-delay-4"
            >
              {HIGHLIGHT_SKILLS.map((s) => (
                <span key={s} className="skill-pill">{s}</span>
              ))}
            </div>
          </div>

          {/* ── Right: info cards ────────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {a.cards.map((card, i) => (
              <div
                key={card.title}
                className={`card fade-up fade-up-delay-${i + 1}`}
                style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
              >
                <span style={{ fontSize: "1.35rem", flexShrink: 0 }}>{ICONS[i]}</span>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 3, fontSize: "0.95rem" }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: "0.83rem", color: "var(--text-muted)", lineHeight: 1.65 }}>
                    {card.desc}
                  </div>
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
