# Nishan Poojary — Portfolio

A modular React portfolio with Three.js background, dark/light mode, active nav highlighting, and full mobile responsiveness.

applciation link: https://nishan-live.vercel.app/

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm start

# 3. Production build
npm run build
```

---

## 📁 Project Structure

```
src/
├── components/             # One file per UI component
│   ├── ThreeBackground.jsx   Three.js animated canvas
│   ├── FloatingOrbs.jsx      Decorative blurred blobs
│   ├── Navbar.jsx            Fixed top nav + mobile drawer
│   ├── HeroSection.jsx       Full-screen landing hero
│   ├── AboutSection.jsx      Bio + info cards
│   ├── ExperienceSection.jsx Work history timeline
│   ├── ProjectsSection.jsx   Project card grid
│   ├── SkillsSection.jsx     Skill icons + certifications
│   ├── ContactSection.jsx    Contact link list
│   └── Footer.jsx            Site footer
│
├── context/
│   └── ThemeContext.js       THEMES object + React context + useTheme hook
│
├── hooks/
│   ├── useScrollAnimation.js Fade-up IntersectionObserver
│   ├── useParallax.js        Parallax scroll transform
│   └── useActiveSection.js  Tracks which section is in view
│
├── utils/
│   └── scrollTo.js          Smooth scroll helper (nav-offset aware)
│
├── data/                   # Edit these files to update content — no JSX needed
│   ├── experience.json
│   ├── projects.json
│   └── skills.json
│
├── styles.css              Global CSS (uses --css-custom-properties set by App.js)
├── theme.json              Theme token reference (mirrors ThemeContext.js)
├── App.js                  Root component — wires everything together
└── index.js                React entry point
```

---

## ✏️ Updating Content

All content lives in **JSON files** — no JSX editing required:

| File | What it controls |
|------|-----------------|
| `src/data/experience.json` | Work history cards |
| `src/data/projects.json`   | Project cards & descriptions |
| `src/data/skills.json`     | Skill icons & certifications |

---

## 🎨 Theming

Colours are defined in `src/context/ThemeContext.js` (and mirrored in `src/theme.json` for reference).

`App.js` calls `applyThemeVars(theme)` on every theme toggle, which writes all values as CSS custom properties onto `:root`. Every component reads `var(--accent)`, `var(--surface)`, etc. — no prop-drilling needed.

---

## 🛠 Tech Stack

- **React 18** — component architecture
- **Three.js** — WebGL background canvas
- **CSS Custom Properties** — zero-runtime theming
- **IntersectionObserver** — scroll animations & active nav
- **Create React App** — toolchain

---

## 📦 Dependencies

```
react          ^18.2.0
react-dom      ^18.2.0
react-scripts  5.0.1
three          ^0.161.0
```




