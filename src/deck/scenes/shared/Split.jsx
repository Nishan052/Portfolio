import { Fragment } from "react";

/** A heading whose letters are individual spans, so the controller can stagger them in. */
export default function Split({ id, text }) {
  const words = text.split(" ");
  return (
    <h2 id={id} className="dk-disp" aria-label={text}>
      {words.map((w, wi) => (
        <Fragment key={wi}>
          <span className="dk-w" aria-hidden="true">{Array.from(w).map((c, ci) => <span key={ci} className="dk-ch">{c}</span>)}</span>
          {wi < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </h2>
  );
}
