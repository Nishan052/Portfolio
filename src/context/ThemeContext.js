import { createContext } from "react";

// ─── Themes ───────────────────────────────────────────────────────────────────
// The palette itself lives in src/styles/tokens.css and is switched by the
// data-theme attribute App puts on <html>. The context only says which theme is
// active, for the few components that need to know in JS (the deck's WebGL
// field, diagram rendering).
export const THEMES = {
  dark:  { name: "dark" },
  light: { name: "light" },
};

// ─── Context ──────────────────────────────────────────────────────────────────
export const ThemeContext = createContext(THEMES.dark);
