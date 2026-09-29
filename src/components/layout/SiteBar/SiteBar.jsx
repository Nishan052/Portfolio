import { memo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LuMoon, LuSun } from "react-icons/lu";
import siteConfig from "../../../config/site";
import "./SiteBar.css";

const LANGUAGES = ["en", "de"];

/**
 * The slim top bar shared by the home deck and the blog: wordmark on the left, then whatever the
 * page wants to put in `children` (Index, Blog, Portfolio ...), the language switch and the theme
 * toggle. The older full-width Navbar is only used by the classic home page.
 *
 * @param {object}   props
 * @param {boolean}  props.isDark
 * @param {Function} props.toggleTheme
 * @param {"floating"|"solid"} [props.variant]  floating = transparent, over the deck; solid = a bar with a rule, for reading pages
 * @param {boolean}  [props.showLang]           hide the language switch on pages that only exist in English
 * @param {object}   [props.brand]              `{ to }` for a router link, or `{ href, ...attrs }` for a plain anchor
 * @param {ReactNode} [props.children]          page-specific controls, rendered before the switches
 */
const SiteBar = memo(({ isDark, toggleTheme, variant = "solid", showLang = true, brand = { to: "/" }, children }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "de" ? "de" : "en";
  const { to, ...anchorProps } = brand;
  const Brand = to ? Link : "a";
  const brandProps = to ? { to } : anchorProps;

  return (
    <header className={`sb sb--${variant}`}>
      <Brand className="sb-brand" aria-label={t("deck.nav.brand")} {...brandProps}>
        <span data-scramble>{siteConfig.profile.logoName}</span><span>{siteConfig.profile.logoSuffix}</span>
      </Brand>

      <div className="sb-right">
        {children}

        {showLang && (
          <div className="sb-pill sb-mono sb-lang" role="group" aria-label={t("a11y.languageToggle")}>
            {LANGUAGES.map((l) => (
              <button
                key={l}
                type="button"
                className={lang === l ? "sb-on" : ""}
                aria-pressed={lang === l}
                aria-label={l === "en" ? `EN — ${t("a11y.switchToEn")}` : `DE — ${t("a11y.switchToDe")}`}
                onClick={() => lang !== l && i18n.changeLanguage(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        <button
          className="sb-pill sb-mono sb-theme"
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? t("a11y.switchToLight") : t("a11y.switchToDark")}
        >
          {isDark ? <LuSun aria-hidden="true" size={14} /> : <LuMoon aria-hidden="true" size={14} />}
        </button>
      </div>
    </header>
  );
});

SiteBar.displayName = "SiteBar";
export default SiteBar;
