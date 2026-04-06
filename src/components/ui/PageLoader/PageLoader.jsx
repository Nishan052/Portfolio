import { useEffect, useRef, useState } from "react";
import { useLoader } from "../../../context/LoaderContext";
import useReducedMotion from "../../../hooks/useReducedMotion";
import "./PageLoader.css";

const NAME_FIRST = "NISHAN";
const NAME_LAST  = "POOJARY";

export default function PageLoader() {
  const { loaderDone, dismissLoader } = useLoader();
  const reduced     = useReducedMotion();
  const overlayRef  = useRef(null);
  const didDismiss  = useRef(false);
  const [progress, setProgress]     = useState(0);
  const [nameVisible, setNameVisible] = useState(false);
  const [exiting, setExiting]         = useState(false);

  // Kick off name + progress animations shortly after mount
  useEffect(() => {
    if (loaderDone || reduced) return;
    const t1 = setTimeout(() => setNameVisible(true), 150);
    return () => clearTimeout(t1);
  }, [loaderDone, reduced]);

  // Progress bar sweep 0 → 100 over ~2.1s
  useEffect(() => {
    if (loaderDone || reduced) return;
    let frame;
    const start = performance.now();
    const duration = 2100;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      // ease-out curve
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [loaderDone, reduced]);

  // Dismiss after delay
  useEffect(() => {
    if (loaderDone) return;
    const delay = reduced ? 300 : 2600;
    const timer = setTimeout(() => {
      if (!didDismiss.current) {
        didDismiss.current = true;
        setExiting(true);
        // actual dismissal fires after curtain rise completes
        setTimeout(dismissLoader, reduced ? 100 : 700);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [loaderDone, reduced, dismissLoader]);

  // Focus main content when done
  useEffect(() => {
    if (loaderDone) {
      const main = document.getElementById("main-content");
      if (main) main.focus();
    }
  }, [loaderDone]);

  const handleTransitionEnd = (e) => {
    // Hide overlay after curtain has risen (curtain transform transition)
    if (loaderDone && e.propertyName === "transform" &&
        e.target?.classList?.contains("loader-curtain--right")) {
      if (overlayRef.current) overlayRef.current.style.display = "none";
    }
  };

  if (loaderDone && overlayRef.current?.style.display === "none") return null;

  const progressPct = `${(progress * 100).toFixed(1)}%`;

  return (
    <div
      ref={overlayRef}
      className={`page-loader${exiting || loaderDone ? " page-loader--exit" : ""}`}
      role="status"
      aria-label="Loading portfolio"
      onTransitionEnd={handleTransitionEnd}
    >
      {/* Ambient gradient orbs */}
      <div className="loader-orb loader-orb--1" aria-hidden="true" />
      <div className="loader-orb loader-orb--2" aria-hidden="true" />
      <div className="loader-orb loader-orb--3" aria-hidden="true" />

      {/* Subtle grid overlay */}
      <div className="loader-grid" aria-hidden="true" />

      {/* Center content */}
      <div className="loader-center" aria-hidden={reduced}>
        {/* Monospace tag */}
        <div className={`loader-tag${nameVisible ? " loader-tag--in" : ""}`}>
          <span>portfolio /</span>
        </div>

        {/* Name — each letter staggers in */}
        <div className="loader-name" aria-label={`${NAME_FIRST} ${NAME_LAST}`}>
          <div className="loader-name-row">
            {NAME_FIRST.split("").map((ch, i) => (
              <span
                key={`f${i}`}
                className={`loader-letter loader-letter--accent${nameVisible ? " loader-letter--in" : ""}`}
                style={{ "--li": i }}
              >
                {ch}
              </span>
            ))}
          </div>
          <div className="loader-name-row">
            {NAME_LAST.split("").map((ch, i) => (
              <span
                key={`l${i}`}
                className={`loader-letter${nameVisible ? " loader-letter--in" : ""}`}
                style={{ "--li": NAME_FIRST.length + i + 1 }}
              >
                {ch}
              </span>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        {!reduced && (
          <div className="loader-progress-track">
            <div
              className="loader-progress-fill"
              style={{ width: progressPct }}
            />
            <span className="loader-progress-num">{Math.round(progress * 100)}</span>
          </div>
        )}
      </div>

      {/* Curtain panels for exit — overlay rises in two halves */}
      <div className="loader-curtain loader-curtain--left"  aria-hidden="true" />
      <div className="loader-curtain loader-curtain--right" aria-hidden="true" />
    </div>
  );
}
