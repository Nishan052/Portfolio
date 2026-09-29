/**
 * The charge effect is what stands between a click and a link opening, so its promises are tested
 * directly: nothing opens before navDelay, exactly one open happens, repeat clicks are swallowed, and
 * leaving the tab cancels it. gsap is replaced by a timer-driven stand-in so fake timers drive it.
 */
import siteConfig from "../../config/site";

jest.mock("gsap", () => {
  const tween = (vars) => {
    const id = setTimeout(() => vars.onComplete && vars.onComplete(), (vars.duration || 0) * 1000);
    return { kill: () => clearTimeout(id) };
  };
  return { __esModule: true, default: { to: (_t, vars) => tween(vars), set: jest.fn(), killTweensOf: jest.fn(), ticker: { add: jest.fn(), remove: jest.fn() } } };
});
jest.mock("../../utils/openLink", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../../utils/copyText", () => ({ __esModule: true, default: jest.fn() }));

const openLink = require("../../utils/openLink").default;
const copyText = require("../../utils/copyText").default;
const { createCharge } = require("./chargeFX");

const DELAY_MS = siteConfig.deck.navDelay * 1000;

function setup({ reduce = false, simple = false } = {}) {
  document.body.innerHTML = '<div id="root"><button data-warp data-href="https://github.com/x"><span class="dk-lbl">GitHub</span></button></div>';
  const root = document.getElementById("root");
  const btn = root.querySelector("button");
  const host = {
    email: "me@example.com",
    toast: jest.fn(),
    text: () => ({ fx: { sending: "Sending", sent: "Sent", mailCopied: "copied", mailFail: "fail" } }),
  };
  const ctx = {
    root, host, reduce, simple, view: { W: 1000, H: 800 }, state: { engine: null },
    on: (target, type, fn) => target.addEventListener(type, fn),
    $: (s, r) => (r || root).querySelector(s),
  };
  return { charge: createCharge(ctx), btn, host };
}

describe("charge effect (no WebGL)", () => {
  beforeEach(() => { jest.useFakeTimers(); copyText.mockResolvedValue(true); });   // CRA resets mock implementations between tests
  afterEach(() => jest.useRealTimers());

  test("does not open the link before navDelay, then opens it exactly once", () => {
    const { charge, btn } = setup();
    charge.warpGo(btn);
    expect(btn.querySelector(".dk-lbl").textContent).toBe("Sending");
    jest.advanceTimersByTime(DELAY_MS - 1);
    expect(openLink).not.toHaveBeenCalled();
    jest.advanceTimersByTime(2);
    expect(openLink).toHaveBeenCalledTimes(1);
    expect(openLink).toHaveBeenCalledWith("https://github.com/x");
    expect(btn.querySelector(".dk-lbl").textContent).toBe("GitHub");     // label restored
  });

  test("a repeat click while charging is swallowed", () => {
    const { charge, btn } = setup();
    charge.warpGo(btn); charge.warpGo(btn); charge.warpGo(btn);
    jest.advanceTimersByTime(DELAY_MS + 10);
    expect(openLink).toHaveBeenCalledTimes(1);
  });

  test("can be used again after it finishes", () => {
    const { charge, btn } = setup();
    charge.warpGo(btn); jest.advanceTimersByTime(DELAY_MS + 10);
    charge.warpGo(btn); jest.advanceTimersByTime(DELAY_MS + 10);
    expect(openLink).toHaveBeenCalledTimes(2);
  });

  test("leaving the tab mid-charge cancels the open", () => {
    const { charge, btn } = setup();
    charge.warpGo(btn);
    jest.advanceTimersByTime(DELAY_MS / 2);
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    jest.advanceTimersByTime(DELAY_MS);
    expect(openLink).not.toHaveBeenCalled();
    expect(btn.classList.contains("dk-charging")).toBe(false);
  });

  test("a mailto link copies the address first and toasts the result", async () => {
    const { charge, btn, host } = setup();
    btn.setAttribute("data-href", "mailto:me@example.com");
    charge.warpGo(btn);
    jest.advanceTimersByTime(DELAY_MS + 10);
    expect(copyText).toHaveBeenCalledWith("me@example.com");
    expect(openLink).toHaveBeenCalledWith("mailto:me@example.com");
    await Promise.resolve();
    expect(host.toast).toHaveBeenCalledWith("copied");
  });

  test("on tablets and phones (simple mode) there is no effect: the link opens on the tap, the label never changes", () => {
    const { charge, btn } = setup({ simple: true });
    charge.warpGo(btn);
    expect(openLink).toHaveBeenCalledTimes(1);
    expect(btn.querySelector(".dk-lbl").textContent).toBe("GitHub");
    expect(btn.classList.contains("dk-charging")).toBe(false);
  });

  test("under reduced motion the link opens straight away (nothing to wait for)", () => {
    const { charge, btn } = setup({ reduce: true });
    charge.warpGo(btn);
    expect(openLink).toHaveBeenCalledTimes(1);
  });
});
