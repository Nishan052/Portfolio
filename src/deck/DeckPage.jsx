/* Home "deck": the particle scene deck on desktop, plain scenes on tablets and phones.
   React renders every piece of markup and owns the state that is UI (current scene for the dock, the
   selected role, the palette, toasts). controller/ owns everything that moves and talks to the WebGL
   engine, which is imported lazily and only on screens wide enough to use it. */
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./deck.css";
import { ThemeContext } from "../context/ThemeContext";
import siteConfig from "../config/site";
import experience from "../data/experience.json";
import SiteBar from "../components/layout/SiteBar";
import { createDeck, hasBooted, sceneFromHash } from "./controller";
import useDeckMode from "./useDeckMode";
import usePaletteActions from "./usePaletteActions";
import Scenes from "./scenes";
import Dock from "./components/Dock";
import TabBar from "./components/TabBar";
import Palette from "./components/Palette";
import DeskNote from "./components/DeskNote";
import BootLoader from "./components/BootLoader";
import Overlays from "./components/Overlays";
import ParticleLayer from "./components/ParticleLayer";

const { contact } = siteConfig;
const ROLE_COUNT = experience.length;
const TOAST_MS = 3600;

function Deck({ simple, instant, toggleTheme }) {
  const { t, i18n } = useTranslation();
  const theme = useContext(ThemeContext);
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const deckRef = useRef(null);
  const carRef = useRef(null);
  const [cur, setCur] = useState(() => Math.max(0, sceneFromHash(window.location.hash)));
  const [role, setRole] = useState(ROLE_COUNT - 1);          // newest role first
  const [booting, setBooting] = useState(() => !simple && !hasBooted());
  const [ixOpen, setIxOpen] = useState(false);
  const [toast, setToast] = useState("");
  const lang = i18n.language === "de" ? "de" : "en";

  // what the controller reads on demand, so it never holds a stale translation
  const live = useRef({});
  live.current = {
    ixOpen,
    text: {
      fx: { sending: t("deck.fx.sending"), sent: t("deck.fx.sent"), mailCopied: t("deck.fx.mailCopied"), mailFail: t("deck.fx.mailFail") },
      globe: { enter: t("deck.globe.enter"), touch: t("deck.globe.touch"), localTime: t("deck.globe.localTime") },
    },
  };

  const toastTimer = useRef(null);
  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), TOAST_MS);
  }, []);

  const scrollCarousel = useCallback((d) => {
    const car = carRef.current, c = car && car.querySelector(".dk-card"); if (!c) return;
    car.scrollBy({ left: d * (c.offsetWidth + 22), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, []);

  // ── controller lifecycle ─────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const deck = createDeck(rootRef.current, {
      simple,
      instant,
      theme: theme.name,
      email: contact.email,
      roleCount: ROLE_COUNT,
      text: () => live.current.text,
      toast: showToast,
      onScene: setCur,
      setRole,
      isIndexOpen: () => live.current.ixOpen,
      openIndex: () => setIxOpen(true),
      closeIndex: () => setIxOpen(false),
      carStep: scrollCarousel,
      bootDone: () => setBooting(false),
    });
    deckRef.current = deck;
    deck.launch(simple ? null : import("./gl/engine").then((m) => m.createEngine));
    // page-level hooks for CSS outside .dk: scroll lock, and (simple mode) room for the chat button above the tab bar
    const html = document.documentElement.classList;
    html.add("dk-lock"); html.toggle("dk-simple-mode", simple);
    return () => {
      html.remove("dk-lock", "dk-simple-mode");
      deck.destroy();
      deckRef.current = null;
      clearTimeout(toastTimer.current);
    };
    // theme.name is read once for the initial palette; later changes go through setTheme below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simple, showToast, scrollCarousel]);

  useEffect(() => { if (deckRef.current) deckRef.current.setTheme(theme.name); }, [theme.name]);

  // the palette owns the keyboard while open: the rest of the page must not be reachable behind it
  useEffect(() => {
    const root = rootRef.current;
    const behind = ["main", ".sb", ".dk-dock", ".dk-tabbar"].map((s) => root.querySelector(s)).filter(Boolean);
    behind.forEach((el) => { el.inert = ixOpen; });
    if (!ixOpen) return undefined;
    const opener = document.activeElement;
    return () => {
      if (deckRef.current) deckRef.current.peek(deckRef.current.current());
      const ring = root.querySelector(".dk-ring"); if (ring) ring.classList.remove("dk-big");
      if (opener && document.contains(opener) && opener.focus) opener.focus();
    };
  }, [ixOpen]);

  const go = useCallback((i) => { if (deckRef.current) deckRef.current.go(i); }, []);
  const closeIndex = useCallback(() => setIxOpen(false), []);
  const runItem = usePaletteActions({ t, navigate, toast: showToast, go, close: closeIndex });
  const peek = useCallback((i) => { const d = deckRef.current; if (d) d.peek(i < 0 ? d.current() : i); }, []);
  const deckApi = useMemo(() => () => deckRef.current || { selectRole() {}, hoverRole() {}, focusRole() {} }, []);

  const scenes = t("deck.scenes", { returnObjects: true });
  const isDark = theme.name === "dark";

  return (
    <div ref={rootRef} className={`dk${simple ? " dk-simple" : ""}`} data-theme={theme.name} lang={lang}>
      <ParticleLayer />
      {booting && <BootLoader t={t} />}
      <Overlays toast={toast} t={t} />
      {simple && <DeskNote t={t} />}
      <p className="dk-sr" aria-live="polite">{t("deck.nav.live", { name: scenes[cur] && scenes[cur].name, n: cur + 1 })}</p>

      <SiteBar variant={simple ? "solid" : "floating"} isDark={isDark} toggleTheme={toggleTheme} brand={{ href: "#hero", "data-go": 0 }}>
        <Link className="sb-pill sb-mono sb-narrow-hide" to="/blogs"><span data-scramble>{t("deck.nav.blog")}</span></Link>
        <button className="sb-pill sb-mono" type="button" aria-haspopup="dialog" onClick={() => setIxOpen(true)}><span data-scramble>{t("deck.nav.index")}</span> <kbd>K</kbd></button>
      </SiteBar>

      {simple ? <TabBar t={t} cur={cur} /> : <Dock t={t} cur={cur} onGo={go} />}
      <Scenes t={t} role={role} deck={deckApi} carRef={carRef} />
      <Palette open={ixOpen} t={t} onClose={closeIndex} onRun={runItem} onPeek={peek} />
    </div>
  );
}

/**
 * The deck remounts when the language or the desktop/simple mode changes: the controller attaches
 * listeners to concrete DOM nodes and rewrites some text in place, so a fresh mount is the honest way
 * to keep React and the DOM in agreement. The scene is kept via the URL hash.
 */
export default function DeckPage({ toggleTheme }) {
  const { i18n } = useTranslation();
  const simple = useDeckMode();
  // After the first mount, any remount (size or language change) is not a page load: skip the intro
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; }, []);
  return <Deck key={`${i18n.language}-${simple}`} simple={simple} instant={mounted.current} toggleTheme={toggleTheme} />;
}
