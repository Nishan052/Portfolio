import { useEffect } from "react";

/**
 * Applies a subtle vertical parallax transform as the user scrolls.
 *
 * - Elements with class "parallax-slow" use a fixed speed of 0.12.
 * - Elements with a data-parallax-speed attribute use that value as the speed.
 *
 * Pass enabled=false to skip (e.g. while the page loader is still visible).
 */
const useParallax = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handle = () => {
      const y = window.scrollY;
      // Legacy class-based elements
      document.querySelectorAll(".parallax-slow").forEach((el) => {
        el.style.transform = `translateY(${y * 0.12}px)`;
      });
      // Data-attribute-based elements
      document.querySelectorAll("[data-parallax-speed]").forEach((el) => {
        const speed = parseFloat(el.dataset.parallaxSpeed) || 0.12;
        el.style.transform = `translateY(${y * speed}px)`;
      });
    };

    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, [enabled]);
};

export default useParallax;
