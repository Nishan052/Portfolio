import { sceneFromHash, SCENE_IDS, SCENE, LAST_SCENE } from "./constants";

describe("sceneFromHash", () => {
  test("maps every scene id to its index", async () => {
    SCENE_IDS.forEach((id, i) => expect(sceneFromHash(`#${id}`)).toBe(i));
  });
  test("maps the legacy #skills anchor to the toolkit scene", async () => {
    expect(sceneFromHash("#skills")).toBe(SCENE_IDS.indexOf("toolkit"));
  });
  test("returns -1 for anything that is not a scene (e.g. the skip link target)", async () => {
    expect(sceneFromHash("#main-content")).toBe(-1);
    expect(sceneFromHash("")).toBe(-1);
  });
});

describe("scene constants", () => {
  test("SCENE names line up with SCENE_IDS", () => {
    expect(SCENE_IDS[SCENE.PROJECTS]).toBe("projects");
    expect(SCENE_IDS[SCENE.CONTACT]).toBe("contact");
    expect(LAST_SCENE).toBe(SCENE_IDS.length - 1);
  });
});
