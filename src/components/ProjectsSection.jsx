import { memo, useState } from "react";
import projects from "../data/projects.json";

/** GitHub icon SVG (reusable inline) */
const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
  </svg>
);

/**
 * Project card renders one project from projects.json.
 * The active hover state is lifted to the parent for performance.
 */
const ProjectCard = ({ project: p, isActive, onEnter, onLeave }) => (
  <div
    className={`project-card fade-up fade-up-delay-${(parseInt(p.id, 10) % 3) + 1}`}
    style={{
      boxShadow:   isActive ? `0 20px 60px ${p.color}20` : "none",
      borderColor: isActive ? p.color : "var(--border)",
    }}
    onMouseEnter={onEnter}
    onMouseLeave={onLeave}
  >
    {/* Header */}
    <div className="project-card-header" style={{ borderBottomColor: `${p.color}22` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Category badge */}
        <span style={{
          fontSize: 10, fontFamily: "'DM Mono',monospace", letterSpacing: 2,
          color: p.color, padding: "3px 10px", borderRadius: 100,
          background: `${p.color}14`, border: `1px solid ${p.color}28`,
        }}>
          {p.category}
        </span>

        {/* GitHub link */}
        <a
          href={p.github}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="View on GitHub"
          style={{ color: "var(--text-muted)", textDecoration: "none" }}
        >
          <GitHubIcon />
        </a>
      </div>

      {/* Project ID + title */}
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 11 }}>
        <span style={{ fontSize: "1.85rem" }}>{p.emoji}</span>
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: p.color, letterSpacing: 1, opacity: 0.7 }}>
            {p.id}
          </div>
          <h3 style={{
            fontFamily: "'Syne',sans-serif", fontWeight: 700,
            fontSize: "clamp(0.98rem,2vw,1.1rem)", color: "var(--text)",
          }}>
            {p.title}
          </h3>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace" }}>
            {p.subtitle}
          </div>
        </div>
      </div>
    </div>

    {/* Body */}
    <div className="project-card-body">
      <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: 1.74, marginBottom: 13, flex: 1 }}>
        {p.description}
      </p>

      {/* Tech pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 11 }}>
        {p.tech.map((t) => (
          <span key={t} className="skill-pill" style={{
            fontSize: 10, color: p.color,
            borderColor: `${p.color}28`, background: `${p.color}0e`,
          }}>
            {t}
          </span>
        ))}
      </div>

      {/* Highlight badges */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {p.highlights.map((h) => (
          <span key={h} style={{
            fontSize: 10, padding: "3px 8px", borderRadius: 100,
            background: "var(--accent-soft)", color: "var(--text-muted)",
            fontFamily: "'DM Mono',monospace",
          }}>
            ✓ {h}
          </span>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Projects section — responsive auto-fill grid.
 * Data comes from src/data/projects.json — add / remove entries there.
 */
const ProjectsSection = memo(() => {
  const [activeId, setActiveId] = useState(null);

  return (
    <section id="projects" className="section">
      <div className="section-overlay" />
      <div className="container">
        <div className="divider" />

        <div style={{ marginBottom: 46 }}>
          <p className="section-tag fade-up">// portfolio</p>
          <h2 className="section-title fade-up fade-up-delay-1">
            Featured<br />Projects
          </h2>
        </div>

        <div
          className="projects-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 18 }}
        >
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              isActive={activeId === p.id}
              onEnter={() => setActiveId(p.id)}
              onLeave={() => setActiveId(null)}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

export default ProjectsSection;
