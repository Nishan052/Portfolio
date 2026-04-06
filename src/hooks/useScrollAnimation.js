import { useEffect } from "react";

/**
 * Observes every element with the class "fade-up" and adds
 * the class "visible" when it enters the viewport.
 * The 120 ms delay lets React finish painting before we attach observers.
 * Pass enabled=false to skip (e.g. while the page loader is still visible).
 */
const useScrollAnimation = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        }),
      { threshold: 0.1 }
    );

    const timer = setTimeout(() => {
      document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));
    }, 120);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [enabled]);
};

export default useScrollAnimation;
