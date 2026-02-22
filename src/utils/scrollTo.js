/**
 * Smooth-scrolls to a section by ID.
 * For "hero" it goes to the very top.
 * For every other section it finds the inner .container element
 * (which sits after the section's decorative divider) and
 * positions it 84px below the viewport top — 64px nav + 20px breathing room.
 *
 * @param {string} id - the section id ("hero" | "about" | "experience" | etc.)
 */
const scrollTo = (id) => {
  if (id === "hero") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const section = document.getElementById(id);
  if (!section) return;

  const container = section.querySelector(".container") || section;
  const absTop = container.getBoundingClientRect().top + window.scrollY;

  window.scrollTo({ top: absTop - 84, behavior: "smooth" });
};

export default scrollTo;
