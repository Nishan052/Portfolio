import { SCENE_IDS } from "../../controller/constants";

/**
 * The <section> every scene lives in. The controller finds scenes by `.dk-scene`, shows one at a
 * time (dk-on) and marks the rest inert; the section keeps only what is static: id, label, class.
 *
 * @param {number}   props.scene      index into SCENE_IDS (see controller/constants)
 * @param {Function} props.t          i18next t, for the scene's accessible name
 * @param {string}   [props.className] extra class for scene-specific layout
 */
export default function Scene({ scene, t, className = "", children }) {
  const names = t("deck.scenes", { returnObjects: true });
  return (
    <section id={SCENE_IDS[scene]} className={`dk-scene${className ? ` ${className}` : ""}`} data-i={scene} aria-label={names[scene] && names[scene].name}>
      {children}
    </section>
  );
}
