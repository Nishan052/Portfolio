import { useEffect, useRef } from "react";
import { useDrag } from "@use-gesture/react";
import useReducedMotion from "./useReducedMotion";
import useSpring from "./useSpring";

const SPRING_OPTS = { stiffness: 0.12, damping: 0.75, threshold: 0.5 };

/**
 * Gives each skill element spring-physics drag behaviour.
 * Elements bounce back to their initial (rest) positions on release.
 *
 * @param {React.RefObject<Array>} itemRefs - ref whose .current is an array of skill elements
 */
export default function usePhysicsSkills(itemRefs) {
  const reduced = useReducedMotion();
  const springs = useRef([]);

  // Create one spring per item
  useEffect(() => {
    const items = itemRefs.current?.filter(Boolean) ?? [];
    springs.current = items.map(() =>
      // Inline spring factory (we can't call useSpring in a loop, so we replicate minimal logic)
      (() => {
        let rafId = null;
        let x = 0, y = 0, vx = 0, vy = 0;
        return {
          animateTo(el, sx, sy) {
            if (rafId) cancelAnimationFrame(rafId);
            x = sx; y = sy; vx = 0; vy = 0;
            const { stiffness: k, damping: d, threshold: thr } = SPRING_OPTS;
            const tick = () => {
              const fx = -k * x - d * vx;
              const fy = -k * y - d * vy;
              vx += fx; vy += fy;
              x  += vx; y  += vy;
              el.style.transform = `translate(${x}px, ${y}px)`;
              const settled =
                Math.abs(vx) < thr && Math.abs(vy) < thr &&
                Math.abs(x)  < thr && Math.abs(y)  < thr;
              if (settled) {
                el.style.transform = "translate(0px, 0px)";
                rafId = null;
              } else {
                rafId = requestAnimationFrame(tick);
              }
            };
            rafId = requestAnimationFrame(tick);
          },
          stop() {
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
          },
        };
      })()
    );
  }, [itemRefs]);

  // Attach drag gestures to each item
  const bindAll = useDrag(
    ({ args: [idx], movement: [mx, my], last }) => {
      if (reduced) return;
      const el     = itemRefs.current?.[idx];
      const spring = springs.current[idx];
      if (!el || !spring) return;

      if (!last) {
        spring.stop();
        el.style.transform = `translate(${mx}px, ${my}px)`;
        el.style.cursor    = "grabbing";
      } else {
        el.style.cursor = "grab";
        spring.animateTo(el, mx, my);
      }
    },
    { filterTaps: true }
  );

  useEffect(() => {
    if (reduced) return;
    const items = itemRefs.current?.filter(Boolean) ?? [];
    items.forEach((el) => {
      el.style.cursor   = "grab";
      el.style.touchAction = "none";
      el.style.userSelect = "none";
    });
    return () => {
      items.forEach((el) => {
        el.style.cursor      = "";
        el.style.touchAction = "";
        el.style.userSelect  = "";
        el.style.transform   = "";
      });
    };
  }, [itemRefs, reduced]);

  return { bindAll };
}
