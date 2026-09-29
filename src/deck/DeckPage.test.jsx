/**
 * DeckPage.test.jsx
 *
 * The deck's WebGL side cannot run in jsdom (and is only loaded on wide screens anyway), so these
 * tests exercise the plain-content mode that tablets and phones get: markup, navigation, language.
 * jsdom reports a 1024px-wide window, which is under the 1100px deck breakpoint.
 */
import { render, screen, within, act, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import i18n from "../i18n/index.js";
import { ThemeContext, THEMES } from "../context/ThemeContext";
import DeckPage from "./DeckPage";
import en from "../i18n/en.json";
import de from "../i18n/de.json";

// react-router-dom v7 ships only an "exports" map, which CRA's Jest 27 cannot resolve (see
// __tests__/test-utils.js), so the two router pieces the deck uses are stubbed.
jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
  useNavigate: () => jest.fn(),
}), { virtual: true });

beforeAll(() => {
  window.matchMedia = window.matchMedia || ((q) => ({
    matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
  }));
});

// the controller finishes starting up on a promise (fonts ready) that sets React state; let it settle
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const mount = async (theme = THEMES.dark) => {
  const view = render(<ThemeContext.Provider value={theme}><DeckPage toggleTheme={() => {}} /></ThemeContext.Provider>);
  await settle();
  return view;
};

describe("deck translations", () => {
  const paths = (o, prefix = "") => Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v) ? paths(v, `${prefix}${k}.`) : Array.isArray(v) && v.some((x) => x && typeof x === "object")
      ? v.flatMap((x, i) => paths(x, `${prefix}${k}.${i}.`)) : [`${prefix}${k}${Array.isArray(v) ? `[${v.length}]` : ""}`]);

  test("German has exactly the same keys (and list lengths) as English", () => {
    expect(paths(de.deck).sort()).toEqual(paths(en.deck).sort());
  });
  test("no deck string is empty in either language", () => {
    expect(JSON.stringify(de.deck)).not.toMatch(/""/);
    expect(JSON.stringify(en.deck)).not.toMatch(/""/);
  });
});

describe("DeckPage (plain-content mode)", () => {
  beforeEach(async () => {
    window.history.replaceState(null, "", "/");
    sessionStorage.clear();
    await act(async () => { await i18n.changeLanguage("en"); });
  });
  afterEach(() => { cleanup(); });

  test("renders all six scenes, with the first one active and no particle canvas", async () => {
    const { container } = await mount();
    const scenes = container.querySelectorAll(".dk-scene");
    expect(scenes).toHaveLength(6);
    expect(scenes[0]).toHaveClass("dk-on");
    expect(container.querySelector(".dk")).toHaveClass("dk-simple");
    expect(container.querySelector(".dk-gl")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Nishan Poojary");
  });

  test("the dock jumps to a scene and updates the URL hash", async () => {
    const { container } = await mount();
    fireEvent.click(screen.getByRole("button", { name: "Projects" }));
    expect(container.querySelector("#projects")).toHaveClass("dk-on");
    expect(screen.getByRole("button", { name: "Projects" })).toHaveAttribute("aria-current", "true");
    expect(window.location.hash).toBe("#projects");
  });

  test("number keys navigate, but not while typing in a field", async () => {
    const { container } = await mount();
    fireEvent.keyDown(window, { key: "3" });
    expect(container.querySelector("#experience")).toHaveClass("dk-on");
    const input = document.createElement("input");
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: "5" });
    expect(container.querySelector("#toolkit")).not.toHaveClass("dk-on");
    input.remove();
  });

  describe("Down / Up keys", () => {
    // jsdom has no layout: give the active scene's scroller a size so it looks taller than the screen
    const makeScrollable = (container, { scrollTop = 0 } = {}) => {
      const inner = container.querySelector(".dk-scene.dk-on .dk-scene-in");
      Object.defineProperty(inner, "scrollHeight", { value: 2000, configurable: true });
      Object.defineProperty(inner, "clientHeight", { value: 600, configurable: true });
      inner.scrollTop = scrollTop;
      inner.scrollTo = jest.fn();
      return inner;
    };

    test("Down moves to the next scene when the scene fits the screen", async () => {
      const { container } = await mount();
      fireEvent.keyDown(window, { key: "ArrowDown" });
      expect(container.querySelector("#about")).toHaveClass("dk-on");
    });

    test("Down scrolls a scene taller than the screen instead of doing nothing", async () => {
      const { container } = await mount();
      const inner = makeScrollable(container);
      fireEvent.keyDown(window, { key: "ArrowDown" });
      expect(inner.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 90 }));
      expect(container.querySelector("#hero")).toHaveClass("dk-on");        // still on the same scene
    });

    test("...and once it has scrolled to the end, Down moves on", async () => {
      const { container } = await mount();
      makeScrollable(container, { scrollTop: 1400 });                        // 1400 + 600 = the full 2000
      fireEvent.keyDown(window, { key: "ArrowDown" });
      expect(container.querySelector("#about")).toHaveClass("dk-on");
    });

    test("Up scrolls back up first, then goes to the previous scene", async () => {
      const { container } = await mount();
      fireEvent.click(screen.getByRole("button", { name: "About" }));
      const inner = makeScrollable(container, { scrollTop: 300 });
      fireEvent.keyDown(window, { key: "ArrowUp" });
      expect(inner.scrollTo.mock.calls[0][0].top).toBe(210);          // 300 - 90
      inner.scrollTop = 0;
      fireEvent.keyDown(window, { key: "ArrowUp" });
      expect(container.querySelector("#hero")).toHaveClass("dk-on");
    });

    test("quick repeated presses add up instead of restarting from the smooth scroll's current position", async () => {
      const { container } = await mount();
      const inner = makeScrollable(container);
      fireEvent.keyDown(window, { key: "ArrowDown" });
      fireEvent.keyDown(window, { key: "ArrowDown" });
      fireEvent.keyDown(window, { key: "ArrowDown" });
      expect(inner.scrollTo.mock.calls.map((c) => c[0].top)).toEqual([90, 180, 270]);
    });

    test("Space pages a tall scene by most of a screen", async () => {
      const { container } = await mount();
      const inner = makeScrollable(container);
      fireEvent.keyDown(window, { key: " " });
      expect(inner.scrollTo.mock.calls[0][0].top).toBeCloseTo(510, 0);   // 85% of the 600px screen
    });
  });

  test("keyboard shortcuts are ignored inside the chat panel", async () => {
    await mount();
    const panel = document.createElement("div");
    panel.setAttribute("data-no-deck", "panel");
    const field = document.createElement("textarea");
    panel.appendChild(field);
    document.body.appendChild(panel);
    fireEvent.keyDown(field, { key: "k" });
    expect(screen.queryByRole("dialog", { name: /index/i })).not.toHaveClass("dk-on");
    panel.remove();
  });

  test("the index palette opens with K and filters scenes", async () => {
    await mount();
    fireEvent.keyDown(window, { key: "k" });
    const dialog = screen.getByRole("dialog", { name: /index and commands/i });
    expect(dialog).toHaveClass("dk-on");
    fireEvent.change(screen.getByRole("textbox", { name: /search scenes/i }), { target: { value: "cont" } });
    expect(within(dialog).getByRole("button", { name: /Contact/ })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /Toolkit/ })).toBeNull();
  });

  test("switching to German re-renders the deck in German and keeps the scene", async () => {
    const { container } = await mount();
    fireEvent.click(screen.getByRole("button", { name: "Contact" }));
    await act(async () => { await i18n.changeLanguage("de"); });
    expect(screen.getByRole("button", { name: "Kontakt" })).toBeInTheDocument();
    expect(container.querySelector("#contact")).toHaveClass("dk-on");
    expect(container.querySelector(".dk")).toHaveAttribute("lang", "de");
  });

  test("simple mode has a solid header and a bottom tab bar instead of the floating dock", async () => {
    const { container } = await mount();
    expect(container.querySelector(".sb--solid")).toBeInTheDocument();
    expect(container.querySelector(".dk-tabbar")).toBeInTheDocument();
    expect(container.querySelector(".dk-dock")).toBeNull();
  });

  test("the footer links sit at the end of the Contact scene", async () => {
    const { container } = await mount();
    expect(container.querySelector("#contact .dk-footer .dk-footer-links")).toBeInTheDocument();
  });

  test("follows the site theme", async () => {
    const { container } = await mount(THEMES.light);
    expect(container.querySelector(".dk")).toHaveAttribute("data-theme", "light");
  });

  test("the warp buttons carry their link in data-href, never in href", async () => {
    const { container } = await mount();
    const btn = container.querySelector("[data-warp]");
    expect(btn.getAttribute("href")).toBeNull();
    expect(btn.getAttribute("data-href")).toMatch(/^https:\/\/github\.com\//);
  });
});
