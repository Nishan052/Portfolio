import { useEffect, useRef } from "react";
import useReducedMotion from "./useReducedMotion";

/**
 * Applies 3D perspective tilt to project cards inside a horizontal scroll carousel.
 * Cards near the center are flat; cards at the edges are tilted away.
 *
 * @param {React.RefObject} carouselRef - ref on the scrollable carousel container
 * @param {React.RefObject<Array>} cardRefs - ref whose .current is an array of card elements
 */
export default function useCarouselTilt(carouselRef, cardRefs) {
  const reduced = useReducedMotion();
  const rafId   = useRef(null);

  useEffect(() => {
    if (reduced) return;
    const carousel = carouselRef.current;
    if (!carousel) return;

    const update = () => {
      const cards    = cardRefs.current?.filter(Boolean) ?? [];
      const cWidth   = carousel.offsetWidth;
      const cCenter  = carousel.scrollLeft + cWidth / 2;

      cards.forEach((card) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const offset     = cardCenter - cCenter;
        const maxOffset  = cWidth * 0.6;
        const ratio      = Math.max(-1, Math.min(1, offset / maxOffset));
        const tiltY      = ratio * 22; // max ±22 degrees
        const scale      = 1 - Math.abs(ratio) * 0.08;
        const opacity    = 1 - Math.abs(ratio) * 0.3;
        card.style.transform = `perspective(900px) rotateY(${tiltY}deg) scale(${scale})`;
        card.style.opacity   = String(opacity);
      });
    };

    const handleScroll = () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(update);
    };

    carousel.addEventListener("scroll", handleScroll, { passive: true });
    update(); // initial call

    return () => {
      carousel.removeEventListener("scroll", handleScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
      // Reset transforms on cleanup
      (cardRefs.current ?? []).forEach((card) => {
        if (card) {
          card.style.transform = "";
          card.style.opacity   = "";
        }
      });
    };
  }, [carouselRef, cardRefs, reduced]);
}
