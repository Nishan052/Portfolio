import { memo } from "react";

const INFO_CARDS = [
  {
    icon: "🎓",
    title: "Education",
    desc: "MEng Business Intelligence & Data Analytics — Hochschule Emden/Leer (Grade: 1.45/5)",
  },
  {
    icon: "🏢",
    title: "Background",
    desc: "4+ years at Infosys & Novigo Solutions in banking & healthcare domains",
  },
  {
    icon: "🌍",
    title: "Languages",
    desc: "English (C1) · German (B1) · Kannada (C1) · Hindi (C1) · Tulu (C2)",
  },
  {
    icon: "📊",
    title: "Focus Areas",
    desc: "ML/AI · Data Analytics · Business Intelligence · Full-Stack Engineering",
  },
];

const HIGHLIGHT_SKILLS = ["Python", "R", "SQL", "Angular", "Power BI", "TensorFlow"];

/**
 * About section — two-column layout:
 * left  → bio text + skill pills
 * right → info cards (education, background, languages, focus)
 */
const AboutSection = memo(() => (
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
          <p className="section-tag fade-up">// about me</p>
          <h2 className="section-title fade-up fade-up-delay-1">
            The Person<br />Behind the Code
          </h2>
          <p
            style={{ color: "var(--text-muted)", lineHeight: 1.82, marginBottom: 18, fontSize: "0.95rem" }}
            className="fade-up fade-up-delay-2"
          >
            I'm a dedicated software developer specializing in robust, responsive applications for
            the financial and healthcare sectors. Currently pursuing a Master of Engineering in
            Business Intelligence and Data Analytics at Hochschule Emden/Leer, Germany.
          </p>
          <p
            style={{ color: "var(--text-muted)", lineHeight: 1.82, fontSize: "0.95rem" }}
            className="fade-up fade-up-delay-3"
          >
            My core skills span Python, R, Angular, Salesforce, TypeScript, Power BI, and Machine
            Learning. I'm passionate about AI-driven solutions and building data pipelines that
            deliver real business insights.
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
          {INFO_CARDS.map((item, i) => (
            <div
              key={item.title}
              className={`card fade-up fade-up-delay-${i + 1}`}
              style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
            >
              <span style={{ fontSize: "1.35rem", flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 3, fontSize: "0.95rem" }}>
                  {item.title}
                </div>
                <div style={{ fontSize: "0.83rem", color: "var(--text-muted)", lineHeight: 1.65 }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
));

export default AboutSection;
