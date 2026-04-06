import { useRef, forwardRef } from "react";
import useMagneticEffect from "../../../hooks/useMagneticEffect";
import "./AnimatedButton.css";

/**
 * A CTA button with:
 * - Liquid fill on hover (::before scaleX 0→1)
 * - Neon pulse animation
 * - Magnetic cursor pull
 *
 * Accepts all anchor or button props via `as` prop (default "a").
 */
const AnimatedButton = forwardRef(function AnimatedButton(
  { as: Tag = "a", className = "", variant = "primary", children, ...props },
  externalRef
) {
  const innerRef  = useRef(null);
  const refsArray = useRef([]);

  // Wire ref array for magnetic effect
  const setRef = (el) => {
    innerRef.current    = el;
    refsArray.current   = [el];
    if (typeof externalRef === "function") externalRef(el);
    else if (externalRef) externalRef.current = el;
  };

  useMagneticEffect(refsArray, 0.45);

  return (
    <Tag
      ref={setRef}
      className={`animated-btn animated-btn--${variant} ${className}`}
      {...props}
    >
      <span className="animated-btn__label">{children}</span>
    </Tag>
  );
});

export default AnimatedButton;
