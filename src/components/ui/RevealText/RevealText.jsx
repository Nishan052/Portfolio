import { useRef, useEffect, useContext } from "react";
import LoaderContext from "../../../context/LoaderContext";
import useReducedMotion from "../../../hooks/useReducedMotion";

/**
 * Wraps children in a reveal structure.
 * A coloured block slides down to uncover the content when it enters the viewport.
 * Uses React JSX — no manual DOM mutation.
 *
 * @param {{ as?: string, className?: string, style?: object, children: React.ReactNode }} props
 */
export default function RevealText({ as: Tag = "div", className = "", style, children, ...rest }) {
  const wrapperRef = useRef(null);
  const { loaderDone } = useContext(LoaderContext);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      // Just make it visible immediately
      wrapperRef.current?.classList.add("is-revealed");
      return;
    }

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          wrapper.classList.add("is-revealed");
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(wrapper);
    return () => observer.disconnect();
  // Re-run after loader finishes so hero section (already visible) triggers
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaderDone, reduced]);

  return (
    <div ref={wrapperRef} className="reveal-wrapper">
      <div className="reveal-block" aria-hidden="true" />
      <Tag className={className} style={style} {...rest}>
        {children}
      </Tag>
    </div>
  );
}
