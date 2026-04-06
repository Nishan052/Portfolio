import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLoader } from "../../../context/LoaderContext";
import useReducedMotion from "../../../hooks/useReducedMotion";
import "./PageLoader.css";

export default function PageLoader() {
  const { loaderDone, dismissLoader } = useLoader();
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const overlayRef = useRef(null);
  const didDismiss = useRef(false);

  useEffect(() => {
    if (loaderDone) return;
    const delay = reduced ? 300 : 2500;
    const timer = setTimeout(() => {
      if (!didDismiss.current) {
        didDismiss.current = true;
        dismissLoader();
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [loaderDone, reduced, dismissLoader]);

  // Focus main content when loader finishes
  useEffect(() => {
    if (loaderDone) {
      const main = document.getElementById("main-content");
      if (main) main.focus();
    }
  }, [loaderDone]);

  // onTransitionEnd → hide overlay from layout after fade-out
  const handleTransitionEnd = () => {
    if (loaderDone && overlayRef.current) {
      overlayRef.current.style.display = "none";
    }
  };

  if (loaderDone && overlayRef.current?.style.display === "none") return null;

  return (
    <div
      ref={overlayRef}
      className={`page-loader${loaderDone ? " page-loader--exit" : ""}`}
      role="status"
      aria-label={t("a11y.loader", "Loading portfolio")}
      onTransitionEnd={handleTransitionEnd}
    >
      {!reduced && (
        <div className="loader-cube-wrapper" aria-hidden="true">
          <div className="loader-cube">
            <div className="loader-face loader-face--front"  />
            <div className="loader-face loader-face--back"   />
            <div className="loader-face loader-face--left"   />
            <div className="loader-face loader-face--right"  />
            <div className="loader-face loader-face--top"    />
            <div className="loader-face loader-face--bottom" />
          </div>
        </div>
      )}
      <p className="loader-label">{t("loader.loading", "Loading")}</p>
    </div>
  );
}
