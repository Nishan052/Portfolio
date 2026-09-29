import { useCallback, useEffect, useState } from "react";
import siteConfig from "../../../config/site";
import projects from "../../../data/projects.json";
import { SCENE } from "../../controller/constants";
import { PROJECT_DEMOS } from "../../demos";
import { Scene, Split, Chip } from "../shared";
import "./Projects.css";

const { contact } = siteConfig;

export default function Projects({ t, carRef }) {
  const items = t("projects.items", { returnObjects: true });
  const [pos, setPos] = useState({ n: 1, p: 0, start: true, end: false });
  const total = projects.length;

  const update = useCallback(() => {
    const car = carRef.current; if (!car) return;
    const max = car.scrollWidth - car.clientWidth, c = car.querySelector(".dk-card");
    setPos({
      p: max > 0 ? car.scrollLeft / max : 0,
      n: Math.min(total, 1 + Math.round(car.scrollLeft / (c ? c.offsetWidth + 22 : 1))),
      start: car.scrollLeft < 4, end: car.scrollLeft > max - 4,
    });
  }, [carRef, total]);

  // mouse drag-to-scroll (touch already scrolls natively)
  useEffect(() => {
    const car = carRef.current; if (!car) return undefined;
    let down = false, moved = false, sx = 0, sl = 0;
    const onDown = (e) => { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = car.scrollLeft; };
    const onMove = (e) => { if (!down) return; const d = e.clientX - sx; if (Math.abs(d) > 4) { moved = true; car.classList.add("dk-drag"); } car.scrollLeft = sl - d; };
    const onUp = () => { if (!down) return; down = false; car.classList.remove("dk-drag"); };
    const onClick = (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } };
    car.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    car.addEventListener("click", onClick, true);
    update();
    window.addEventListener("resize", update);
    return () => {
      car.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp); car.removeEventListener("click", onClick, true);
      window.removeEventListener("resize", update);
    };
  }, [carRef, update]);

  const step = (d) => {
    const car = carRef.current, c = car && car.querySelector(".dk-card"); if (!c) return;
    car.scrollBy({ left: d * (c.offsetWidth + 22), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  return (
    <Scene scene={SCENE.PROJECTS} t={t} className="dk-projects">
      <div className="dk-scene-in dk-wide">
        <div className="dk-head" data-in>
          <div><p className="dk-mono dk-mute dk-kick">{t("projects.tag")}</p><Split id="proj-h" text={t("deck.projects.title")} /></div>
          <p className="dk-mono dk-mute dk-veil" style={{ padding: "8px 12px", maxWidth: 300 }}>{t("deck.projects.hint")}</p>
        </div>
        <div className="dk-car" ref={carRef} data-hscroll data-in onScroll={update}>
          {projects.map((p, k) => {
            const it = (Array.isArray(items) && items[k]) || {}, Demo = PROJECT_DEMOS[k];
            return (
              <a key={p.id || p.title} className="dk-card" href={p.github || contact.githubUrl} target="_blank" rel="noopener noreferrer" aria-label={t("deck.projects.card", { title: p.title })}>
                <div className="dk-viz">{Demo ? <Demo t={t} /> : null}</div>
                <div className="dk-meta">
                  <p className="dk-mono dk-mute">{String(k + 1).padStart(2, "0")} · {it.category}</p>
                  <h3 data-scramble>{p.title}</h3>
                  <p className="dk-hl">{it.highlights && it.highlights[0]}</p>
                  <div className="dk-chips">{p.tech.slice(0, 4).map((s) => <Chip key={s}>{s}</Chip>)}</div>
                </div>
              </a>
            );
          })}
        </div>
        <div className="dk-car-ctl" data-in>
          <button className="dk-round" type="button" aria-label={t("deck.projects.prev")} disabled={pos.start} onClick={() => step(-1)}>←</button>
          <span className="dk-mono">{String(pos.n).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
          <i><b style={{ transform: `scaleX(${pos.p})` }} /></i>
          <button className="dk-round" type="button" aria-label={t("deck.projects.next")} disabled={pos.end} onClick={() => step(1)}>→</button>
        </div>
      </div>
    </Scene>
  );
}
