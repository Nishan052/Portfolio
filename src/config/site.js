/**
 * site.js — Central configuration for the portfolio
 * ─────────────────────────────────────────────────────────────────────────────
 * Every value that would otherwise be hardcoded in a component lives here.
 * Update this file to personalise the portfolio for a different owner.
 *
 * Translatable text (section headings, bios, chat strings, etc.) is still
 * managed in src/i18n/en.json and src/i18n/de.json.
 * This file holds non-translatable, data-only values.
 */

const siteConfig = {
  // ── Owner identity ──────────────────────────────────────────────────────────
  profile: {
    firstName:    "Nishan",
    lastName:     "Poojary",
    location:     "Berlin, Germany",
    /** Two initials shown in the navbar logo, e.g. N + P → "NP" */
    logoFirst:    "N",
    logoSecond:   "P",
    /** Domain suffix after the initials, e.g. ".dev" */
    logoDomain:   ".dev",
  },

  // ── Hero stat counters ──────────────────────────────────────────────────────
  stats: {
    yearsExperience: "4+",
    companiesCount:  "2",
    languagesCount:  "5",
  },

  // ── Contact details ─────────────────────────────────────────────────────────
  contact: {
    email:       "nishanchandrashekarpoojary@gmail.com",
    phone:       "+49 1556 3374276",
    phoneHref:   "tel:+4915563374276",
    /** Short display value shown on the page */
    github:      "github.com/Nishan052",
    githubUrl:   "https://github.com/Nishan052",
    /** Short display value shown on the page */
    linkedin:    "linkedin.com/in/nishan-poojary",
    linkedinUrl: "https://www.linkedin.com/in/nishan-chandrashekar-poojary-756147184/",
  },

  // ── About section ───────────────────────────────────────────────────────────
  about: {
    /**
     * Skills highlighted in the About section pill row.
     * These are display names only — not translated.
     */
    highlightSkills: ["Python", "R", "SQL", "Angular", "Power BI", "TensorFlow"],
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    copyrightYear: "2026",
  },

  // ── API endpoints (frontend) ────────────────────────────────────────────────
  api: {
    chatEndpoint: "/api/chat",
  },
};

export default siteConfig;
