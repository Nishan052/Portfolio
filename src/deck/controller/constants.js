/* Names shared by the deck's React side and its controller. */
export const SCENE_IDS = ["hero", "about", "experience", "projects", "toolkit", "contact"];
/** Scene indices by name, so nothing else needs to know that "projects" is 3. */
export const SCENE = { HERO: 0, ABOUT: 1, EXPERIENCE: 2, PROJECTS: 3, TOOLKIT: 4, CONTACT: 5 };
export const LAST_SCENE = SCENE_IDS.length - 1;
/** Old single-page anchors that should still land somewhere sensible. */
export const LEGACY_HASH = { skills: "toolkit", home: "hero" };

/** Scene index for a URL hash, or -1 when the hash is not a scene (e.g. #main-content). */
export function sceneFromHash(hash) {
  const h = (hash || "").replace("#", "");
  return SCENE_IDS.indexOf(LEGACY_HASH[h] || h);
}
