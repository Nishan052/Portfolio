/**
 * The system cursor is hidden only while the deck's own cursor is tracking the mouse. These tests pin
 * the "cursor vanished after switching screen sizes" bug: the pointer type is read live, the custom
 * cursor works whatever the pointer type was at mount, and touch hands the system cursor back.
 */
jest.mock("gsap", () => ({ __esModule: true, default: { quickTo: () => jest.fn(), to: jest.fn(), set: jest.fn() } }));

const { createContext } = require("./context");
const { createPointer } = require("./pointer");

function mockPointerMedia(initialFine) {
  let fine = initialFine;
  const listeners = new Set();
  const mq = {
    get matches() { return fine; },
    addEventListener: (_t, fn) => listeners.add(fn),
    removeEventListener: (_t, fn) => listeners.delete(fn),
  };
  window.matchMedia = jest.fn((q) => (q.includes("pointer: fine") ? mq : { matches: false, addEventListener() {}, removeEventListener() {} }));
  return { set(v) { fine = v; listeners.forEach((fn) => fn()); } };
}

function setup(initialFine) {
  const media = mockPointerMedia(initialFine);
  document.body.innerHTML = '<div class="dk"><div class="dk-cur"></div><div class="dk-ring"></div></div>';
  const root = document.querySelector(".dk");
  const ctx = createContext(root, { simple: false, theme: "dark", roleCount: 4 });
  const pointer = createPointer(ctx, { ripplePx: jest.fn() });
  return { media, root, ctx, pointer };
}

// jsdom has no PointerEvent: a MouseEvent carrying a pointerType is all the handlers read
const pointerEvent = (type, pointerType) => Object.assign(new MouseEvent(type, { clientX: 10, clientY: 10, bubbles: true }), { pointerType });
const move = (pointerType) => window.dispatchEvent(pointerEvent("pointermove", pointerType));

describe("custom cursor", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  test("system cursor stays visible until the deck's own cursor has seen a mouse move", () => {
    const { root } = setup(true);
    expect(root.classList.contains("dk-has-ptr")).toBe(false);
    move("mouse");
    expect(root.classList.contains("dk-has-ptr")).toBe(true);
  });

  test("still works when the page was mounted under a touch pointer and the mouse arrives later", () => {
    const { root, media } = setup(false);          // mounted as if on a phone
    expect(root.classList.contains("dk-touch")).toBe(true);
    media.set(true);                                // window switched to desktop / mouse
    expect(root.classList.contains("dk-touch")).toBe(false);
    move("mouse");
    expect(root.classList.contains("dk-has-ptr")).toBe(true);
  });

  test("the touch class follows the pointer type both ways", () => {
    const { root, media } = setup(true);
    media.set(false);
    expect(root.classList.contains("dk-touch")).toBe(true);
    media.set(true);
    expect(root.classList.contains("dk-touch")).toBe(false);
  });

  test("touch gives the system cursor back", () => {
    const { root } = setup(true);
    move("mouse");
    window.dispatchEvent(pointerEvent("pointerdown", "touch"));
    expect(root.classList.contains("dk-has-ptr")).toBe(false);
  });

  test("touch moves never switch the custom cursor on", () => {
    const { root } = setup(true);
    move("touch");
    expect(root.classList.contains("dk-has-ptr")).toBe(false);
  });

  test("dispose stops listening for pointer-type changes", () => {
    const { ctx, media, root } = setup(true);
    ctx.dispose();
    media.set(false);
    expect(root.classList.contains("dk-touch")).toBe(false);
  });
});
