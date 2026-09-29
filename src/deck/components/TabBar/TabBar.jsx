import { LuHouse, LuUser, LuBriefcase, LuLayers, LuWrench, LuMail } from "react-icons/lu";
import { SCENE_IDS } from "../../controller/constants";
import "./TabBar.css";

// one icon per scene, in SCENE_IDS order
const ICONS = [LuHouse, LuUser, LuBriefcase, LuLayers, LuWrench, LuMail];

/**
 * Bottom tab bar for tablets and phones (simple mode): one tab per scene, icon plus a short label.
 * The tabs carry data-go, which the controller turns into a scene change. The full scene names stay
 * as the accessible names; the short labels (deck.tabs) exist to fit a 360px screen.
 *
 * @param {Function} props.t    i18next t
 * @param {number}   props.cur  current scene index
 */
export default function TabBar({ t, cur }) {
  const names = t("deck.scenes", { returnObjects: true });
  const labels = t("deck.tabs", { returnObjects: true });
  return (
    <nav className="dk-tabbar" aria-label={t("deck.nav.scenes")}>
      {SCENE_IDS.map((id, i) => {
        const Icon = ICONS[i];
        return (
          <button key={id} type="button" className={`dk-tb${cur === i ? " dk-on" : ""}`} data-go={i} aria-label={names[i].name} aria-current={cur === i ? "true" : undefined}>
            <Icon aria-hidden="true" size={20} />
            <span className="dk-tb-lbl">{labels[i]}</span>
          </button>
        );
      })}
    </nav>
  );
}
