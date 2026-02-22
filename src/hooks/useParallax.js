import { useEffect } from "react";

/**
 * Applies a subtle vertical parallax transform to every element
 * with the class "parallax-slow" as the user scrolls.
 */
const useParallax = () => {
  useEffect(() => {
    const handle = () => {
      const y = window.scrollY;
      document.querySelectorAll(".parallax-slow").forEach((el) => {
        el.style.transform = `translateY(${y * 0.12}px)`;
      });
    };

    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);
};

export default useParallax;
