import { useEffect, useRef, useState } from "react";

// Singleton scroll listener — shared across all sticky sections for performance
const subscribers = new Set();
let listenerAttached = false;

function onScroll() {
  subscribers.forEach((fn) => fn());
}

function attachListener() {
  if (listenerAttached) return;
  window.addEventListener("scroll", onScroll, { passive: true });
  listenerAttached = true;
}

function detachListener() {
  if (subscribers.size === 0) {
    window.removeEventListener("scroll", onScroll);
    listenerAttached = false;
  }
}

/**
 * Returns a scroll progress value (0–1) for a sticky section wrapper.
 * The wrapper should have height: ~300vh; the inner should be position:sticky.
 *
 * @param {React.RefObject} wrapperRef - ref on the outer tall wrapper div
 * @returns {{ progress: number }} — 0 at section start, 1 at section end
 */
export default function useStickySection(wrapperRef) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const compute = () => {
      const el = wrapperRef.current;
      if (!el) return;
      const rect   = el.getBoundingClientRect();
      const total  = el.offsetHeight - window.innerHeight;
      const scrolled = -rect.top; // how many px we've scrolled past the top
      const p      = Math.max(0, Math.min(1, scrolled / total));
      setProgress(p);
    };

    subscribers.add(compute);
    attachListener();
    compute(); // initial call

    return () => {
      subscribers.delete(compute);
      detachListener();
    };
  }, [wrapperRef]);

  return { progress };
}
