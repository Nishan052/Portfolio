import { SCENE_IDS, LAST_SCENE } from "../../controller/constants";
import "./Dock.css";

/**
 * The bottom dock: previous / one dot per scene / next. The dots carry data-go, which the controller
 * turns into a scene change; the arrows step from the current scene.
 *
 * @param {Function} props.t     i18next t
 * @param {number}   props.cur   current scene index
 * @param {Function} props.onGo  (index) => void
 */
export default function Dock({ t, cur, onGo }) {
  const scenes = t("deck.scenes", { returnObjects: true });
  return (
    <nav className="dk-dock" aria-label={t("deck.nav.scenes")}>
      <button className="dk-arrow" type="button" aria-label={t("deck.nav.prev")} disabled={cur === 0} onClick={() => onGo(cur - 1)}>↑</button>
      {SCENE_IDS.map((id, i) => (
        <button key={id} className={`dk-sc${cur === i ? " dk-on" : ""}`} type="button" data-go={i} aria-label={scenes[i].name} aria-current={cur === i ? "true" : undefined}>
          <i className="dk-dot" /><span className="dk-lbl" data-scramble>{scenes[i].name}</span>
        </button>
      ))}
      <button className="dk-arrow" type="button" aria-label={t("deck.nav.next")} disabled={cur === LAST_SCENE} onClick={() => onGo(cur + 1)}>↓</button>
      <span className="dk-sep" />
      <span className="dk-hint dk-mono"><kbd>↑</kbd><kbd>↓</kbd> {t("deck.nav.scroll")}</span>
    </nav>
  );
}
