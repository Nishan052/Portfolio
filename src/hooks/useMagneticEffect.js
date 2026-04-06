import { useEffect } from "react";
import useReducedMotion from "./useReducedMotion";

/**
 * Attaches a magnetic hover effect to an array of element refs.
 * On mousemove, the element shifts toward the cursor.
 * On mouseleave, it springs back to its natural position.
 *
 * @param {React.MutableRefObject<Array>} refsArray - ref whose .current is an array of elements
 * @param {number} strength - how strongly elements follow the cursor (0–1, default 0.3)
 */
export default function useMagneticEffect(refsArray, strength = 0.3) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const elements = refsArray.current?.filter(Boolean) ?? [];
    if (!elements.length) return;

    const cleanup = elements.map((el) => {
      const handleMove = (e) => {
        const rect = el.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = (e.clientX - cx) * strength;
        const dy   = (e.clientY - cy) * strength;
        el.style.transition = "transform 0.1s linear";
        el.style.transform  = `translate(${dx}px, ${dy}px)`;
      };
      const handleLeave = () => {
        el.style.transition = "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)";
        el.style.transform  = "translate(0px, 0px)";
      };
      el.addEventListener("mousemove",  handleMove);
      el.addEventListener("mouseleave", handleLeave);
      return () => {
        el.removeEventListener("mousemove",  handleMove);
        el.removeEventListener("mouseleave", handleLeave);
      };
    });

    return () => cleanup.forEach((fn) => fn());
  }, [refsArray, strength, reduced]);
}
