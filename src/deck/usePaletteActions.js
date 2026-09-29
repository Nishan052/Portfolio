import { useCallback } from "react";
import siteConfig from "../config/site";
import openLink from "../utils/openLink";
import copyText from "../utils/copyText";

const { contact } = siteConfig;

/**
 * What choosing an item in the INDEX palette does. Scenes are handed to the controller (after the
 * palette has closed, so the preview it held is released first); the rest are page-level actions.
 *
 * @param {Function} p.t          i18next t
 * @param {Function} p.navigate   react-router navigate
 * @param {Function} p.toast      show a toast message
 * @param {Function} p.go         (sceneIndex) => void
 * @param {Function} p.close      close the palette
 */
export default function usePaletteActions({ t, navigate, toast, go, close }) {
  return useCallback((item) => {
    close();
    if (item.k === "scene") setTimeout(() => go(item.i), 30);
    else if (item.k === "copy") copyText(contact.email).then((ok) => toast(t(ok ? "deck.index.emailCopied" : "deck.index.copyFail")));
    else if (item.k === "link") openLink(item.id === "github" ? contact.githubUrl : contact.linkedinUrl);
    else if (item.k === "blog") navigate("/blogs");
  }, [t, navigate, toast, go, close]);
}
