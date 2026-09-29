/* INDEX / command palette (Cmd+K, "/", "I"): jump to a scene, copy the email, open a profile or the blog.
   Hovering or arrowing onto a scene previews it in the particle field (peek). */
import { useEffect, useMemo, useRef, useState } from "react";
import "./Palette.css";

export default function Palette({ open, t, onClose, onRun, onPeek }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);

  const items = useMemo(() => {
    const scenes = t("deck.scenes", { returnObjects: true });
    const all = scenes.map((s, i) => ({ k: "scene", i, n: s.name, d: s.desc, num: String(i + 1).padStart(2, "0") }));
    all.push(
      { k: "copy", n: t("deck.index.copyEmail.name"), d: t("deck.index.copyEmail.desc"), num: "@" },
      { k: "link", n: t("deck.index.github.name"), d: t("deck.index.github.desc"), num: "↗", id: "github" },
      { k: "link", n: t("deck.index.linkedin.name"), d: t("deck.index.linkedin.desc"), num: "↗", id: "linkedin" },
      { k: "blog", n: t("deck.index.blog.name"), d: t("deck.index.blog.desc"), num: "→" },
    );
    const needle = q.trim().toLowerCase();
    return needle ? all.filter((it) => `${it.n} ${it.d}`.toLowerCase().includes(needle)) : all;
  }, [q, t]);

  useEffect(() => {
    if (!open) return undefined;
    setQ(""); setSel(0);
    const id = setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
    const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); onClose(); } };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(id); window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  const mark = (j) => { setSel(j); const it = items[j]; if (it && it.k === "scene") onPeek(it.i); };
  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); mark(Math.min(items.length - 1, sel + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); mark(Math.max(0, sel - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (items[sel]) onRun(items[sel]); }
  };

  return (
    <div className={`dk-index${open ? " dk-on" : ""}`} role="dialog" aria-modal="true" aria-label={t("deck.index.aria")} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dk-ix-in">
        <input ref={inputRef} className="dk-ix-q" type="text" value={q} autoComplete="off" placeholder={t("deck.index.placeholder")} aria-label={t("deck.index.search")}
          onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={onKeyDown} />
        <ul className="dk-ix-list">
          {items.map((it, j) => (
            <li key={`${it.k}${it.i ?? it.id ?? ""}`}>
              <button type="button" data-sel={j === sel} onMouseEnter={() => mark(j)} onMouseLeave={() => { if (it.k === "scene") onPeek(-1); }} onClick={() => onRun(it)}>
                <span className="dk-mono dk-mute">{it.num}</span><span className="dk-nm">{it.n}</span><span className="dk-ds">{it.d}</span>
              </button>
            </li>
          ))}
          {!items.length && <li className="dk-ix-empty dk-mono dk-mute" style={{ padding: "14px 4px" }}>{t("deck.index.empty")}</li>}
        </ul>
        <p className="dk-ix-foot dk-mono">
          <span><kbd>↑</kbd><kbd>↓</kbd> {t("deck.index.foot.move")}</span>
          <span><kbd>Enter</kbd> {t("deck.index.foot.open")}</span>
          <span><kbd>Esc</kbd> {t("deck.index.foot.close")}</span>
          <span>{t("deck.index.foot.hover")}</span>
        </p>
      </div>
    </div>
  );
}
