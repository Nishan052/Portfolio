import { createContext } from "react";

// ─── Theme Tokens ─────────────────────────────────────────────────────────────
export const THEMES = {
  dark: {
    bg:             "#030712",
    surface:        "rgba(4,12,30,0.92)",
    surfaceHover:   "rgba(8,20,46,0.96)",
    text:           "#f0f6ff",
    textMuted:      "#8ba3c7",
    accent:         "#00e5ff",
    accentSoft:     "rgba(0,229,255,0.12)",
    accent2:        "#a855f7",
    border:         "rgba(0,229,255,0.2)",
    navBg:          "rgba(2,5,15,0.96)",
    sectionOverlay: "rgba(3,7,18,0.55)",
    bgRaw:          "#030712",
  },
  light: {
    bg:             "#f8faff",
    surface:        "rgba(255,255,255,0.94)",
    surfaceHover:   "rgba(238,242,255,0.97)",
    text:           "#0f172a",
    textMuted:      "#475569",
    accent:         "#2563eb",
    accentSoft:     "rgba(37,99,235,0.1)",
    accent2:        "#7c3aed",
    border:         "rgba(37,99,235,0.2)",
    navBg:          "rgba(248,250,255,0.96)",
    sectionOverlay: "rgba(248,250,255,0.0)",
    bgRaw:          "#f8faff",
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────
export const ThemeContext = createContext(THEMES.dark);
