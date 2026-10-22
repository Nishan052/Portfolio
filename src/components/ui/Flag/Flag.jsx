import { useId } from "react";
import "./Flag.css";

/**
 * A small flag for the language switch, drawn as SVG so it looks the same on every system
 * (flag emoji render as the letters "GB" and "DE" on Windows). Decorative: the button around it
 * already says which language it is.
 *
 * English is shown with the Union Jack, the usual mark for the language. The colours are the
 * flags' own and deliberately do not follow the theme.
 */
export default function Flag({ lang }) {
  const clip = useId();

  if (lang === "de") {
    return (
      <svg className="flag" viewBox="0 0 5 3" aria-hidden="true" focusable="false">
        <rect width="5" height="3" fill="#000" />
        <rect y="1" width="5" height="2" fill="#D00" />
        <rect y="2" width="5" height="1" fill="#FFCE00" />
      </svg>
    );
  }

  return (
    <svg className="flag" viewBox="0 0 60 30" aria-hidden="true" focusable="false">
      <clipPath id={clip}><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${clip})`} stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}
