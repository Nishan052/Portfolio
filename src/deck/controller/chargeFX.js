/* The button "charge" effect. Warp buttons (GitHub, LinkedIn, email) are links, but a real href gets
   followed the instant of the click (by the browser, or by an embedding host), so preventDefault can
   never make it wait. The URL therefore lives in data-href and the only open that can happen is the
   one made here, `navDelay` seconds after the click, once the effect has played.

   With WebGL the particles stream into the button and a wave washes across the screen. If WebGL
   is unavailable on a desktop, a CSS fill stands in so the open still waits for *something* to play.
   On tablets and phones (simple mode) there is no effect at all: the link opens on tap. */
import gsap from "gsap";
import siteConfig from "../../config/site";
import openLink from "../../utils/openLink";
import copyText from "../../utils/copyText";

const NAV_DELAY = siteConfig.deck.navDelay;

export function createCharge(ctx) {
  const { root, host, on, reduce, simple, view, state, $ } = ctx;
  let cancel = null;

  function charge(btn, onDone) {
    if (reduce || simple) { if (onDone) onDone(); return; }   // nothing to play: open at once
    const lbl = $(".dk-lbl", btn), orig = lbl ? lbl.textContent : "", fx = host.text().fx;
    const resetBtn = () => {
      gsap.set(btn, { x: 0, y: 0, rotation: 0 }); btn.classList.remove("dk-charging"); btn.style.setProperty("--fill", 0); if (lbl) lbl.textContent = orig;
    };
    const U = state.engine && state.engine.uniforms();

    if (!U) {
      btn.classList.add("dk-charging"); btn.style.setProperty("--fill", 0);
      if (lbl) lbl.textContent = fx.sending;
      const tw = gsap.to(btn, { "--fill": 1, duration: NAV_DELAY, ease: "power1.inOut", onComplete() { cancel = null; resetBtn(); if (onDone) onDone(); } });
      cancel = () => { tw.kill(); resetBtn(); btn.__busy = false; cancel = null; };
      return;
    }

    const { W, H } = view;
    const r = btn.getBoundingClientRect(), cxp = r.left + r.width / 2, cyp = r.top + r.height / 2;
    gsap.killTweensOf([U.uFun, U.uWarp, U.uShake]);
    U.uFunT.value.set(cxp - W / 2, H / 2 - cyp); U.uFunS.value.set(r.width * 0.7, r.height * 0.5);
    root.style.setProperty("--fx", (cxp / W * 100) + "%"); root.style.setProperty("--fy", (cyp / H * 100) + "%");
    gsap.killTweensOf(btn); btn.classList.add("dk-charging"); btn.style.setProperty("--fill", 0);
    if (lbl) lbl.textContent = fx.sending;
    const wf = $(".dk-wave-fx"), flash = $(".dk-flash"), reach = Math.hypot(W, H) * 1.05 + "px";
    gsap.set(wf, { opacity: 0, "--wr": "0px" });
    const amp = { v: 0 }, tick = () => { const a = amp.v * 6; gsap.set(btn, { x: (Math.random() - 0.5) * a, y: (Math.random() - 0.5) * a * 0.6, rotation: (Math.random() - 0.5) * amp.v * 1.4 }); };
    gsap.ticker.add(tick);
    const tl = gsap.timeline({
      onComplete() {
        cancel = null;
        gsap.ticker.remove(tick);
        if (onDone) onDone();                    // open now, while this tab still has focus
        resetBtn(); gsap.set(wf, { opacity: 0, "--wr": "0px" }); U.uShake.value = 0;
        // the field re-forms with an ease instead of snapping back (plays out when the visitor returns to this tab)
        gsap.to(U.uWarp, { value: 0, duration: 1.2, ease: "power2.out" });
        gsap.to(U.uFun, { value: 0, duration: 1.6, ease: "power2.inOut" });
      },
    });
    // phase 1: particles stream into the button over a slow, even pull (not a late snap)
    tl.to(U.uFun, { value: 1, duration: 1.9, ease: "sine.inOut" }, 0)
      .to(btn, { "--fill": 1, duration: 1.9, ease: "power1.inOut" }, 0)
      .to(amp, { v: 1, duration: 1.9, ease: "power1.in", onUpdate() { U.uShake.value = amp.v; } }, 0)
      .add(() => { if (lbl) lbl.textContent = fx.sent; }, 1.8)
      // phase 2: a thin wave washes out from the button across the screen and the field blows outward
      .set(wf, { opacity: 1 }, 1.9)
      .to(wf, { "--wr": reach, duration: 1.0, ease: "power2.out" }, 1.9)
      .to(wf, { opacity: 0, duration: 0.7, ease: "power1.in" }, 2.2)
      .to(U.uWarp, { value: 1, duration: 0.6, ease: "power2.inOut" }, 1.95)
      .to(flash, { opacity: 0.32, duration: 0.2, ease: "power2.in" }, 1.98)
      .to(flash, { opacity: 0, duration: 0.5, ease: "power2.out" }, 2.18)
      .to(amp, { v: 0, duration: 0.3, ease: "power2.out" }, 2.05);
    // phase 3: only once the wave has washed out does the tab open (tl's onComplete). The whole
    // sequence is stretched to NAV_DELAY so the open lands exactly that long after the click.
    tl.duration(NAV_DELAY);
    cancel = () => {
      tl.kill(); gsap.ticker.remove(tick); resetBtn(); btn.__busy = false; cancel = null;
      gsap.set(wf, { opacity: 0, "--wr": "0px" }); gsap.set(flash, { opacity: 0 });
      U.uFun.value = 0; U.uWarp.value = 0; U.uShake.value = 0;
    };
  }

  /** Click / Enter / Space on a warp button: charge, then open its data-href (copying the address first for mailto). */
  function warpGo(btn) {
    if (btn.__busy) return;                     // a repeat click / key while charging is swallowed
    btn.__busy = true;
    const url = btn.getAttribute("data-href"), mail = /^mailto:/i.test(url || ""), tx = host.text().fx;
    charge(btn, () => {
      if (mail) copyText(host.email).then((ok) => host.toast(ok ? tx.mailCopied : tx.mailFail));
      openLink(url);
      btn.__busy = false;
    });
  }

  // A hidden tab gets no animation frames: the charge would freeze, then finish (and open the link)
  // whenever the visitor next returns. Drop it instead.
  on(document, "visibilitychange", () => { if (document.hidden && cancel) cancel(); });

  return { warpGo, dispose() { if (cancel) cancel(); } };
}
