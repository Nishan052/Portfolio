import gsap from "gsap";

/* Calls into the WebGL engine that must be harmless when there is none (simple mode, WebGL
   unavailable, engine still loading). The other modules use these instead of touching the engine. */

/** What the engine may ask of the controller: the current scene, whether a transition is running, labels. */
export function createEngineHost(ctx) {
  const { state, root, reduce, host, later } = ctx;
  return {
    reduce,
    get fine() { return ctx.fine; },
    getCur: () => state.cur,
    isLocked: () => state.lock,
    labels: () => host.text().globe,
    // the free band (viewport px) between the hero's role line and its description block, where the particle name may go
    nameBox() {
      const role = ctx.$(".dk-hero-role"), bottom = ctx.$(".dk-hero-bottom");
      if (!role || !bottom) return null;
      const rest = (el) => { const r = el.getBoundingClientRect(), y = gsap.getProperty(el, "y") || 0; return { top: r.top - y, bottom: r.bottom - y }; };   // ignore the entrance offset
      return { top: rest(role).bottom, bottom: rest(bottom).top };
    },
    onFail(reason) {
      console.warn("[deck] particles unavailable:", reason);
      const dead = state.engine;
      state.engine = null;
      root.classList.add("dk-nogl");
      if (dead) later(() => dead.dispose(), 0);
    },
  };
}

export function createBridge(ctx) {
  const { state } = ctx;
  return {
    impulse: (v) => { if (state.engine) state.engine.impulse(v); },
    ripplePx: (x, y, a) => { if (state.engine) state.engine.ripplePx(x, y, a); },
    preview: (dir, amt) => { if (state.engine) state.engine.preview(dir, amt); },
    releasePreview: () => { if (state.engine) state.engine.releasePreview(); },
    peek: (i) => { if (state.engine) state.engine.peek(i); },
  };
}
