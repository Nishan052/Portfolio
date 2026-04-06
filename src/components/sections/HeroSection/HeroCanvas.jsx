import { useEffect, useRef, useContext } from "react";
import * as THREE from "three";
import { ThemeContext } from "../../../context/ThemeContext";
import useReducedMotion from "../../../hooks/useReducedMotion";

/**
 * Renders a floating 3D icosahedron with emissive glow as the hero avatar.
 * - Uses low-power WebGL context to minimise GPU usage alongside ThreeBackground.
 * - Pauses animation when the hero section scrolls out of view.
 * - Falls back to nothing on mobile/touch — parent shows static CSS fallback.
 */
export default function HeroCanvas() {
  const canvasRef   = useRef(null);
  const theme       = useContext(ThemeContext);
  const reduced     = useReducedMotion();
  const pausedRef   = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha:            true,
      antialias:        true,
      powerPreference:  "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    // ── Scene / Camera ────────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const size   = Math.min(canvas.clientWidth, canvas.clientHeight);
    const camera = new THREE.OrthographicCamera(
      -size / 2, size / 2, size / 2, -size / 2, 0.1, 1000
    );
    camera.position.z = 200;

    // ── Geometry ──────────────────────────────────────────────────────────────
    const geo    = new THREE.IcosahedronGeometry(70, 1);
    const accentColor = new THREE.Color(theme.accent || "#00e5ff");
    const accent2     = new THREE.Color(theme.accent2 || "#a855f7");

    // Solid mesh with emissive glow
    const mat = new THREE.MeshStandardMaterial({
      color:         accentColor,
      emissive:      accentColor,
      emissiveIntensity: 0.35,
      roughness:     0.3,
      metalness:     0.6,
      transparent:   true,
      opacity:       0.85,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // Wireframe overlay
    const wireGeo  = new THREE.IcosahedronGeometry(73, 1);
    const wireMat  = new THREE.MeshBasicMaterial({
      color:       accent2,
      wireframe:   true,
      transparent: true,
      opacity:     0.25,
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wire);

    // ── Lighting ──────────────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    const point = new THREE.PointLight(accentColor, 2.5, 400);
    point.position.set(100, 100, 150);
    scene.add(point);

    // ── IntersectionObserver — pause when off-screen ──────────────────────────
    const heroSection = document.getElementById("hero");
    const observer = heroSection
      ? new IntersectionObserver(
          ([entry]) => { pausedRef.current = !entry.isIntersecting; },
          { threshold: 0 }
        )
      : null;
    if (observer && heroSection) observer.observe(heroSection);

    // ── Animation loop ────────────────────────────────────────────────────────
    let rafId;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (pausedRef.current || reduced) return;
      const t = clock.getElapsedTime();
      mesh.rotation.x = t * 0.25;
      mesh.rotation.y = t * 0.35;
      wire.rotation.x = -t * 0.2;
      wire.rotation.y = t * 0.3;
      // Subtle pulse: scale breathing
      const pulse = 1 + Math.sin(t * 1.5) * 0.04;
      mesh.scale.setScalar(pulse);
      wire.scale.setScalar(pulse * 1.03);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
    };
  }, [theme.accent, theme.accent2, reduced]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width:           "100%",
        height:          "100%",
        display:         "block",
        pointerEvents:   "none",
      }}
      aria-hidden="true"
    />
  );
}
