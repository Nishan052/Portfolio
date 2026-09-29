import { useCallback, useEffect, useState } from "react";
import siteConfig from "../../../config/site";
import "./DeskNote.css";

const { noteDelay, noteVisible } = siteConfig.deck;
const LEAVE_MS = 800;   // matches the slide-out transition in DeskNote.css

function seen() { try { return sessionStorage.getItem("deskNote") === "1"; } catch (e) { return false; } }

/**
 * "Best on desktop" note, shown once per visit in simple mode: slides up after the page settles, then
 * leaves by itself or when dismissed.
 */
export default function DeskNote({ t }) {
  const [phase, setPhase] = useState(() => (seen() ? "gone" : "wait"));   // wait -> on -> leaving -> gone
  const dismiss = useCallback(() => {
    try { sessionStorage.setItem("deskNote", "1"); } catch (e) { /* ignore */ }
    setPhase("leaving");
  }, []);

  useEffect(() => {
    const next = { wait: ["on", noteDelay], on: ["leaving", noteVisible], leaving: ["gone", LEAVE_MS] }[phase];
    if (!next) return undefined;
    const id = setTimeout(() => (phase === "on" ? dismiss() : setPhase(next[0])), next[1]);
    return () => clearTimeout(id);
  }, [phase, dismiss]);

  if (phase === "gone") return null;
  return (
    <aside className={`dk-desk-note${phase === "on" ? " dk-on" : ""}`} role="note">
      <span className="dk-dn-ico" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>
      </span>
      <span className="dk-dn-txt"><b className="dk-mono">{t("deck.note.title")}</b><span>{t("deck.note.text")}</span></span>
      <button className="dk-dn-x" type="button" aria-label={t("deck.note.dismiss")} onClick={dismiss}>&times;</button>
    </aside>
  );
}
