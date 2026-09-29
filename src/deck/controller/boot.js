/* The boot loader. A DOM element per particle can't get near the density of the real field (thousands
   of GPU points), so the loader is a small canvas-2D system: dots burst outward from the ball to points
   over the whole screen, then settle into the same idle drift the real dust has, so the handoff to the
   WebGL field underneath reads as continuous.

   It plays once per page load: coming back from /blogs skips straight to the deck. */
import gsap from "gsap";
import siteConfig from "../../config/site";

let bootedOnce = false;
export const hasBooted = () => bootedOnce;

export function createBoot(ctx) {
  const { root, host, reduce, simple, state, view, scenes, $, $$ } = ctx;
  let raf = null, tl = null;

  function start() {
    const boot = $(".dk-boot");
    if (simple || bootedOnce || !boot) {
      bootedOnce = true;
      if (state.engine) state.engine.reveal(simple || host.instant);
      host.bootDone();
      if (!reduce && !host.instant) gsap.from($$("[data-in]", scenes[state.cur]), { y: 20, opacity: 0, duration: 0.9, stagger: 0.07, ease: "expo.out" });
      return;
    }
    bootedOnce = true;

    const { W, H } = view;
    const bar = $(".dk-boot-bar"), field = $(".dk-boot-field"), ball = $(".dk-boot-ball"), orbSlot = $(".dk-boot-orb");
    const ink = getComputedStyle(root).getPropertyValue("--text").trim() || "#fff";
    const o = { v: 0 }, g = field.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2);
    field.width = W * dpr; field.height = H * dpr; field.style.width = W + "px"; field.style.height = H + "px";
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const br = orbSlot.getBoundingClientRect(), bx = br.left + br.width / 2, by = br.top + br.height / 2;
    ball.style.left = bx + "px"; ball.style.top = by + "px";

    const N = reduce ? 0 : siteConfig.deck.bootParticles, parts = [];
    let spawned = 0, clock = 0, last = 0;
    const spawn = () => parts.push({
      tx: Math.random() * W, ty: Math.random() * H, t: 0, dur: 0.8 + Math.random() * 1.1,
      size: 0.6 + Math.random() * 1.7, peak: 0.22 + Math.random() * 0.5,
      jx: (Math.random() - 0.5) * 44, jy: (Math.random() - 0.5) * 44, ph: Math.random() * 6.2832,
    });
    const draw = (now) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now; clock += dt;
      g.clearRect(0, 0, W, H); g.fillStyle = ink;
      for (const p of parts) {
        let a, x, y;
        if (p.t < p.dur) {
          p.t += dt;
          const f = Math.min(1, p.t / p.dur), e = 1 - Math.pow(1 - f, 3);
          x = bx + (p.tx - bx) * e; y = by + (p.ty - by) * e; a = p.peak * f;
        } else {
          x = p.tx + Math.sin(clock * 0.6 + p.ph) * p.jx * 0.5; y = p.ty + Math.cos(clock * 0.5 + p.ph) * p.jy * 0.5; a = p.peak;
        }
        g.globalAlpha = a; g.beginPath(); g.arc(x, y, p.size, 0, 6.2832); g.fill();
      }
      g.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    if (!reduce) raf = requestAnimationFrame(draw);

    tl = gsap.timeline();
    // one burst of particles per ~0.06% of progress: the field IS the progress readout
    tl.to(o, { v: 100, duration: reduce ? 0.15 : 1.6, ease: "power2.inOut", onUpdate() {
      bar.style.transform = "scaleX(" + (o.v / 100) + ")";
      const target = Math.floor(o.v / 100 * N);
      while (spawned < target) { spawn(); spawned++; }
    } });
    tl.add(() => { if (state.engine) state.engine.reveal(false); });
    // fade the loader field out in place; the real field fills the same screen-wide space underneath at the same moment
    tl.add(() => {
      if (reduce) return;
      gsap.to(field, { opacity: 0, duration: 0.8, ease: "power1.in" });
      gsap.to(ball, { scale: 0.25, opacity: 0, duration: 0.55, ease: "power2.in" });
    }, "<+=.05");
    tl.to(boot, { opacity: 0, duration: 0.8, ease: "power2.out", onComplete() { if (raf) cancelAnimationFrame(raf); host.bootDone(); } }, "<+=.05");
    if (!reduce) tl.from($$("[data-in]", scenes[state.cur]), { y: 26, opacity: 0, duration: 1.2, stagger: 0.1, ease: "expo.out" }, "<+=.15");
  }

  return { start, dispose() { if (raf) cancelAnimationFrame(raf); if (tl) tl.kill(); } };
}
