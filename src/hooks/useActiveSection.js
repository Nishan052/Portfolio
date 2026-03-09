import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const SECTIONS = ["hero", "about", "experience", "projects", "skills", "contact"];

/**
 * Returns the id of the section currently occupying the middle band
 * of the viewport so the navbar can highlight the right link.
 *
 * rootMargin "-40% 0px -55% 0px" means: fire only when the section
 * is between 40% and 55% from the top of the viewport.
 *
 * Re-observes on route change so navigation back to home page
 * always picks up freshly-mounted section elements.
 *
 * @returns {string} active section id
 */
const useActiveSection = () => {
  const [active, setActive] = useState("hero");
  const { pathname } = useLocation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    // useEffect runs after paint but React Router may swap the route tree
    // in the same cycle — a 0ms timeout ensures section elements are in the DOM.
    const timer = setTimeout(() => {
      SECTIONS.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 0);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [pathname]);

  return active;
};

export default useActiveSection;
