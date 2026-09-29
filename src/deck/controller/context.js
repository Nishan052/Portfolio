/* The shared context every controller module works against: the deck's root element, the React-side
   host callbacks, media preferences, and the handful of mutable values that more than one module
   touches. Listeners and timers made through `on` / `later` are all released by `dispose`, so a
   module never has to remember to clean up after itself. */

/**
 * @param {HTMLElement} root  the .dk element
 * @param {object} host       React-side callbacks (see DeckPage): simple, instant (skip the intro), theme, email, roleCount, text(),
 *                            toast(msg), onScene(i), setRole(i), isIndexOpen(), openIndex(), closeIndex(),
 *                            carStep(d), bootDone()
 */
export function createContext(root, host) {
  const cleanups = [];
  const timers = new Set();
  // The primary pointer can change while the page is open (browser device emulation, a tablet docked to a
  // mouse), so it is read live rather than once at mount.
  const pointerQuery = window.matchMedia("(pointer: fine)");
  const syncTouchClass = () => root.classList.toggle("dk-touch", !pointerQuery.matches);
  syncTouchClass();
  if (pointerQuery.addEventListener) { pointerQuery.addEventListener("change", syncTouchClass); cleanups.push(() => pointerQuery.removeEventListener("change", syncTouchClass)); }

  return {
    root,
    host,
    get fine() { return pointerQuery.matches; },
    reduce: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    simple: host.simple,
    $: (s, r) => (r || root).querySelector(s),
    $$: (s, r) => Array.from((r || root).querySelectorAll(s)),
    scenes: Array.from(root.querySelectorAll(".dk-scene")),

    /** pointer target, parallax and highlighted work domain: shared with the WebGL engine */
    st: { rx: 0, ry: 0, nx: 0, ny: 0, mx: 0, my: 0, on: 0, mxT: 0, myT: 0, onT: 0, vel: 0, open: 0, hole: 0, foc: 0, focI: 0 },
    /** viewport size, refreshed on resize */
    view: { W: window.innerWidth, H: window.innerHeight },
    /** scene index, gesture lock, the live engine (null until it loads, or if WebGL is unavailable) */
    state: { cur: 0, lock: false, destroyed: false, engine: null, theme: host.theme },

    on(target, type, fn, opts) {
      target.addEventListener(type, fn, opts);
      cleanups.push(() => target.removeEventListener(type, fn, opts));
    },
    later(fn, ms) {
      const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
      timers.add(t);
      return t;
    },
    dispose() {
      this.state.destroyed = true;
      cleanups.splice(0).forEach((f) => f());
      timers.forEach(clearTimeout);
      timers.clear();
    },
  };
}
