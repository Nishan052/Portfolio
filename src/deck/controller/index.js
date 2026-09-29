/* Imperative side of the home deck: scene navigation, gestures, cursor, the button "charge" effect,
   the boot loader and the bridge to the WebGL engine. React renders all markup (and owns the state
   for the dock, roles, carousel and palette); these modules own everything that moves.

   createDeck(root, host) wires listeners onto `root` and `window` and returns the small API React
   calls into. destroy() removes every listener and timer, so the deck can mount and unmount cleanly
   (React StrictMode mounts effects twice in development). */
import gsap from "gsap";
import { createContext } from "./context";
import { createBridge, createEngineHost } from "./bridge";
import { createNavigation } from "./navigation";
import { createCharge } from "./chargeFX";
import { createInput } from "./input";
import { createPointer } from "./pointer";
import { createBoot } from "./boot";
import { sceneFromHash } from "./constants";

export { SCENE_IDS, SCENE, sceneFromHash } from "./constants";
export { hasBooted } from "./boot";

const FONT_WAIT_MS = 3500;     // never leave the visitor on the loader waiting for fonts
const ENGINE_WAIT_MS = 4000;   // ... or for the particle engine chunk on top of that

export function createDeck(root, host) {
  const ctx = createContext(root, host);
  const { state, view, st, $, later, on } = ctx;
  const bridge = createBridge(ctx);
  const engineHost = createEngineHost(ctx);
  const nav = createNavigation(ctx, bridge);
  const charge = createCharge(ctx);
  const input = createInput(ctx, nav, bridge, charge);
  const pointer = createPointer(ctx, bridge);
  const boot = createBoot(ctx);

  nav.showScene(Math.max(0, sceneFromHash(window.location.hash)));
  root.classList.add("dk-nogl");                      // until the field is actually up

  function begin(createEngine) {
    if (state.destroyed) return;
    view.W = window.innerWidth; view.H = window.innerHeight;
    if (createEngine) {
      try {
        // drop the plain-content class first: it shows the hero <h1> in the flow, which would shift
        // the layout the engine measures to fit the particle name
        root.classList.remove("dk-nogl");
        state.engine = createEngine({ root, mount: $(".dk-gl-mount"), host: engineHost, theme: state.theme, state: st });
        state.engine.start();
      } catch (err) {
        console.error("[deck] WebGL init failed, using plain content:", err);
        if (state.engine) { try { state.engine.dispose(); } catch (e) { /* ignore */ } }
        state.engine = null;
        root.classList.add("dk-nogl");
      }
    }
    boot.start();
  }

  /* An embedded page can report a 0-size viewport for a frame or two; wait for a real size. */
  let tries = 0, started = false;
  function whenSized(createEngine) {
    if (state.destroyed || started) return;
    if ((window.innerWidth <= 0 || window.innerHeight <= 0) && tries++ < 90) { requestAnimationFrame(() => whenSized(createEngine)); return; }
    started = true; begin(createEngine);
  }

  /**
   * @param {Promise<Function>|null} enginePromise  resolves to createEngine, or null in simple mode
   */
  function launch(enginePromise) {
    const fonts = (document.fonts && document.fonts.load)
      ? Promise.all([document.fonts.load("800 100px Unbounded"), document.fonts.load("400 16px Geist"), document.fonts.ready]).catch(() => {})
      : Promise.resolve();
    const ready = Promise.all([fonts, enginePromise ? enginePromise.catch((err) => { console.warn("[deck] particle engine failed to load", err); return null; }) : null]);
    let fired = false;
    const go = (fn) => { if (fired) return; fired = true; whenSized(fn); };
    ready.then(([, create]) => go(create));
    later(() => go(null), FONT_WAIT_MS + (enginePromise ? ENGINE_WAIT_MS : 0));
  }

  let rz = null;
  on(window, "resize", () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      const nw = window.innerWidth, nh = window.innerHeight;
      if (nw <= 0 || nh <= 0) return;                       // a 0x0 viewport is a transient state while switching sizes
      if (nw === view.W && Math.abs(nh - view.H) < 120) return;
      view.W = nw; view.H = nh;
      if (state.engine) state.engine.rebuild();
    }, 250);
  });

  return {
    launch,
    go: (i) => nav.goScene(i),
    peek: bridge.peek,
    selectRole: nav.selectRole,
    hoverRole: nav.hoverRole,
    focusRole: nav.focusRole,
    setTheme(name) { state.theme = name; if (state.engine) state.engine.setTheme(name); },
    current: () => state.cur,
    destroy() {
      clearTimeout(rz);
      [input, pointer, charge, boot, nav].forEach((m) => m.dispose());
      if (state.engine) { state.engine.dispose(); state.engine = null; }
      ctx.dispose();
      gsap.killTweensOf(ctx.$$("*"));
      gsap.killTweensOf(st);
    },
  };
}
