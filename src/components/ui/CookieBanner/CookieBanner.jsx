import { useTranslation } from "react-i18next";
import { useLoader } from "../../../context/LoaderContext";
import useCookieConsent from "../../../hooks/useCookieConsent";
import "./CookieBanner.css";

export default function CookieBanner() {
  const { loaderDone } = useLoader();
  const { consent, accept, decline } = useCookieConsent();
  const { t } = useTranslation();

  // Only show if loader is done and no choice has been made yet
  if (!loaderDone || consent !== null) return null;

  return (
    <div
      className="cookie-banner"
      role="region"
      aria-label={t("a11y.cookieBanner", "Cookie consent")}
    >
      <p className="cookie-message">
        {t("cookies.message", "This site uses cookies to improve your experience.")}
      </p>
      <div className="cookie-actions">
        <button
          type="button"
          className="cookie-btn cookie-btn--accept"
          onClick={accept}
          aria-label={t("cookies.accept", "Accept cookies")}
        >
          {t("cookies.accept", "Accept")}
        </button>
        <button
          type="button"
          className="cookie-btn cookie-btn--decline"
          onClick={decline}
          aria-label={t("cookies.decline", "Decline cookies")}
        >
          {t("cookies.decline", "Decline")}
        </button>
      </div>
    </div>
  );
}
