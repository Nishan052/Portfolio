/**
 * i18next configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * All translatable strings live in:
 *   src/i18n/en.json  — English (default)
 *   src/i18n/de.json  — German
 *
 * To update any copy, edit only the relevant JSON file.
 * To add a new language, add a new JSON file and register it here.
 *
 * Usage in components:
 *   import { useTranslation } from 'react-i18next';
 *   const { t, i18n } = useTranslation();
 *
 *   t('nav.about')                              → "About" | "Über mich"
 *   t('about.title', { returnObjects: true })   → ["The Person", "Behind the Code"]
 *   i18n.language                               → "en" | "de"
 *   i18n.changeLanguage('de')                   → switches globally
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useCallback } from 'react';

import en from './en.json';
import de from './de.json';

const savedLang = localStorage.getItem('lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
    },
    lng:         savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React handles XSS escaping
    },
  });

// Persist language preference whenever it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('lang', lng);
});

/**
 * Hook for blog pages to always return English translations
 * regardless of the global language setting.
 * 
 * Usage: const { t } = useEnglishTranslation();
 */
export function useEnglishTranslation() {
  const t = useCallback((key, options = {}) => {
    // Nested object lookup
    const keys = key.split('.');
    let value = en;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if not found
      }
    }
    
    // Handle interpolation if needed
    if (typeof value === 'string' && options && Object.keys(options).length > 0) {
      let result = value;
      for (const [key, val] of Object.entries(options)) {
        result = result.replace(`{{${key}}}`, val);
      }
      return result;
    }
    
    return value;
  }, []);
  
  return { t };
}

export default i18n;
