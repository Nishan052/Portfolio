import siteConfig from "../../../config/site";
import { SCENE } from "../../controller/constants";
import { Scene } from "../shared";
import "./Hero.css";

const { contact } = siteConfig;

export default function Hero({ t }) {
  const st = siteConfig.stats;
  return (
    <Scene scene={SCENE.HERO} t={t} className="dk-hero">
      <div className="dk-scene-in dk-wide dk-hero-in">
        <h1 className="dk-hero-h1">{siteConfig.profile.firstName} {siteConfig.profile.lastName}</h1>
        <p className="dk-mono dk-mute dk-hero-role" data-in>{t("hero.role")} · {t("deck.hero.location")}</p>
        <div className="dk-hero-bottom" data-in>
          <div className="dk-hero-desc dk-veil"><p>{t("hero.description")}</p></div>
          <div className="dk-hero-side">
            <div className="dk-stats" aria-label={t("deck.hero.stats")}>
              <div><b>{st.yearsExperience}</b><span className="dk-mono dk-mute">{t("hero.stats.yearsExp")}</span></div>
              <div><b>{st.companiesCount}</b><span className="dk-mono dk-mute">{t("hero.stats.companies")}</span></div>
              <div><b>{st.languagesCount}</b><span className="dk-mono dk-mute">{t("hero.stats.languages")}</span></div>
            </div>
            <div className="dk-actions">
              <a className="dk-btn dk-solid dk-mag" href="#about" data-go="1">{t("deck.hero.explore")} <span aria-hidden="true">↓</span></a>
              <button type="button" className="dk-btn dk-mag" role="link" data-warp data-href={contact.githubUrl}><span className="dk-lbl">{t("hero.github")}</span> <span aria-hidden="true">↗</span></button>
            </div>
            <p className="dk-cue dk-mono"><i />{t("deck.hero.cue")}</p>
          </div>
        </div>
      </div>
    </Scene>
  );
}
