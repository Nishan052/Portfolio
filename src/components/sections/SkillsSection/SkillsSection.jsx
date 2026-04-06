import { memo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { LuTrophy, LuDatabase, LuWrench, LuChartColumn, LuChartBar, LuRadio, LuEye, LuCloud } from "react-icons/lu";
import { SiPython, SiR, SiTensorflow, SiPytorch, SiAngular, SiTypescript, SiHtml5, SiNodedotjs, SiSpringboot, SiSalesforce, SiSap, SiGithub, SiJira, SiStreamlit, SiArduino, SiJenkins } from "react-icons/si";
import skillsData from "../../../data/skills.json";
import usePhysicsSkills from "../../../hooks/usePhysicsSkills";
import "./SkillsSection.css";

const SKILL_ICON_MAP = {
  Python:       SiPython,
  R:            SiR,
  SQL:          LuDatabase,
  'Power BI':   LuChartColumn,
  Tableau:      LuChartBar,
  KNIME:        LuWrench,
  TensorFlow:   SiTensorflow,
  PyTorch:      SiPytorch,
  Angular:      SiAngular,
  TypeScript:   SiTypescript,
  'HTML/CSS':   SiHtml5,
  'Node.js':    SiNodedotjs,
  'Spring Boot':SiSpringboot,
  Salesforce:   SiSalesforce,
  'SAP S/4HANA':SiSap,
  GitHub:       SiGithub,
  Jira:         SiJira,
  Streamlit:    SiStreamlit,
  MQTT:         LuRadio,
  OpenCV:       LuEye,
  Arduino:      SiArduino,
  Jenkins:      SiJenkins,
  AWS:          LuCloud,
};

function SkillIcon({ name }) {
  const Icon = SKILL_ICON_MAP[name];
  return Icon ? <Icon size={26} aria-hidden="true" /> : null;
}

/**
 * A single skill category grid with physics-enabled drag on items.
 */
const PhysicsSkillGrid = ({ cat, categoryName, delayIdx }) => {
  const itemRefs = useRef([]);
  const { bindAll } = usePhysicsSkills(itemRefs);

  return (
    <div className={`fade-up fade-up-delay-${delayIdx + 1}`}>
      <div className="skills-category-label">
        <span aria-hidden="true" className="skills-category-prefix">{"// "}</span>
        {categoryName}
      </div>
      <ul className="skills-grid">
        {cat.skills.map((s, idx) => (
          <li
            key={s.name}
            ref={(el) => { itemRefs.current[idx] = el; }}
            className="skill-item"
            role="button"
            tabIndex={0}
            aria-label={s.name}
            {...bindAll(idx)}
          >
            <span aria-hidden="true" className="skill-icon"><SkillIcon name={s.name} /></span>
            <span className="skill-name">{s.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const SkillsSection = memo(() => {
  const { categories, certifications } = skillsData;
  const { t } = useTranslation();
  const categoryNames = t("skills.categoryNames", { returnObjects: true });

  return (
    <section id="skills" aria-labelledby="skills-heading" className="section">
      <div className="section-overlay" aria-hidden="true" />
      <div className="container">
        <div className="divider" aria-hidden="true" />

        <div style={{ marginBottom: 46 }}>
          <p className="section-tag fade-up" data-reveal data-reveal-display="block">{t("skills.tag")}</p>
          <h2 id="skills-heading" className="section-title fade-up fade-up-delay-1" data-reveal data-reveal-display="block">{t("skills.title")}</h2>
        </div>

        <div className="skills-categories">
          {categories.map((cat, ci) => (
            <PhysicsSkillGrid
              key={ci}
              cat={cat}
              categoryName={categoryNames[ci] || ""}
              delayIdx={ci}
            />
          ))}
        </div>

        <div className="certs-section fade-up">
          <div className="certs-label">
            <span aria-hidden="true" className="skills-category-prefix">{"// "}</span>
            {t("skills.certifications")}
          </div>
          <div className="certs-grid">
            {certifications.map((c) => (
              <div key={c.title} className="card cert-card">
                <div className="cert-title">
                  <LuTrophy size={14} aria-hidden="true" style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> {c.title}
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
