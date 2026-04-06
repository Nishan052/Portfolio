import { useEffect } from "react";
import useReducedMotion from "./useReducedMotion";

/**
 * Wraps every [data-reveal] element in a reveal structure:
 *   .reveal-wrapper (overflow hidden)
 *     .reveal-block (solid overlay that slides down to reveal the text)
 *     [original element content]
 *
 * An IntersectionObserver adds .reveal-block--drop when the element enters
 * the viewport, triggering a translateY(0%) → translateY(105%) transition.
 *
 * @param {boolean} enabled - gate (set to loaderDone so reveals don't fire under the loader)
 */
export default function useTextReveal(enabled = true) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!enabled || reduced) return;

    const elements = Array.from(document.querySelectorAll("[data-reveal]"));
    const wrappedElements = [];

    elements.forEach((el) => {
      // Skip if already wrapped
      if (el.parentElement?.classList.contains("reveal-wrapper")) return;

      // Create wrapper
      const wrapper = document.createElement("div");
      wrapper.className = "reveal-wrapper";

      // Inherit display style hint from data attribute or default to inline-block
      const displayMode = el.dataset.revealDisplay || "block";
      wrapper.style.display = displayMode;

      // Create the sliding block overlay
      const block = document.createElement("div");
      block.className = "reveal-block";

      // Insert wrapper before element, then move element into wrapper
      el.parentNode.insertBefore(wrapper, el);
      wrapper.appendChild(block);
      wrapper.appendChild(el);

      wrappedElements.push({ wrapper, block });
    });

    if (!wrappedElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ isIntersecting, target }) => {
          if (isIntersecting) {
            const block = target.querySelector(".reveal-block");
            if (block) block.classList.add("reveal-block--drop");
            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.15 }
    );

    wrappedElements.forEach(({ wrapper }) => observer.observe(wrapper));

    return () => {
      observer.disconnect();
      // Unwrap elements on cleanup
      wrappedElements.forEach(({ wrapper }) => {
        const inner = wrapper.querySelector("[data-reveal]");
        if (inner && wrapper.parentNode) {
          wrapper.parentNode.insertBefore(inner, wrapper);
          wrapper.remove();
        }
      });
    };
  }, [enabled, reduced]);
}
