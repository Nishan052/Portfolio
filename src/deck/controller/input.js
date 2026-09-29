/* Wheel, touch, keyboard and hash: everything that moves the deck from one scene to another. */
import { SCENE, LAST_SCENE, sceneFromHash } from "./constants";

const WHEEL_STEP = 90;       // accumulated wheel delta that commits a scene change
const WHEEL_QUIET_MS = 180;  // no wheel events for this long = the gesture is over
const SCROLL_STEP = 90;      // px an arrow key scrolls a tall scene

// Elements marked data-no-deck (the chat widget) keep their own wheel/touch gestures. Only the
// *panel* (data-no-deck="panel", where the visitor types) also keeps the keyboard: the chat's toggle
// button stays focused after closing the chat, and shortcuts must work again from there.
const inNoDeck = (t) => !!(t && t.closest && t.closest("[data-no-deck]"));
const inNoDeckKeys = (t) => !!(t && t.closest && t.closest('[data-no-deck="panel"]'));

function canScroll(el, dir) {
  if (!el || el.scrollHeight <= el.clientHeight + 2) return false;
  return dir > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 2 : el.scrollTop > 2;
}

/**
 * @param {object} ctx     controller context
 * @param {object} nav     navigation module
 * @param {object} bridge  engine bridge
 * @param {object} charge  charge module (for the warp buttons)
 */
export function createInput(ctx, nav, bridge, charge) {
  const { host, on, $, root, state, view } = ctx;
  const activeInner = () => $(".dk-scene.dk-on .dk-scene-in");
  let acc = 0, gestureUsed = false, relT = null, quietT = null, lastInner = 0;
  let goal = null, goalAt = 0;   // where the last arrow-key scroll was heading

  on(window, "wheel", (e) => {
    if (host.isIndexOpen() || inNoDeck(e.target)) return;
    const t = e.target, hs = t.closest && t.closest("[data-hscroll]");
    if (hs && (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey)) return;
    const dir = e.deltaY > 0 ? 1 : -1, inner = activeInner();
    if (inner && t.closest && inner.contains(t) && canScroll(inner, dir)) { lastInner = performance.now(); return; }
    e.preventDefault();
    if (performance.now() - lastInner < 260) return;
    const quiet = () => { clearTimeout(quietT); quietT = setTimeout(() => { gestureUsed = false; acc = 0; }, WHEEL_QUIET_MS); };
    if (state.lock || gestureUsed) { quiet(); return; }
    acc = (Math.sign(acc) === dir ? acc : 0) + e.deltaY;
    bridge.impulse(Math.max(-0.6, Math.min(0.6, e.deltaY / 220)));
    bridge.preview(dir, Math.min(1, Math.abs(acc) / WHEEL_STEP));
    clearTimeout(relT); relT = setTimeout(() => { acc = 0; bridge.releasePreview(); }, 170);
    if (Math.abs(acc) >= WHEEL_STEP) { gestureUsed = true; quiet(); acc = 0; nav.goScene(state.cur + dir); }
  }, { passive: false });

  let ty0 = 0, tx0 = 0, tT0 = 0, tPulling = false;
  on(window, "touchstart", (e) => {
    if (host.isIndexOpen() || inNoDeck(e.target) || !e.touches[0]) return;
    ty0 = e.touches[0].clientY; tx0 = e.touches[0].clientX; tT0 = performance.now(); tPulling = false;
  }, { passive: true });
  on(window, "touchmove", (e) => {
    if (host.isIndexOpen() || inNoDeck(e.target) || !e.touches[0]) return;
    const t = e.touches[0], dy = ty0 - t.clientY, dx = tx0 - t.clientX;
    if (Math.abs(dx) > Math.abs(dy)) return;
    const dir = dy > 0 ? 1 : -1, inner = activeInner();
    if (inner && inner.contains(e.target) && canScroll(inner, dir)) { ty0 = t.clientY; lastInner = performance.now(); tPulling = false; return; }
    if (e.target.closest && e.target.closest("[data-hscroll]")) return;
    tPulling = true; bridge.preview(dir, Math.min(1, Math.abs(dy) / (view.H * 0.28)));
  }, { passive: true });
  on(window, "touchend", (e) => {
    if (!tPulling) return;
    tPulling = false;
    const t = e.changedTouches[0]; if (!t) return;
    const dy = ty0 - t.clientY, dt = performance.now() - tT0, flick = Math.abs(dy) / Math.max(dt, 1) > 0.5;
    if (Math.abs(dy) > view.H * 0.12 || (flick && Math.abs(dy) > 40)) nav.goScene(state.cur + (dy > 0 ? 1 : -1)); else bridge.releasePreview();
  }, { passive: true });

  on(window, "keydown", (e) => {
    if (inNoDeckKeys(e.target)) return;
    const tg = (e.target.tagName || "").toLowerCase(), key = e.key;
    if ((e.metaKey || e.ctrlKey) && key.toLowerCase() === "k") { e.preventDefault(); host.openIndex(); return; }
    if (host.isIndexOpen()) return;                       // the palette handles its own keys
    if (tg === "input" || tg === "textarea" || tg === "select" || e.altKey || e.metaKey || e.ctrlKey) return;
    if (key === "/" || key.toLowerCase() === "k" || key.toLowerCase() === "i") { e.preventDefault(); host.openIndex(); return; }
    const inner = activeInner();
    if (key === " " && (tg === "button" || tg === "a" || tg === "summary")) return;  // Space activates the focused control
    // Down / Up / Page keys / Space: a scene taller than the screen scrolls first, and only at its end does the
    // key move to the next (or previous) scene. Nothing else scrolls it, since the page itself never scrolls.
    const dir = key === "ArrowDown" || key === "PageDown" || key === " " ? 1 : key === "ArrowUp" || key === "PageUp" ? -1 : 0;
    if (dir) {
      e.preventDefault();
      if (inner && canScroll(inner, dir)) {
        const step = key === "ArrowDown" || key === "ArrowUp" ? SCROLL_STEP : inner.clientHeight * 0.85;
        // Key repeats add up: aim from where the last press was heading, not from wherever the smooth scroll has reached
        const from = performance.now() - goalAt < 450 && goal !== null ? goal : inner.scrollTop;
        goal = Math.max(0, Math.min(inner.scrollHeight - inner.clientHeight, from + dir * step)); goalAt = performance.now();
        inner.scrollTo({ top: goal, behavior: ctx.reduce ? "auto" : "smooth" });
      } else nav.goScene(state.cur + dir);
      return;
    }
    if (key === "Home") nav.goScene(0);
    else if (key === "End") nav.goScene(LAST_SCENE);
    else if (/^[1-6]$/.test(key)) nav.goScene(+key - 1);
    else if (state.cur === SCENE.PROJECTS && (key === "ArrowRight" || key === "ArrowLeft")) host.carStep(key === "ArrowRight" ? 1 : -1);
  });

  on(window, "hashchange", () => {
    const i = sceneFromHash(window.location.hash);
    if (i >= 0 && i !== state.cur) nav.goScene(i, true);
  });

  // delegated: [data-go] jumps to a scene, [data-warp] runs the button charge before opening its link
  on(root, "click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) { e.preventDefault(); host.closeIndex(); nav.goScene(+go.getAttribute("data-go")); return; }
    const w = e.target.closest("[data-warp]");
    if (w) { e.preventDefault(); charge.warpGo(w); }
  });
  on(root, "keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const w = e.target.closest && e.target.closest("[data-warp]");
    if (w) { e.preventDefault(); charge.warpGo(w); }
  });

  return { dispose() { [relT, quietT].forEach(clearTimeout); } };
}
