/* WebGL particle field for the home deck. Ported from the artifact prototype.
   One THREE.Points with a single ShaderMaterial; every scene is a set of target positions and the
   shader morphs between any two of them. This module is loaded lazily (dynamic import) and only on
   screens wide enough for the full deck, so three.js never reaches phones or tablets.

   createEngine() returns a small imperative API; the deck controller owns navigation and
   input, the engine owns everything that draws. */
import * as THREE from "three";
import gsap from "gsap";
import { VERT, FRAG } from "./shaders";
import { buildAll, layout, LON_B } from "./targets";

/* Palette per site theme (colours as 0-1 RGB; keep in step with src/styles/tokens.css: amb = brand, vio = support,
   cya = spare). Dark is the additive-glow look; light swaps to ink-coloured points drawn with
   normal blending (additive light on a pale page would simply vanish). */
const PALETTE = {
  dark: {
    light: 0, px: 1, alphaK: 1,
    ice: [0.8, 0.84, 1], vio: [0.31, 0.88, 0.71], amb: [0.545, 0.576, 1], wat: [0.32, 0.78, 1], cya: [1, 0.56, 0.69],
  },
  light: {
    light: 1, px: 1.15, alphaK: 2.6,
    ice: [0.05, 0.07, 0.22], vio: [0.04, 0.48, 0.36], amb: [0.25, 0.28, 0.84], wat: [0.05, 0.42, 0.75], cya: [0.75, 0.15, 0.38],
  },
};

const DUST_DIM = 0.55;   // how much dust is dimmed at uLight = 1
const MX = (W) => [0, 0.03, 0.03, 2, 0.06, 0.12].map((v) => v * W);
const MA = [0, 0.78, 0.78, 0.55, 0.7, 0.6];

/**
 * @param {object} o
 * @param {HTMLElement} o.root            the .dk element (globe caption, in-globe class, chroma filter)
 * @param {HTMLElement} o.mount           where the canvas is inserted; a fresh canvas per engine, because
 *                                        a canvas whose context was force-lost cannot get a new one
 * @param {object} o.host                 { getCur, isLocked, fine, reduce, labels(), onFail(reason) }
 * @param {object} o.state                pointer + focus state shared with the controller (mxT, myT, onT, nx, ny, focI ...)
 * @param {string} o.theme                "dark" | "light"
 */
export function createEngine({ root, mount, host, theme, state }) {
  const reduce = host.reduce;
  const canvas = document.createElement("canvas");
  canvas.className = "dk-gl"; canvas.setAttribute("aria-hidden", "true");
  let W = window.innerWidth, H = window.innerHeight, VH = H;
  let U = null, GL = null, targets = [], N = 0, drawN = 0;
  let PLANET_R = 100, GLOBE_R = 150, HELIX_H = 200, WORK_C = [];
  let themeName = theme === "light" ? "light" : "dark";
  const st = state;
  const M = { a: 0, b: 0, t: 0 };
  let tw = null, holeTw = null;
  let lastT = 0, fpsAcc = 0, fpsN = 0, lastInside = false;
  let glHeartbeat = 0, glRecoverTries = 0, watchdog = null, disposed = false, failed = false;
  let impulse = 0, prevT = null, lastBerlinTxt = "";
  const cap = root.querySelector(".dk-globe-cap"), capSub = root.querySelector(".dk-globe-cap-sub");
  const chromaR = root.querySelector("#dk-chroma-r"), chromaB = root.querySelector("#dk-chroma-b");

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function measure() { W = window.innerWidth; H = window.innerHeight; VH = H; }
  function pickN() { return Math.round(Math.max(3000, Math.min(22000, W * VH * 0.0175))); }
  function pxScale() { return Math.max(0.62, Math.min(1, Math.sqrt(W * VH) / 1150)); }
  function basePx(dpr) { return 1.9 * dpr * pxScale() * PALETTE[themeName].px; }

  function allocGeo() {
    N = pickN(); drawN = N;
    const geo = new THREE.BufferGeometry();
    const mk = (sz) => new THREE.BufferAttribute(new Float32Array(N * sz), sz);
    const a = { position: mk(3), posB: mk(3), posS: mk(3), tagA: mk(1), tagB: mk(1), rnd: mk(1) };
    Object.keys(a).forEach((k) => geo.setAttribute(k, a[k]));
    for (let i = 0; i < N; i++) {
      a.rnd.array[i] = Math.random();
      const th = Math.random() * 6.2832, ph = Math.acos(2 * Math.random() - 1), R = Math.max(W, VH) * rnd(0.9, 1.6);
      a.posS.array[i * 3] = R * Math.sin(ph) * Math.cos(th);
      a.posS.array[i * 3 + 1] = R * Math.sin(ph) * Math.sin(th);
      a.posS.array[i * 3 + 2] = R * Math.cos(ph) * 0.6 - 200;
    }
    return geo;
  }

  function rebuildTargets() {
    const b = buildAll(W, VH, N, host.nameBox && host.nameBox());
    targets = b.targets; WORK_C = b.WORK_C; PLANET_R = b.PLANET_R; GLOBE_R = b.GLOBE_R; HELIX_H = b.HELIX_H;
    U.uGR.value = GLOBE_R; U.uHelixH.value = HELIX_H;
  }

  function applyPalette(name, animate) {
    const p = PALETTE[name];
    const set = (c, v) => {
      if (animate) gsap.to(c, { r: v[0], g: v[1], b: v[2], duration: 0.7, ease: "power2.inOut", overwrite: true });
      else c.setRGB(v[0], v[1], v[2]);
    };
    set(U.cIce.value, p.ice); set(U.cVio.value, p.vio); set(U.cAmb.value, p.amb); set(U.cWat.value, p.wat); set(U.cCya.value, p.cya);
    U.uAlphaK.value = p.alphaK;
    U.uPx.value = basePx(GL.dpr);
    GL.mat.blending = p.light ? THREE.NormalBlending : THREE.AdditiveBlending;
    if (animate) {
      gsap.to(U.uLight, { value: p.light, duration: 0.7, ease: "power2.inOut", overwrite: true });
      gsap.to(U.uDustDim, { value: p.light * DUST_DIM, duration: 0.7, ease: "power2.inOut", overwrite: true });
    } else { U.uLight.value = p.light; U.uDustDim.value = p.light * DUST_DIM; }
  }

  function initGL() {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr); renderer.setSize(W, VH, false);
    renderer.debug.onShaderError = (gl, program, vs, fs) => {
      let log = "";
      try { log = gl.getShaderInfoLog(vs) || gl.getShaderInfoLog(fs) || gl.getProgramInfoLog(program); } catch (e) { /* ignore */ }
      console.error("[deck] shader compile error", log);
      fail("shader compile error");
    };
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / VH, 1, 6000);
    camera.position.z = (VH / 2) / Math.tan(THREE.MathUtils.degToRad(22.5));
    const geo = allocGeo();
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z), C = (c) => new THREE.Color(c[0], c[1], c[2]);
    const p = PALETTE[themeName];
    U = {
      uMix: { value: 0 }, uBoot: { value: 0 }, uTime: { value: 0 }, uVel: { value: 0 }, uPx: { value: 1 },
      uRad: { value: Math.max(90, Math.min(W, VH) * 0.15) }, uOn: { value: 0 }, uOpen: { value: 0 }, uGR: { value: GLOBE_R },
      uHelixH: { value: HELIX_H }, uFun: { value: 0 }, uWarp: { value: 0 }, uShake: { value: 0 }, uMaskX: { value: 0 },
      uMaskA: { value: 0 }, uHole: { value: 0 }, uCamZ: { value: camera.position.z }, uLight: { value: p.light }, uAlphaK: { value: p.alphaK }, uDustDim: { value: p.light * DUST_DIM },
      uMouse: { value: V3(9999, 9999, 0) }, uHoleC: { value: V3(9999, 9999, 0) },
      uRip: { value: new THREE.Vector4(0, 0, -99, 0) }, uFoc: { value: new THREE.Vector4(0, 0, 120, 0) },
      uFunT: { value: new THREE.Vector2() }, uFunS: { value: new THREE.Vector2(60, 30) },
      cIce: { value: C(p.ice) }, cVio: { value: C(p.vio) }, cAmb: { value: C(p.amb) }, cWat: { value: C(p.wat) }, cCya: { value: C(p.cya) },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: U, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
      blending: p.light ? THREE.NormalBlending : THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
    GL = { renderer, scene, camera, geo, pts, mat, dpr, inv: new THREE.Matrix4(), v: new THREE.Vector3() };
    U.uPx.value = basePx(dpr);
    N = geo.attributes.position.count;
    rebuildTargets();
    M.a = -1; M.b = -1; setPair(host.getCur(), host.getCur());
  }

  function rebuild() {
    if (!GL) return;
    measure();
    GL.renderer.setSize(W, VH, false); GL.camera.aspect = W / VH; GL.camera.updateProjectionMatrix();
    GL.camera.position.z = (VH / 2) / Math.tan(THREE.MathUtils.degToRad(22.5));
    U.uCamZ.value = GL.camera.position.z;
    const old = GL.pts.geometry; GL.geo = allocGeo(); GL.pts.geometry = GL.geo; old.dispose();
    rebuildTargets();
    U.uPx.value = basePx(GL.dpr); U.uRad.value = Math.max(90, Math.min(W, VH) * 0.15);
    const a = M.a, b = M.b; M.a = -1; M.b = -1; setPair(a < 0 ? host.getCur() : a, b < 0 ? host.getCur() : b);
  }

  /* ---------- morph engine: any scene to any scene, previewable, always ends in a finished shape ---------- */
  function setPair(a, b) {
    if (!GL || (M.a === a && M.b === b)) return;
    M.a = a; M.b = b;
    const A = targets[a], B = targets[b], g = GL.geo;
    g.attributes.position.array.set(A.pos); g.attributes.posB.array.set(B.pos);
    g.attributes.tagA.array.set(A.tag); g.attributes.tagB.array.set(B.tag);
    ["position", "posB", "tagA", "tagB"].forEach((n) => { g.attributes[n].needsUpdate = true; });
  }
  function killTw() { if (tw) { tw.kill(); tw = null; } }
  function finish(to) { setPair(to, to); M.t = 0; }
  function morphTo(from, to, dur, then) {
    if (!GL) { M.a = M.b = to; if (then) then(); return; }
    killTw();
    if (reduce) { finish(to); if (then) then(); return; }
    if (!(M.a === from && M.b === to)) { const base = M.t > 0.5 ? M.b : M.a; setPair(base, to); M.t = 0; }
    tw = gsap.to(M, { t: 1, duration: dur, ease: "power2.inOut", overwrite: true, onComplete() { finish(to); if (then) then(); } });
  }
  function wOf(i) { return (M.a === i ? 1 - M.t : 0) + (M.b === i ? M.t : 0); }
  function preview(dir, amt) {
    const cur = host.getCur();
    if (!GL || (tw && tw.isActive())) return;
    let to = cur + dir;
    if (to < 0 || to > 5) { amt = Math.min(amt, 0.12); to = cur; }
    if (M.t < 0.01 || (M.a === cur && M.b === to)) setPair(cur, to);
    if (M.a === cur && M.b === to) M.t = Math.min(0.55, amt * 0.55);
  }
  function releasePreview() {
    if (!GL || (tw && tw.isActive())) return;
    killTw();
    if (M.t > 0.001) tw = gsap.to(M, { t: 0, duration: 0.5, ease: "power3.out", overwrite: true, onComplete() { tw = null; } });
  }
  function peek(i) {
    const cur = host.getCur();
    if (!GL || host.isLocked()) return;
    killTw();
    if (i === cur) { tw = gsap.to(M, { t: 0, duration: 0.6, ease: "power2.inOut", overwrite: true }); return; }
    if (M.t < 0.02 || (M.a === cur && M.b === i)) setPair(cur, i); else return;
    tw = gsap.to(M, { t: 1, duration: 0.9, ease: "power2.inOut", overwrite: true });
  }

  /* Chromatic-aberration punch on scene change: an SVG filter over the canvas (feOffset splits R/B),
     applied only while it plays so the canvas is not filtered at rest. Deliberately outside the WebGL
     pipeline, so a bug here can never break the particles themselves. */
  function punch() {
    if (reduce || !chromaR || !chromaB) return;
    const o = { v: 1 };
    gsap.killTweensOf(o);
    canvas.style.filter = "url(#dk-chroma)";
    gsap.to(o, {
      v: 0, duration: 0.55, ease: "power3.out",
      onUpdate() {
        const px = o.v * 7;
        chromaR.setAttribute("dx", px.toFixed(2)); chromaR.setAttribute("dy", (px * 0.15).toFixed(2));
        chromaB.setAttribute("dx", (-px).toFixed(2)); chromaB.setAttribute("dy", (-px * 0.15).toFixed(2));
      },
      onComplete() { canvas.style.filter = ""; },
    });
  }

  /* ---------- frame ---------- */
  function ripple(x, y, amp) { if (U) U.uRip.value.set(x, y, U.uTime.value, amp || 1); }
  function ripplePx(cx, cy, amp) { ripple(cx - W / 2, VH / 2 - cy, amp); }

  const berlinFmt = (() => { try { return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit", second: "2-digit" }); } catch (e) { return null; } })();

  function placeOverlays(w4, w5, pts) {
    if (!cap) return;
    const vis5 = w5 > 0.3 && host.getCur() === 5;
    cap.style.opacity = vis5 ? 1 : 0; cap.style.visibility = vis5 ? "visible" : "hidden";
    if (!vis5) return;
    const cx2 = W / 2 + pts.position.x, cy2 = VH / 2 - pts.position.y + U.uGR.value * 1.12;
    cap.style.left = cx2 + "px"; cap.style.top = Math.min(cy2, VH - 44) + "px";
    // hover the glow point: the caption becomes a live Berlin clock instead of the hint text
    const lb = host.labels(), inHere = root.classList.contains("dk-in-globe");
    const txt = inHere && berlinFmt ? berlinFmt.format(new Date()) + " · " + lb.localTime : (host.fine ? lb.enter : lb.touch);
    if (capSub && txt !== lastBerlinTxt) { capSub.textContent = txt; lastBerlinTxt = txt; }
  }

  function frame(time) {
    if (!GL || failed || disposed) return;
    let dt = Math.min(0.05, time - lastT); lastT = time; if (dt <= 0) dt = 0.016;
    const tS = time * 1.35;
    U.uTime.value = reduce ? 0 : tS;
    U.uMix.value = M.t;
    const a0 = M.a < 0 ? 0 : M.a, b0 = M.b < 0 ? 0 : M.b, mxs = MX(W);
    U.uMaskX.value = mxs[a0] * (1 - M.t) + mxs[b0] * M.t; U.uMaskA.value = MA[a0] * (1 - M.t) + MA[b0] * M.t;

    // motion energy: the field reacts to the gesture as well as to the morph itself
    if (prevT === null) prevT = M.t;
    st.vel += (((M.t - prevT) / dt * 0.02 + impulse) - st.vel) * (1 - Math.exp(-dt * 7));
    prevT = M.t; impulse *= 0.86;
    U.uVel.value = Math.max(-1, Math.min(1, st.vel));

    st.mx += (st.mxT - st.mx) * (1 - Math.exp(-dt * 16)); st.my += (st.myT - st.my) * (1 - Math.exp(-dt * 16));
    st.on += (st.onT - st.on) * (1 - Math.exp(-dt * 6));

    // group: parallax, planet tilt, globe wobble facing Berlin, placement
    const w1 = wOf(1), w4 = wOf(4), w5 = wOf(5), L = layout(W, VH), pts = GL.pts;
    st.ry += (st.nx * 0.05 - st.ry) * (1 - Math.exp(-dt * 3)); st.rx += (st.ny * 0.035 - st.rx) * (1 - Math.exp(-dt * 3));
    pts.position.set(L.cx * (w1 + w4 + w5), L.cy * (w1 + w4 + w5), 0);
    pts.rotation.set(st.rx + 0.42 * w4 + 0.5 * w5, st.ry + w5 * (-LON_B + (reduce ? 0 : Math.sin(tS * 0.26) * 0.55)), -0.3 * w4);
    pts.updateMatrixWorld(true);

    // cursor or finger into the group's local space; the planet uses its own (smaller) radius here,
    // so it gets exactly the globe's opening behaviour, just sized to itself
    const R = w4 > w5 ? PLANET_R : GLOBE_R, gx = pts.position.x, gy = pts.position.y;
    U.uGR.value = R;
    const dx = st.mx - gx, dy = st.my - gy, d2 = dx * dx + dy * dy, zf = d2 < R * R ? Math.sqrt(R * R - d2) : 0;
    GL.inv.copy(pts.matrixWorld).invert();
    GL.v.set(st.mx, st.my, zf * (w4 + w5)).applyMatrix4(GL.inv); U.uMouse.value.copy(GL.v);

    // the active sphere (globe or planet): an opening forms where you cross its edge, then closes behind you
    const inside = (w4 > 0.6 || w5 > 0.6) && st.on > 0.3 && d2 < (R * 1.04) * (R * 1.04);
    if (inside !== lastInside) {
      lastInside = inside; U.uHoleC.value.copy(GL.v);
      if (holeTw) holeTw.kill();
      holeTw = gsap.timeline().to(st, { hole: 1, duration: 0.32, ease: "expo.out" }).to(st, { hole: 0, duration: 0.85, ease: "power2.inOut" }, "+=.28");
      ripplePx(st.mx + W / 2, VH / 2 - st.my, inside ? 0.4 : 0.28);
      root.classList.toggle("dk-in-globe", inside);
    }
    st.open += ((inside ? 1 : 0) - st.open) * (1 - Math.exp(-dt * (inside ? 4.2 : 3)));
    U.uOpen.value = st.open; U.uHole.value = st.hole;
    U.uOn.value = st.on * (1 - st.open);          // no deflecting circle once inside the globe or planet

    // work scene: the highlighted domain glows (hover a tab, or it tours by itself)
    const w2 = wOf(2); st.foc += ((w2 > 0.5 ? 1 : 0) - st.foc) * (1 - Math.exp(-dt * 5));
    const wc = WORK_C[st.focI]; if (wc) U.uFoc.value.set(wc[0], wc[1], wc[2], st.foc * 0.9);

    placeOverlays(w4, w5, pts);

    try { GL.renderer.render(GL.scene, GL.camera); glHeartbeat = performance.now(); }
    catch (err) { recover("render() threw: " + (err && err.message)); return; }
    fpsAcc += dt; fpsN++;
    if (fpsN >= 50) {
      const avg = fpsAcc / fpsN; fpsAcc = 0; fpsN = 0;
      if (avg > 0.03 && drawN > Math.max(3000, N * 0.4)) { drawN = Math.max(3000, Math.floor(drawN * 0.8)); GL.geo.setDrawRange(0, drawN); }
    }
  }

  /* ---------- WebGL resilience ----------
     A lost context, a render() that throws, or a render loop that just stops all look identical from
     outside: a frozen or missing particle field with nothing in the console. All three are watched
     for and recovered from automatically instead of quietly sitting on a dead canvas. */
  function fail(reason) {
    if (failed) return;
    failed = true;
    gsap.ticker.remove(frame);
    host.onFail(reason);
  }
  function teardownGL() {
    if (holeTw) { holeTw.kill(); holeTw = null; }
    killTw();
    if (GL) {
      try { GL.pts.geometry.dispose(); GL.mat.dispose(); GL.renderer.dispose(); } catch (e) { /* ignore */ }
    }
    GL = null;
  }
  function recover(reason) {
    if (glRecoverTries >= 3) { console.warn("[deck] giving up on WebGL after 3 recovery attempts (" + reason + ")"); teardownGL(); U = null; fail(reason); return; }
    glRecoverTries++;
    console.warn("[deck] recovering WebGL: " + reason + " (attempt " + glRecoverTries + ")");
    try {
      const boot = U ? U.uBoot.value : 1;
      teardownGL(); U = null;
      initGL();
      U.uBoot.value = boot > 0 ? 1 : 0;       // skip the reveal on a recovery, snap straight to visible
      glHeartbeat = performance.now();
    } catch (err) {
      console.warn("[deck] WebGL recovery failed", err);
      teardownGL(); U = null; fail("recovery failed");
    }
  }
  const onLost = (e) => { e.preventDefault(); console.warn("[deck] webgl context lost"); };
  const onRestored = () => recover("context restored event");

  /* ---------- lifecycle ---------- */
  function start() {
    measure();
    mount.appendChild(canvas);
    canvas.addEventListener("webglcontextlost", onLost, false);
    canvas.addEventListener("webglcontextrestored", onRestored, false);
    initGL();
    glHeartbeat = performance.now();
    gsap.ticker.add(frame);
    watchdog = setInterval(() => {
      if (!GL || failed) return;
      if (document.visibilityState !== "visible") { glHeartbeat = performance.now(); return; }  // a backgrounded tab is not a stall
      if (performance.now() - glHeartbeat > 4000) recover("render loop stalled for 4s+");
    }, 2000);
  }

  function dispose() {
    disposed = true;
    gsap.ticker.remove(frame);
    clearInterval(watchdog);
    canvas.removeEventListener("webglcontextlost", onLost, false);
    canvas.removeEventListener("webglcontextrestored", onRestored, false);
    if (U) gsap.killTweensOf([U.uBoot, U.uFun, U.uWarp, U.uShake, U.uLight, U.cIce.value, U.cVio.value, U.cAmb.value, U.cWat.value, U.cCya.value]);
    if (GL) { try { GL.renderer.forceContextLoss(); } catch (e) { /* ignore */ } }
    teardownGL(); U = null;
    canvas.remove();
  }

  return {
    M, start, dispose, rebuild, morphTo, preview, releasePreview, peek, punch, ripplePx,
    uniforms: () => U,
    size: () => ({ W, H, VH }),
    impulse: (v) => { impulse += v; },
    /** the reveal-in when the boot loader hands over */
    reveal(instant) { if (!U) return; if (instant || reduce) U.uBoot.value = 1; else gsap.to(U.uBoot, { value: 1, duration: 3, ease: "power1.out" }); },
    setTheme(name, instant) {
      themeName = name === "light" ? "light" : "dark";
      if (U) applyPalette(themeName, !instant && !reduce);
    },
    failed: () => failed,
  };
}
