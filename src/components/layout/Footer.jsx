import { memo } from "react";
import { useTranslation } from "react-i18next";
import siteConfig from "../../config/site";
import "./Footer.css";

/**
 * Site footer — minimal one-liner with copyright.
 */
const Footer = memo(() => {
  const { t } = useTranslation();

  return (
  <footer className="site-footer" role="contentinfo">
    <div>
      {t("footer.built")} {t("footer.by")}
    </div>
    <div className="footer-copy">
      © {siteConfig.footer.copyrightYear} · {siteConfig.profile.location}
    </div>
  </footer>
  );
});

export default Footer;
