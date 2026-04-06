import { useEffect } from "react";
import useReducedMotion from "./useReducedMotion";

/**
 * fluid.glass-style smooth scroll: intercepts wheel events and lerps
 * window.scrollY toward the target, giving a slow, cinematic scroll feel.
 *
 * Only active on pointer:fine devices (desktop/trackpad).
 * No-op on touch-primary (mobile) and when prefers-reduced-motion is set.
 */
export default function useLerpScroll() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    // Skip on touch-primary devices (phone/tablet)
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const LERP   = 0.072;   // 0 = never arrive, 1 = instant — tune here
    const MULT   = 0.75;    // wheel delta multiplier

    let target  = window.scrollY;
    let current = window.scrollY;
    let rafId   = null;

    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const loop = () => {
      const diff = target - current;
      if (Math.abs(diff) < 0.15) {
        current = target;
        rafId = null;
        return;
      }
      current += diff * LERP;
      window.scrollTo(0, current);
      rafId = requestAnimationFrame(loop);
    };

    const handleWheel = (e) => {
      e.preventDefault();
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 40;   // Firefox line mode
      if (e.deltaMode === 2) delta *= window.innerHeight; // page mode
      target = Math.max(0, Math.min(target + delta * MULT, maxScroll()));
      if (!rafId) rafId = requestAnimationFrame(loop);
    };

    // Sync target when user uses keyboard scroll (arrow keys, Page Down, etc.)
    const handleScroll = () => {
      // Only sync when RAF is NOT running (i.e. scroll came from outside our hook)
      if (!rafId) {
        target  = window.scrollY;
        current = window.scrollY;
      }
    };

    window.addEventListener("wheel",  handleWheel,  { passive: false });
    window.addEventListener("scroll", handleScroll, { passive: true  });

    return () => {
      window.removeEventListener("wheel",  handleWheel);
      window.removeEventListener("scroll", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [reduced]);
}
