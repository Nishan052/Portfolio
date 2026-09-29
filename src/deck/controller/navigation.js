/* Which scene is showing, moving between scenes, and the auto-tour through the experience roles. */
import gsap from "gsap";
import { SCENE, SCENE_IDS, LAST_SCENE } from "./constants";

const TOUR_MS = 2800;          // how long the tour rests on each role
const MANUAL_HOLD_MS = 9000;   // after a manual pick, how long before the tour resumes

export function createNavigation(ctx, bridge) {
  const { host, scenes, state, st, reduce, later, $, $$ } = ctx;
  let focAuto = true, tourT = null, roleT = null;

  function publish() {
    host.onScene(state.cur);
    try { window.history.replaceState(window.history.state, "", "#" + SCENE_IDS[state.cur]); } catch (e) { /* ignore */ }
  }

  /** letters and blocks of the scene that just arrived stagger in */
  function enter(el) {
    if (reduce) return;
    const chars = $$(".dk-ch", el), items = $$("[data-in]", el);
    if (chars.length) gsap.from(chars, { yPercent: 115, rotate: 5, fontWeight: 200, duration: 1.1, ease: "expo.out", stagger: 0.022, delay: 0.45 });
    if (items.length) gsap.from(items, { y: 26, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.07, delay: 0.6 });
  }

  function goScene(to, fast) {
    to = Math.max(0, Math.min(LAST_SCENE, to));
    if (to === state.cur || state.lock) return;
    const from = state.cur, out = scenes[from], inn = scenes[to], dir = to > from ? 1 : -1;
    state.lock = true; state.cur = to; publish();
    out.inert = true; inn.inert = false;
    if (reduce) { out.classList.remove("dk-on"); inn.classList.add("dk-on"); }
    else {
      gsap.to(out, { opacity: 0, y: -30 * dir, duration: 0.45, ease: "power2.in", onComplete() { out.classList.remove("dk-on"); gsap.set(out, { clearProps: "opacity,transform" }); } });
      inn.classList.add("dk-on");
      gsap.fromTo(inn, { opacity: 0 }, { opacity: 1, duration: 0.4, delay: 0.5, clearProps: "opacity" });
      enter(inn);
    }
    const si = $(".dk-scene-in", inn); if (si) si.scrollTop = 0;
    if (state.engine) {
      state.engine.punch();
      state.engine.morphTo(from, to, fast ? 1 : 1.5, () => { state.lock = false; });
      state.engine.impulse(dir * 0.5);
    } else if (reduce) state.lock = false;
    else later(() => { state.lock = false; }, 500);
    if (to === SCENE.EXPERIENCE) startFocusTour(); else stopFocusTour();
  }

  /** set the scene without any transition (initial deep link) */
  function showScene(i) {
    scenes.forEach((s, j) => { s.classList.toggle("dk-on", j === i); s.inert = j !== i; });
    state.cur = i; publish();
    if (i === SCENE.EXPERIENCE) startFocusTour();
  }

  function startFocusTour() {
    stopFocusTour();
    if (state.cur !== SCENE.EXPERIENCE) return;
    focAuto = true;
    tourT = setInterval(() => {
      if (focAuto && state.cur === SCENE.EXPERIENCE) selectRole((st.focI + 1) % host.roleCount, true);
    }, TOUR_MS);
  }
  function stopFocusTour() { if (tourT) { clearInterval(tourT); tourT = null; } }

  function selectRole(i, auto) {
    st.focI = i; host.setRole(i);
    if (!auto) { focAuto = false; clearTimeout(roleT); roleT = later(() => { focAuto = true; }, MANUAL_HOLD_MS); }
  }

  return {
    goScene,
    showScene,
    selectRole: (i) => selectRole(i, false),
    hoverRole(i) { if (ctx.fine) { focAuto = false; st.focI = i; } },
    focusRole(i) { st.focI = i; },
    stopFocusTour,
    dispose() { stopFocusTour(); clearTimeout(roleT); },
  };
}
