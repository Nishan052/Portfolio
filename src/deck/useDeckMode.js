import { useEffect, useState } from "react";
import siteConfig from "../config/site";

/**
 * True when the deck should render as plain content (tablets and phones): no WebGL, no particle
 * loader, no three.js download. Re-evaluated on resize so rotating a tablet or resizing a desktop
 * window across the breakpoint switches mode (the deck remounts; see DeckPage's key).
 */
export default function useDeckMode() {
  const [simple, setSimple] = useState(() => window.innerWidth < siteConfig.deck.simpleMax);
  useEffect(() => {
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => { if (window.innerWidth > 0) setSimple(window.innerWidth < siteConfig.deck.simpleMax); }, 250);   // 0 = transient while switching sizes
    };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); clearTimeout(t); };
  }, []);
  return simple;
}
