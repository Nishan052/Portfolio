import { useRef, useCallback } from "react";

/**
 * Returns a spring animator function.
 * Spring formula: F = -k*(pos - rest) - d*velocity
 *
 * @param {Object} opts
 * @param {number} opts.stiffness - spring constant k (default 0.12)
 * @param {number} opts.damping   - damping coefficient d (default 0.75)
 * @param {number} opts.threshold - stop threshold for velocity (default 0.01)
 */
export default function useSpring({ stiffness = 0.12, damping = 0.75, threshold = 0.01 } = {}) {
  const state = useRef({ x: 0, y: 0, vx: 0, vy: 0, restX: 0, restY: 0 });
  const rafId = useRef(null);

  const stop = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  /**
   * Animate an element toward its rest position using spring physics.
   * @param {HTMLElement} el    - the element to transform
   * @param {number} startX     - initial displaced x
   * @param {number} startY     - initial displaced y
   * @param {number} [restX=0] - rest x (target)
   * @param {number} [restY=0] - rest y (target)
   */
  const animateTo = useCallback((el, startX, startY, restX = 0, restY = 0) => {
    stop();
    const s = state.current;
    s.x = startX; s.y = startY;
    s.vx = 0;     s.vy = 0;
    s.restX = restX; s.restY = restY;

    const tick = () => {
      const fx = -stiffness * (s.x - s.restX) - damping * s.vx;
      const fy = -stiffness * (s.y - s.restY) - damping * s.vy;
      s.vx += fx; s.vy += fy;
      s.x  += s.vx; s.y  += s.vy;

      el.style.transform = `translate(${s.x}px, ${s.y}px)`;

      const settled =
        Math.abs(s.vx) < threshold &&
        Math.abs(s.vy) < threshold &&
        Math.abs(s.x - s.restX) < threshold &&
        Math.abs(s.y - s.restY) < threshold;

      if (settled) {
        el.style.transform = `translate(${s.restX}px, ${s.restY}px)`;
        stop();
      } else {
        rafId.current = requestAnimationFrame(tick);
      }
    };

    rafId.current = requestAnimationFrame(tick);
  }, [stiffness, damping, threshold, stop]);

  return { animateTo, stop };
}
