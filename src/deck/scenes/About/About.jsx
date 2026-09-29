import siteConfig from "../../../config/site";
import { SCENE } from "../../controller/constants";
import { Scene, Split, Chip } from "../shared";
import "./About.css";

export default function About({ t }) {
  const cards = t("about.cards", { returnObjects: true });
  return (
    <Scene scene={SCENE.ABOUT} t={t}>
      <div className="dk-scene-in">
        <p className="dk-mono dk-mute dk-kick" data-in>{t("about.tag")}</p>
        <Split id="about-h" text={t("deck.about.title")} />
        <p className="dk-bio dk-veil" data-in>{t("about.bio1")}</p>
        <div className="dk-sources" data-in>
          {Array.isArray(cards) && cards.map((c) => (
            <div className="dk-src" data-hover key={c.title}><p className="dk-mono">{c.title}</p><p>{c.desc}</p></div>
          ))}
        </div>
        <div className="dk-chips" style={{ marginTop: 18 }} data-in>
          {siteConfig.about.highlightSkills.map((s) => <Chip key={s}>{s}</Chip>)}
        </div>
      </div>
    </Scene>
  );
}
