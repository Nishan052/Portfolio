import { useState, useEffect } from "react";

const SECTIONS = ["hero", "about", "experience", "projects", "skills", "contact"];

/**
 * Returns the id of the section currently occupying the middle band
 * of the viewport so the navbar can highlight the right link.
 *
 * rootMargin "-40% 0px -55% 0px" means: fire only when the section
 * is between 40% and 55% from the top of the viewport.
 *
 * @returns {string} active section id
 */
const useActiveSection = () => {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return active;
};

export default useActiveSection;
