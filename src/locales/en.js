// ─── English locale ───────────────────────────────────────────────────────────
const en = {

  // ── Navbar ──────────────────────────────────────────────────────────────────
  nav: {
    items: ["about", "experience", "projects", "skills", "contact"],
    labels: {
      about:      "About",
      experience: "Experience",
      projects:   "Projects",
      skills:     "Skills",
      contact:    "Contact",
    },
    logoAriaLabel:       "Go to top",
    hamburgerAriaLabel:  "Toggle menu",
    themeToggleDark:     "Switch to Day mode",
    themeToggleLight:    "Switch to Night mode",
    langToggleAriaLabel: "Switch language",
  },

  // ── HeroSection ─────────────────────────────────────────────────────────────
  hero: {
    role:      "Senior Software Developer & Data Scientist",
    headline1: "Nishan",
    headline2: "Poojary",
    subtitle:  "Master's student in Business Intelligence & Data Analytics at Hochschule Emden/Leer, with 4+ years building data-driven solutions across banking and healthcare domain.",
    cta:       "Get in Touch",
    stats: [
      { label: "Years Exp.", value: "4+" },
      { label: "Companies",  value: "2"  },
      { label: "Languages",  value: "5"  },
    ],
    location:    "Berlin, Germany",
    scrollLabel: "SCROLL",
  },

  // ── AboutSection ────────────────────────────────────────────────────────────
  about: {
    tag:        "// about me",
    titleLine1: "The Person",
    titleLine2: "Behind the Code",
    bio1: "I'm a dedicated software developer specializing in robust, responsive applications for the financial and healthcare sectors. Currently pursuing a Master of Engineering in Business Intelligence and Data Analytics at Hochschule Emden/Leer, Germany.",
    bio2: "My core skills span Python, R, Angular, Salesforce, TypeScript, Power BI, and Machine Learning. I'm passionate about AI-driven solutions and building data pipelines that deliver real business insights.",
    highlightLabel: "Core skills",
    cards: [
      { title: "Education",   desc: "MEng Business Intelligence & Data Analytics — Hochschule Emden/Leer (Grade: 1.45/5)" },
      { title: "Background",  desc: "4+ years at Infosys & Novigo Solutions in banking & healthcare domains" },
      { title: "Languages",   desc: "English (C1) · German (B1) · Kannada (C1) · Hindi (C1) · Tulu (C2)" },
      { title: "Focus Areas", desc: "ML/AI · Data Analytics · Business Intelligence · Full-Stack Engineering" },
    ],
  },

  // ── ExperienceSection ───────────────────────────────────────────────────────
  experience: {
    tag:        "// work history",
    titleLine1: "Professional",
    titleLine2: "Experience",
  },

  // ── ProjectsSection ─────────────────────────────────────────────────────────
  projects: {
    tag:          "// portfolio",
    titleLine1:   "Featured",
    titleLine2:   "Projects",
    viewOnGitHub: "View on GitHub",
  },

  // ── SkillsSection ───────────────────────────────────────────────────────────
  skills: {
    tag:                 "// technical skills",
    title:               "My Toolkit",
    certificationsLabel: "Certifications",
  },

  // ── ContactSection ──────────────────────────────────────────────────────────
  contact: {
    tag:        "// contact",
    titleLine1: "Let's Work",
    titleLine2: "Together",
    description: "Open to opportunities in Data Analytics, Business Intelligence, and Software Engineering. Based in Berlin, Germany — open to remote and on-site roles.",
    labels: {
      email:    "Email",
      phone:    "Phone",
      github:   "GitHub",
      linkedin: "LinkedIn",
      location: "Location",
    },
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    builtWith: "Built with",
    by:        "by Nishan Poojary",
    copyright: "© 2026 · Berlin, Germany",
  },

  // ── ChatWidget ──────────────────────────────────────────────────────────────
  chat: {
    headerTitle: "Ask about Nishan",
    headerSub:   "RAG AI assistant · usually instant",
    welcomeText: "Hi! I'm Nishan's AI assistant. Ask me about his experience, projects, or skills.",
    placeholder: "Ask anything about Nishan...",
    faqLabel:    "Frequently asked",
    faqChips: [
      "What's your work experience?",
      "Tell me about your projects",
      "What skills do you have?",
    ],
    errorFallback:        "Something went wrong. Please try again.",
    connectionError:      "Connection error. Please try again.",
    retryBtn:             "Try again",
    typingAriaLabel:      "AI is typing",
    messagesAriaLabel:    "Chat messages",
    dialogAriaLabel:      "Chat with Nishan's AI assistant",
    closeBtnAriaLabel:    "Close chat",
    inputAriaLabel:       "Type your message",
    sendAriaLabel:        "Send message",
    toggleOpenAriaLabel:  "Open AI chat about Nishan",
    toggleCloseAriaLabel: "Close chat",
    tooltip: "RAG-powered AI assistant trained on Nishan's resume, projects and skills",
  },
};

export default en;
