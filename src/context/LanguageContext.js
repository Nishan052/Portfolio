import { createContext, useContext } from "react";

export const translations = {
  en: {
    nav: {
      about:      "About",
      experience: "Experience",
      projects:   "Projects",
      skills:     "Skills",
      contact:    "Contact",
    },
    hero: {
      role: "Software Developer & Data Scientist",
      description:
        "Master's student in Business Intelligence & Data Analytics at Hochschule Emden/Leer, with 4+ years building data-driven solutions across banking and healthcare domain.",
      cta: "Get in Touch",
      stats: {
        yearsExp:  "Years Exp.",
        companies: "Companies",
        languages: "Languages",
      },
    },
    about: {
      tag:   "// about me",
      title: ["The Person", "Behind the Code"],
      bio1: "I'm a dedicated software developer specializing in robust, responsive applications for the financial and healthcare sectors. Currently pursuing a Master of Engineering in Business Intelligence and Data Analytics at Hochschule Emden/Leer, Germany.",
      bio2: "My core skills span Python, R, Angular, Salesforce, TypeScript, Power BI, and Machine Learning. I'm passionate about AI-driven solutions and building data pipelines that deliver real business insights.",
      cards: [
        { icon: "🎓", title: "Education",    desc: "MEng Business Intelligence & Data Analytics — Hochschule Emden/Leer (Grade: 1.45/5)" },
        { icon: "🏢", title: "Background",   desc: "4+ years at Infosys & Novigo Solutions in banking & healthcare domains" },
        { icon: "🌍", title: "Languages",    desc: "English (C1) · German (B1) · Kannada (C1) · Hindi (C1) · Tulu (C2)" },
        { icon: "📊", title: "Focus Areas",  desc: "ML/AI · Data Analytics · Business Intelligence · Full-Stack Engineering" },
      ],
    },
    experience: {
      tag:   "// work history",
      title: ["Professional", "Experience"],
    },
    projects: {
      tag:   "// portfolio",
      title: ["Featured", "Projects"],
    },
    skills: {
      tag:            "// technical skills",
      title:          "My Toolkit",
      certifications: "Certifications",
    },
    contact: {
      tag:   "// contact",
      title: ["Let's Work", "Together"],
      description:
        "Open to opportunities in Data Analytics, Business Intelligence, and Software Engineering. Based in Berlin, Germany — open to remote and on-site roles.",
      labels: {
        email:    "Email",
        phone:    "Phone",
        github:   "GitHub",
        linkedin: "LinkedIn",
        location: "Location",
      },
    },
    footer: {
      built: "Built with",
      by:    "by Nishan Poojary",
    },
    chat: {
      header:      "Ask about Nishan",
      headerSub:   "RAG AI assistant · usually instant",
      welcome:     "Hi! I'm Nishan's AI assistant. Ask me about his experience, projects, or skills.",
      placeholder: "Ask anything about Nishan...",
      faqLabel:    "Frequently asked",
      retry:            "Try again",
      errorDefault:     "Something went wrong. Please try again.",
      errorConnection:  "Connection error. Please try again.",
      tooltip:     "RAG-powered AI assistant trained on Nishan's resume, projects and skills",
      faq: [
        "What's your work experience?",
        "Tell me about your projects",
        "What skills do you have?",
      ],
    },
  },

  de: {
    nav: {
      about:      "Über mich",
      experience: "Erfahrung",
      projects:   "Projekte",
      skills:     "Fähigkeiten",
      contact:    "Kontakt",
    },
    hero: {
      role: "Softwareentwickler & Data Scientist",
      description:
        "Masterstudent in Business Intelligence & Data Analytics an der Hochschule Emden/Leer, mit über 4 Jahren Erfahrung in der Entwicklung datengetriebener Lösungen im Bank- und Gesundheitswesen.",
      cta: "Kontakt aufnehmen",
      stats: {
        yearsExp:  "Jahre Erf.",
        companies: "Firmen",
        languages: "Sprachen",
      },
    },
    about: {
      tag:   "// über mich",
      title: ["Der Mensch", "hinter dem Code"],
      bio1: "Ich bin ein engagierter Softwareentwickler mit Spezialisierung auf robuste, responsive Anwendungen für den Finanz- und Gesundheitsbereich. Derzeit studiere ich Master of Engineering in Business Intelligence und Data Analytics an der Hochschule Emden/Leer, Deutschland.",
      bio2: "Meine Kernkompetenzen umfassen Python, R, Angular, Salesforce, TypeScript, Power BI und Machine Learning. Ich begeistere mich für KI-gestützte Lösungen und den Aufbau von Datenpipelines, die echten Geschäftsnutzen liefern.",
      cards: [
        { icon: "🎓", title: "Ausbildung",    desc: "MEng Business Intelligence & Data Analytics — Hochschule Emden/Leer (Note: 1,45/5)" },
        { icon: "🏢", title: "Hintergrund",   desc: "Über 4 Jahre bei Infosys & Novigo Solutions im Bank- und Gesundheitsbereich" },
        { icon: "🌍", title: "Sprachen",      desc: "Englisch (C1) · Deutsch (B1) · Kannada (C1) · Hindi (C1) · Tulu (C2)" },
        { icon: "📊", title: "Schwerpunkte",  desc: "ML/KI · Datenanalyse · Business Intelligence · Full-Stack-Entwicklung" },
      ],
    },
    experience: {
      tag:   "// beruflicher werdegang",
      title: ["Berufliche", "Erfahrung"],
    },
    projects: {
      tag:   "// portfolio",
      title: ["Ausgewählte", "Projekte"],
    },
    skills: {
      tag:            "// technische fähigkeiten",
      title:          "Mein Werkzeugkasten",
      certifications: "Zertifizierungen",
    },
    contact: {
      tag:   "// kontakt",
      title: ["Lass uns", "zusammenarbeiten"],
      description:
        "Offen für Möglichkeiten in Data Analytics, Business Intelligence und Softwareentwicklung. Wohnhaft in Berlin – offen für Remote- und Vor-Ort-Stellen.",
      labels: {
        email:    "E-Mail",
        phone:    "Telefon",
        github:   "GitHub",
        linkedin: "LinkedIn",
        location: "Standort",
      },
    },
    footer: {
      built: "Gebaut mit",
      by:    "von Nishan Poojary",
    },
    chat: {
      header:      "Frag über Nishan",
      headerSub:   "RAG KI-Assistent · meist sofort",
      welcome:     "Hallo! Ich bin Nishans KI-Assistent. Frag mich nach seiner Erfahrung, seinen Projekten oder Fähigkeiten.",
      placeholder: "Frag alles über Nishan...",
      faqLabel:    "Häufig gestellt",
      retry:            "Erneut versuchen",
      errorDefault:     "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
      errorConnection:  "Verbindungsfehler. Bitte versuche es erneut.",
      tooltip:     "KI-Assistent mit Zugriff auf Nishans Lebenslauf, Projekte und Fähigkeiten",
      faq: [
        "Was ist deine Berufserfahrung?",
        "Erzähl mir von deinen Projekten",
        "Welche Fähigkeiten hast du?",
      ],
    },
  },
};

export const LanguageContext = createContext(null);

/** Returns { lang, t, toggleLang } */
export function useLanguage() {
  return useContext(LanguageContext);
}
