import "./BootLoader.css";

/** Markup for the boot loader; controller/boot.js animates it and asks React to remove it when done. */
export default function BootLoader({ t }) {
  return (
    <div className="dk-boot" role="status" aria-label={t("deck.boot.aria")}>
      <div className="dk-boot-bg" aria-hidden="true"><i className="dk-boot-ball" /><canvas className="dk-boot-field" /></div>
      <div className="dk-boot-in">
        <p className="dk-mono dk-mute">{t("deck.boot.label")}</p>
        <div className="dk-boot-orb" />
        <div className="dk-boot-line"><i className="dk-boot-bar" /></div>
      </div>
    </div>
  );
}
