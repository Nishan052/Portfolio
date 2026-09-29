import "./Overlays.css";

/**
 * The decorative and feedback layers that sit over the deck: the flash and wave of the button charge,
 * the toast, the custom cursor and ring, and the caption that follows the globe. All are driven from
 * outside (controller / engine); this only renders them.
 *
 * @param {string}   props.toast  message to show, or "" for none
 * @param {Function} props.t      i18next t
 */
export default function Overlays({ toast, t }) {
  return (
    <>
      <div className="dk-flash" aria-hidden="true" />
      <div className="dk-wave-fx" aria-hidden="true" />
      <div className={`dk-toast${toast ? " dk-on" : ""}`} role="status" aria-live="polite">{toast}</div>
      <div className="dk-cur" aria-hidden="true" /><div className="dk-ring" aria-hidden="true" />
      <p className="dk-globe-cap dk-mono"><i />{t("deck.hero.location")}<span className="dk-globe-cap-sub" /></p>
    </>
  );
}
