/* The six scenes as plain React markup. Everything that moves (transitions, char reveals, magnetic
   buttons) is done by the controller through the dk-* classes and data-* attributes in each scene. */
import Hero from "./Hero";
import About from "./About";
import Experience from "./Experience";
import Projects from "./Projects";
import Toolkit from "./Toolkit";
import Contact from "./Contact";

/**
 * @param {Function} props.t       i18next t
 * @param {number}   props.role    selected experience tab
 * @param {Function} props.deck    () => controller API (a getter: the controller mounts after first render)
 * @param {object}   props.carRef  ref for the projects carousel
 */
export default function Scenes({ t, role, deck, carRef }) {
  return (
    <main className="dk-deck" id="main-content">
      <Hero t={t} />
      <About t={t} />
      <Experience t={t} role={role} deck={deck} />
      <Projects t={t} carRef={carRef} />
      <Toolkit t={t} />
      <Contact t={t} />
    </main>
  );
}
