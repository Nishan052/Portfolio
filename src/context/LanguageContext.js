import { createContext, useContext } from "react";

/**
 * LanguageContext — provides { lang, setLang, t } globally.
 *
 * lang    : 'en' | 'de'
 * setLang : (lang: string) => void
 * t       : strings object for the active locale (en.js or de.js)
 *
 * State is owned by App.js, persisted in localStorage ('portfolio-lang').
 * Mirror of the ThemeContext pattern — no external i18n library.
 */
export const LanguageContext = createContext({
  lang:    'en',
  setLang: () => {},
  t:       {},
});

export const useLanguage = () => useContext(LanguageContext);
