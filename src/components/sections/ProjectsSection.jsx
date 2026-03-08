import { memo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import projects from "../../data/projects.json";
import "./ProjectsSection.css";

/** GitHub icon SVG (reusable inline) */
const GitHubIcon = () => (
  <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
  </svg>
);

/**
 * Project card.
 * Structural data (color, emoji, tech, github) comes from projects.json.
 * Translated text (subtitle, category, description, highlights) comes from i18n.
 */
const ProjectCard = ({ project: p, tx, isActive, onEnter, onLeave }) => {
  const { t } = useTranslation();
  return (
  <article
    className={`project-card fade-up fade-up-delay-${(parseInt(p.id, 10) % 3) + 1}`}
    style={{
      boxShadow:   isActive ? `0 20px 60px ${p.color}20` : "none",
      borderColor: isActive ? p.color : "var(--border)",
    }}
    onMouseEnter={onEnter}
    onMouseLeave={onLeave}
    onFocus={onEnter}
    onBlur={onLeave}
  >
    {/* Header */}
    <div className="project-card-header" style={{ borderBottomColor: `${p.color}22` }}>
      <div className="project-card-header-top">
        {/* Category badge */}
        <span
          className="project-category-badge"
          style={{ color: p.color, background: `${p.color}14`, border: `1px solid ${p.color}28` }}
        >
          {tx.category}
        </span>

        {/* GitHub link */}
        <a
          href={p.github}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={t("a11y.viewOnGitHub", { title: p.title })}
          className="project-github-link"
        >
          <GitHubIcon />
        </a>
      </div>

      {/* Project ID + title */}
      <div className="project-title-row">
        <span aria-hidden="true" className="project-emoji">{p.emoji}</span>
        <div>
          <div aria-hidden="true" className="project-id-label" style={{ color: p.color }}>
            {p.id}
          </div>
          <h3 className="project-title">{p.title}</h3>
          <div className="project-subtitle">{tx.subtitle}</div>
        </div>
      </div>
    </div>

    {/* Body */}
    <div className="project-card-body">
      <p className="project-description">{tx.description}</p>

      {/* Tech pills */}
      <div
        className="project-tech-list"
        aria-label={t("a11y.technologies")}
      >
        {p.tech.map((tech) => (
          <span key={tech} className="skill-pill project-tech-pill" style={{
            fontSize: 10, color: p.color,
            borderColor: `${p.color}28`, background: `${p.color}0e`,
          }}>
            {tech}
          </span>
        ))}
      </div>

      {/* Highlight badges */}
      <div className="project-highlights" aria-label={t("a11y.highlights")}>
        {(tx.highlights || []).map((h) => (
          <span key={h} className="project-highlight-badge">
            <span aria-hidden="true">✓</span> {h}
          </span>
        ))}
      </div>
    </div>
  </article>
  );
};

/**
 * Projects section — responsive auto-fill grid.
 * Structural data: src/data/projects.json
 * Translated text:  src/i18n/en.json | de.json → projects.items[]
 */
const ProjectsSection = memo(() => {
  const [activeId, setActiveId] = useState(null);
  const { t } = useTranslation();

  const title     = t("projects.title", { returnObjects: true });
  // Array of { subtitle, category, description, highlights[] }
  const projItems = t("projects.items", { returnObjects: true });

  const handleEnter = useCallback((id) => setActiveId(id), []);
  const handleLeave = useCallback(() => setActiveId(null), []);

  return (
    <section id="projects" aria-labelledby="projects-heading" className="section">
      <div className="section-overlay" aria-hidden="true" />
      <div className="container">
        <div className="divider" aria-hidden="true" />

        <div style={{ marginBottom: 46 }}>
          <p className="section-tag fade-up">{t("projects.tag")}</p>
          <h2 id="projects-heading" className="section-title fade-up fade-up-delay-1">
            {title[0]}<br />{title[1]}
          </h2>
        </div>

        <div
          className="projects-grid"
        >
          {projects.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              tx={projItems[i] || {}}
              isActive={activeId === p.id}
              onEnter={() => handleEnter(p.id)}
              onLeave={handleLeave}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

export default ProjectsSection;
