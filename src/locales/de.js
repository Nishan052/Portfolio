// ─── German locale ────────────────────────────────────────────────────────────
const de = {

  // ── Navbar ──────────────────────────────────────────────────────────────────
  nav: {
    items: ["about", "experience", "projects", "skills", "contact"],
    labels: {
      about:      "Über mich",
      experience: "Erfahrung",
      projects:   "Projekte",
      skills:     "Fähigkeiten",
      contact:    "Kontakt",
    },
    logoAriaLabel:       "Zur Startseite",
    hamburgerAriaLabel:  "Menü umschalten",
    themeToggleDark:     "Zum Tagesmodus wechseln",
    themeToggleLight:    "Zum Nachtmodus wechseln",
    langToggleAriaLabel: "Sprache wechseln",
  },

  // ── HeroSection ─────────────────────────────────────────────────────────────
  hero: {
    role:      "Senior Software-Entwickler & Data Scientist",
    headline1: "Nishan",
    headline2: "Poojary",
    subtitle:  "Masterstudent in Business Intelligence & Data Analytics an der Hochschule Emden/Leer, mit über 4 Jahren Erfahrung in der Entwicklung datengetriebener Lösungen im Bank- und Gesundheitswesen.",
    cta:       "Kontakt aufnehmen",
    stats: [
      { label: "Jahre Erf.",  value: "4+" },
      { label: "Unternehmen", value: "2"  },
      { label: "Sprachen",    value: "5"  },
    ],
    location:    "Berlin, Deutschland",
    scrollLabel: "SCROLLEN",
  },

  // ── AboutSection ────────────────────────────────────────────────────────────
  about: {
    tag:        "// über mich",
    titleLine1: "Die Person",
    titleLine2: "hinter dem Code",
    bio1: "Ich bin ein engagierter Software-Entwickler, spezialisiert auf robuste und responsive Anwendungen für den Finanz- und Gesundheitsbereich. Derzeit absolviere ich einen Master of Engineering in Business Intelligence und Data Analytics an der Hochschule Emden/Leer, Deutschland.",
    bio2: "Meine Kernkompetenzen umfassen Python, R, Angular, Salesforce, TypeScript, Power BI und Machine Learning. Ich bin begeistert von KI-gestützten Lösungen und dem Aufbau von Datenpipelines, die echte Geschäftseinblicke liefern.",
    highlightLabel: "Kernkompetenzen",
    cards: [
      { title: "Ausbildung",   desc: "MEng Business Intelligence & Data Analytics — Hochschule Emden/Leer (Note: 1,45/5)" },
      { title: "Hintergrund",  desc: "Über 4 Jahre bei Infosys & Novigo Solutions in den Bereichen Banking & Healthcare" },
      { title: "Sprachen",     desc: "Englisch (C1) · Deutsch (B1) · Kannada (C1) · Hindi (C1) · Tulu (C2)" },
      { title: "Schwerpunkte", desc: "ML/KI · Data Analytics · Business Intelligence · Full-Stack-Entwicklung" },
    ],
  },

  // ── ExperienceSection ───────────────────────────────────────────────────────
  experience: {
    tag:        "// beruflicher werdegang",
    titleLine1: "Berufliche",
    titleLine2: "Erfahrung",
  },

  // ── ProjectsSection ─────────────────────────────────────────────────────────
  projects: {
    tag:          "// portfolio",
    titleLine1:   "Ausgewählte",
    titleLine2:   "Projekte",
    viewOnGitHub: "Auf GitHub ansehen",
  },

  // ── SkillsSection ───────────────────────────────────────────────────────────
  skills: {
    tag:                 "// technische fähigkeiten",
    title:               "Mein Werkzeugkasten",
    certificationsLabel: "Zertifizierungen",
  },

  // ── ContactSection ──────────────────────────────────────────────────────────
  contact: {
    tag:        "// kontakt",
    titleLine1: "Lass uns",
    titleLine2: "zusammenarbeiten",
    description: "Offen für Möglichkeiten in Data Analytics, Business Intelligence und Software Engineering. Wohnhaft in Berlin — offen für Remote- und Vor-Ort-Positionen.",
    labels: {
      email:    "E-Mail",
      phone:    "Telefon",
      github:   "GitHub",
      linkedin: "LinkedIn",
      location: "Standort",
    },
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    builtWith: "Erstellt mit",
    by:        "von Nishan Poojary",
    copyright: "© 2026 · Berlin, Deutschland",
  },

  // ── ChatWidget ──────────────────────────────────────────────────────────────
  chat: {
    headerTitle: "Frag Nishan",
    headerSub:   "RAG-KI-Assistent · meist sofort",
    welcomeText: "Hallo! Ich bin Nishans KI-Assistent. Frag mich zu seiner Erfahrung, seinen Projekten oder Fähigkeiten.",
    placeholder: "Stell eine Frage über Nishan...",
    faqLabel:    "Häufig gefragt",
    faqChips: [
      "Was ist deine Berufserfahrung?",
      "Erzähl mir von deinen Projekten",
      "Welche Fähigkeiten hast du?",
    ],
    errorFallback:        "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
    connectionError:      "Verbindungsfehler. Bitte versuche es erneut.",
    retryBtn:             "Erneut versuchen",
    typingAriaLabel:      "KI tippt",
    messagesAriaLabel:    "Chat-Nachrichten",
    dialogAriaLabel:      "Chat mit Nishans KI-Assistent",
    closeBtnAriaLabel:    "Chat schließen",
    inputAriaLabel:       "Nachricht eingeben",
    sendAriaLabel:        "Nachricht senden",
    toggleOpenAriaLabel:  "KI-Chat über Nishan öffnen",
    toggleCloseAriaLabel: "Chat schließen",
    tooltip: "RAG-gestützter KI-Assistent, trainiert auf Nishans Lebenslauf, Projekten und Fähigkeiten",
  },
};

export default de;
