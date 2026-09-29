import experience from "../../../data/experience.json";
import { SCENE } from "../../controller/constants";
import { Scene, Split, Chip } from "../shared";
import "./Experience.css";

// newest first (experience.json is already newest first); tab k lights the k-th outline in the skyline: ship, tall, middle, small
const ORDER = [0, 1, 2, 3];

export default function Experience({ t, role, deck }) {
  const items = t("experience.items", { returnObjects: true });
  const domains = t("deck.experience.domains", { returnObjects: true });
  return (
    <Scene scene={SCENE.EXPERIENCE} t={t}>
      <div className="dk-scene-in">
        <p className="dk-mono dk-mute dk-kick" data-in>{t("experience.tag")}</p>
        <Split id="exp-h" text={t("deck.experience.title")} />
        <div className="dk-tabs" role="tablist" aria-label={t("deck.experience.roles")} data-in>
          {ORDER.map((idx, k) => {
            const e = experience[idx];
            return (
              <button key={idx} className="dk-tab" role="tab" type="button" id={`dk-tab${k}`} aria-controls={`dk-role${k}`}
                aria-selected={role === k} onClick={() => deck().selectRole(k)}
                onPointerEnter={() => deck().hoverRole(k)} onFocus={() => deck().focusRole(k)}>
                <span className="dk-mono">{e.period.split(" ").pop()}</span>
                <b>{(Array.isArray(domains) && domains[idx]) || e.company}</b>
              </button>
            );
          })}
        </div>
        <div data-in>
          {ORDER.map((idx, k) => {
            const e = experience[idx], tx = (Array.isArray(items) && items[idx]) || {};
            return (
              <article key={idx} className={`dk-role dk-veil${role === k ? " dk-on" : ""}`} role="tabpanel" id={`dk-role${k}`} aria-labelledby={`dk-tab${k}`}>
                <p className="dk-mono dk-mute">{e.period} — {e.end} · {e.duration}</p>
                <h3>{e.role.split(/\s*→\s*/).pop()}</h3>
                <p className="dk-co">{e.company}</p>
                <p className="dk-mono dk-mute">{e.location}</p>
                <ul>{(tx.highlights || []).slice(0, 2).map((h) => <li key={h}>{h}</li>)}</ul>
                <div className="dk-chips">{e.skills.slice(0, 5).map((s) => <Chip key={s}>{s}</Chip>)}</div>
              </article>
            );
          })}
        </div>
      </div>
    </Scene>
  );
}
