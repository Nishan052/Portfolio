import { useEffect } from "react";

/**
 * Observes every element with the class "fade-up" and adds
 * the class "visible" when it enters the viewport.
 * The 120 ms delay lets React finish painting before we attach observers.
 */
const useScrollAnimation = () => {
  useEffect(() => {
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
  }, []);
};

export default useScrollAnimation;
