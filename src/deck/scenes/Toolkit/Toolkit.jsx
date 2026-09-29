import skills from "../../../data/skills.json";
import { SCENE } from "../../controller/constants";
import { TOOL_ICONS } from "../../demos";
import { Scene, Split, Chip } from "../shared";
import "./Toolkit.css";

export default function Toolkit({ t }) {
  const names = t("skills.categoryNames", { returnObjects: true });
  const icons = t("deck.toolkit.icons", { returnObjects: true });
  const byOrg = skills.certifications.reduce((m, c) => { (m[c.org] = m[c.org] || []).push(c.title); return m; }, {});
  return (
    <Scene scene={SCENE.TOOLKIT} t={t}>
      <div className="dk-scene-in">
        <p className="dk-mono dk-mute dk-kick" data-in>{t("skills.tag")}</p>
        <Split id="tk-h" text={t("deck.toolkit.title")} />
        <p className="dk-mute" style={{ marginTop: 14, maxWidth: "46ch" }} data-in>{t("deck.toolkit.lead")}</p>
        <div className="dk-icons" data-in>
          {TOOL_ICONS.map((Icon, k) => (
            <div className="dk-tile" data-hover key={k}><Icon /><b>{icons[k] && icons[k].name}</b><span>{icons[k] && icons[k].sub}</span></div>
          ))}
        </div>
        <details className="dk-all" data-in>
          <summary className="dk-mono"><span>{t("deck.toolkit.all")}</span><span aria-hidden="true">+</span></summary>
          <div className="dk-groups">
            {skills.categories.map((cat, i) => (
              <div key={i}><h3>{Array.isArray(names) ? names[i] : ""}</h3><div className="dk-chips">{cat.skills.map((s) => <Chip key={s.name}>{s.name}</Chip>)}</div></div>
            ))}
          </div>
        </details>
        <div className="dk-creds" data-in>
          <p className="dk-mono dk-mute">{t("deck.toolkit.certs")}</p>
          <div className="dk-cred-grid">
            {Object.entries(byOrg).map(([org, titles]) => (
              <div className="dk-issuer" key={org}>
                <header>
                  <span className="dk-badge" aria-hidden="true">{org[0]}</span>
                  <div><b>{org}</b><span className="dk-mono dk-mute">{t("deck.toolkit.certCount", { count: titles.length })}</span></div>
                </header>
                <ol>{titles.map((title, i) => (
                  <li className="dk-cred" data-hover key={title}><span className="dk-mono dk-mute">{String(i + 1).padStart(2, "0")}</span><p>{title}</p></li>
                ))}</ol>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Scene>
  );
}
