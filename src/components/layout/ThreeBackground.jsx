import { useEffect, useRef, memo } from "react";
import * as THREE from "three";

/**
 * Fixed-position Three.js canvas with:
 * - Particle field (800 points, dual-colour gradient)
 * - Neural-net connection lines
 * - Rotating wireframe torus & icosahedron
 * - Mouse-parallax camera drift
 *
 * Entirely re-mounts when isDark changes so colours update correctly.
 */
const ThreeBackground = memo(({ isDark }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ─────────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    // ── Particles ────────────────────────────────────────────────────────────────
    const COUNT = 800;
    const pos   = new Float32Array(COUNT * 3);
    const cols  = new Float32Array(COUNT * 3);
    const c1    = new THREE.Color(isDark ? 0x00e5ff : 0x2563eb);
    const c2    = new THREE.Color(isDark ? 0xa855f7 : 0x7c3aed);

    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
      const c = c1.clone().lerp(c2, Math.random());
      cols[i * 3]     = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos,  3));
    geo.setAttribute("color",    new THREE.BufferAttribute(cols, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.25, vertexColors: true, transparent: true,
      opacity: isDark ? 0.55 : 0.45, sizeAttenuation: true,
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // ── Connection lines ─────────────────────────────────────────────────────────
    const lineMat   = new THREE.LineBasicMaterial({
      color: isDark ? 0x00e5ff : 0x2563eb,
      transparent: true,
      opacity: isDark ? 0.04 : 0.03,
    });
    const lineGroup = new THREE.Group();
    const nodes     = Array.from({ length: 40 }, () =>
      new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 30
      )
    );
    nodes.forEach((a, i) =>
      nodes.slice(i + 1).forEach((b) => {
        if (a.distanceTo(b) < 16)
          lineGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), lineMat));
      })
    );
    scene.add(lineGroup);

    // ── Torus ────────────────────────────────────────────────────────────────────
    const torusMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x00e5ff : 0x2563eb,
      wireframe: true, transparent: true,
      opacity: isDark ? 0.07 : 0.05,
    });
    const torus = new THREE.Mesh(new THREE.TorusGeometry(8, 0.7, 16, 80), torusMat);
    torus.position.set(28, -10, -15);
    scene.add(torus);

   
    const icoMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0xa855f7 : 0x7c3aed,
      wireframe: true, transparent: true,
      opacity: isDark ? 0.09 : 0.06,
    });
    const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(5, 1), icoMat);
    ico.position.set(-28, 12, -20);
    scene.add(ico);

    // ── Mouse parallax ───────────────────────────────────────────────────────────
    let mx = 0, my = 0;
    const onMouse  = (e) => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse);

    // ── Resize ───────────────────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // ── Animation loop ───────────────────────────────────────────────────────────
    let t = 0, animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.004;

      particles.rotation.y = t * 0.05;
      particles.rotation.x = Math.sin(t * 0.3) * 0.02;
      torus.rotation.x     = t * 0.3;
      torus.rotation.y     = t * 0.2;
      ico.rotation.x       = t * 0.25;
      ico.rotation.z       = t * 0.15;
      lineGroup.rotation.y = t * 0.03;

      camera.position.x += (mx * 3 - camera.position.x) * 0.03;
      camera.position.y += (-my * 2 - camera.position.y) * 0.03;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize",    onResize);
      renderer.dispose();
    };
  }, [isDark]);

  return <canvas ref={canvasRef} id="three-canvas" />;
});

export default ThreeBackground;
