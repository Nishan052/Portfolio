/* Cursor and ring, the ripple on press, finger and tilt parallax, magnetic buttons, the card glow,
   and the letter-scramble on hover. Feeds the pointer state the WebGL engine reads (ctx.st). */
import gsap from "gsap";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/\\-_+*";
const HOVERABLE = "a,button,[data-hover],.dk-tile,.dk-card,.dk-chip,.dk-src,.dk-cred,.dk-tab";

/** letters jumble into place, for the wordmark, dock labels, the index button and card titles */
function scramble(el) {
  const txt = el.getAttribute("data-t") || el.textContent;
  el.setAttribute("data-t", txt);
  const o = { p: 0 };
  gsap.to(o, {
    p: 1, duration: 0.55, ease: "none", overwrite: true,
    onUpdate() {
      const n = Math.floor(o.p * txt.length);
      let s = txt.slice(0, n);
      for (let i = n; i < txt.length; i++) s += txt[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.textContent = s;
    },
    onComplete() { el.textContent = txt; },
  });
}

export function createPointer(ctx, bridge) {
  const { root, on, later, st, view, reduce, simple, $, $$ } = ctx;
  const curEl = $(".dk-cur"), ring = $(".dk-ring");
  let offT = null;

  if (curEl && ring) {   // installed whatever the pointer type at mount: it only reacts to real mouse/pen moves
    const cx = gsap.quickTo(curEl, "x", { duration: 0.06 }), cy = gsap.quickTo(curEl, "y", { duration: 0.06 });
    const rx = gsap.quickTo(ring, "x", { duration: 0.3, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.3, ease: "power3" });
    on(window, "pointermove", (e) => {
      if (e.pointerType === "touch") return;
      root.classList.add("dk-has-ptr"); cx(e.clientX); cy(e.clientY); rx(e.clientX); ry(e.clientY);
      st.mxT = e.clientX - view.W / 2; st.myT = view.H / 2 - e.clientY; st.onT = 1;
      st.nx = e.clientX / view.W - 0.5; st.ny = e.clientY / view.H - 0.5;
    }, { passive: true });
    on(document, "pointerleave", () => { st.onT = 0; });
    on(root, "pointerover", (e) => {
      ring.classList.toggle("dk-big", !!(e.target.closest && e.target.closest(HOVERABLE)));
      const sc = e.target.closest && e.target.closest("[data-scramble]");
      if (sc && !reduce && !(e.relatedTarget && sc.contains(e.relatedTarget))) scramble(sc);
    });
  }

  on(window, "pointerdown", (e) => {
    if (e.pointerType === "touch") root.classList.remove("dk-has-ptr");   // a finger: give the system cursor back
    bridge.ripplePx(e.clientX, e.clientY, e.pointerType === "touch" ? 0.7 : 0.55);
  }, { passive: true });

  // finger: the field follows it, and lets go shortly after it lifts
  const onTouch = (e) => {
    const t = e.touches && e.touches[0]; if (!t) return;
    st.mxT = t.clientX - view.W / 2; st.myT = view.H / 2 - t.clientY;
    if (st.onT < 0.5) { st.mx = st.mxT; st.my = st.myT; }
    st.onT = 1; st.nx = t.clientX / view.W - 0.5; st.ny = t.clientY / view.H - 0.5;
  };
  const offTouch = () => { clearTimeout(offT); offT = later(() => { st.onT = 0; }, 450); };
  on(window, "touchstart", onTouch, { passive: true });
  on(window, "touchmove", onTouch, { passive: true });
  on(window, "touchend", offTouch, { passive: true });
  on(window, "touchcancel", offTouch, { passive: true });

  // phones with the full deck: device tilt drives the parallax once the first touch grants permission
  if (!ctx.fine && window.DeviceOrientationEvent && !simple) {
    const tilt = (e) => {
      if (e.gamma == null || st.onT >= 0.5) return;
      st.nx = Math.max(-0.5, Math.min(0.5, e.gamma / 50));
      st.ny = Math.max(-0.5, Math.min(0.5, (e.beta - 50) / 70));
    };
    on(window, "touchend", () => {
      try {
        if (typeof window.DeviceOrientationEvent.requestPermission === "function") {
          window.DeviceOrientationEvent.requestPermission().then((r) => { if (r === "granted") on(window, "deviceorientation", tilt); }).catch(() => {});
        } else on(window, "deviceorientation", tilt);
      } catch (err) { /* ignore */ }
    }, { once: true, passive: true });
  }

  if (ctx.fine && !reduce) {
    $$(".dk-mag").forEach((b) => {
      const qx = gsap.quickTo(b, "x", { duration: 0.5, ease: "elastic.out(1,.6)" }), qy = gsap.quickTo(b, "y", { duration: 0.5, ease: "elastic.out(1,.6)" });
      on(b, "pointermove", (e) => { if (b.__lock) return; const r = b.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * 0.28); qy((e.clientY - r.top - r.height / 2) * 0.4); });
      on(b, "pointerleave", () => { if (b.__lock) return; qx(0); qy(0); });
    });
    $$(".dk-card").forEach((c) => {
      on(c, "pointermove", (e) => {
        const r = c.getBoundingClientRect();
        c.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        c.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
      });
    });
  }

  return { dispose() { clearTimeout(offT); } };
}
