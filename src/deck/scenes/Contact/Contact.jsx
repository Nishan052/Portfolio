import { useEffect, useState } from "react";
import siteConfig from "../../../config/site";
import copyText from "../../../utils/copyText";
import { SCENE } from "../../controller/constants";
import { Scene, Split } from "../shared";
import DeckFooter from "../../components/DeckFooter";
import "./Contact.css";

const { contact } = siteConfig;

export default function Contact({ t }) {
  const [copied, setCopied] = useState("");
  useEffect(() => { if (!copied) return undefined; const id = setTimeout(() => setCopied(""), 1600); return () => clearTimeout(id); }, [copied]);
  const copy = async () => {
    if (await copyText(contact.email)) { setCopied("copied"); return; }
    // no clipboard access: select the address so the visitor can copy it themselves
    const el = document.getElementById("dk-mail"), r = document.createRange(); r.selectNodeContents(el);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); setCopied("selected");
  };
  const first = String(t("contact.description")).split(". ")[0];
  return (
    <Scene scene={SCENE.CONTACT} t={t}>
      <div className="dk-scene-in">
        <p className="dk-mono dk-mute dk-kick" data-in>{t("contact.tag")}</p>
        <Split id="ct-h" text={t("deck.contact.title")} />
        <p className="dk-c-desc dk-veil" data-in>{first.endsWith(".") ? first : first + "."}</p>
        <div className="dk-mailbox" data-in>
          <span id="dk-mail" className="dk-mail">{contact.email}</span>
          <button className="dk-copy" type="button" onClick={copy}>{copied === "copied" ? t("deck.contact.copied") : copied === "selected" ? t("deck.contact.selected") : t("deck.contact.copy")}</button>
        </div>
        <div className="dk-actions" data-in>
          <button type="button" className="dk-btn dk-solid dk-mag" role="link" data-warp data-href={`mailto:${contact.email}`}><span className="dk-lbl">{t("deck.contact.email")}</span> <span aria-hidden="true">→</span></button>
          <button type="button" className="dk-btn dk-mag" role="link" data-warp data-href={contact.githubUrl}><span className="dk-lbl">{t("hero.github")}</span> <span aria-hidden="true">↗</span></button>
          <button type="button" className="dk-btn dk-mag" role="link" data-warp data-href={contact.linkedinUrl}><span className="dk-lbl">{t("contact.labels.linkedin")}</span> <span aria-hidden="true">↗</span></button>
        </div>
        <DeckFooter t={t} />
      </div>
    </Scene>
  );
}
