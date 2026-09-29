/**
 * scenes.test.jsx — each scene renders its content from the same data and translations the rest of
 * the site uses, in both languages, and exposes the hooks the controller relies on.
 */
import { createRef } from "react";
import { render, screen, within, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import i18n from "../../i18n/index.js";
import siteConfig from "../../config/site";
import projects from "../../data/projects.json";
import experience from "../../data/experience.json";
import skills from "../../data/skills.json";
import Hero from "./Hero";
import About from "./About";
import Experience from "./Experience";
import Projects from "./Projects";
import Toolkit from "./Toolkit";
import Contact from "./Contact";

// react-router-dom v7 only ships an "exports" map, which CRA's Jest 27 cannot resolve (see __tests__/test-utils.js)
jest.mock("react-router-dom", () => ({ Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a> }), { virtual: true });

const t = (...a) => i18n.t(...a);

beforeAll(() => {
  window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
});
beforeEach(async () => { await act(async () => { await i18n.changeLanguage("en"); }); });

describe("Hero", () => {
  test("has the name as the h1, the role line, the stats and a warp button that carries its URL in data-href", () => {
    const { container } = render(<Hero t={t} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(`${siteConfig.profile.firstName} ${siteConfig.profile.lastName}`);
    expect(screen.getByText(new RegExp(t("hero.role").slice(0, 12)))).toBeInTheDocument();
    expect(screen.getByText(siteConfig.stats.yearsExperience)).toBeInTheDocument();
    const warp = container.querySelector("[data-warp]");
    expect(warp).toHaveAttribute("data-href", siteConfig.contact.githubUrl);
    expect(warp).not.toHaveAttribute("href");
  });
  test("the Explore button points at the About scene through data-go", () => {
    const { container } = render(<Hero t={t} />);
    expect(container.querySelector('[data-go="1"]')).toBeInTheDocument();
  });
  test("is the scene the controller shows first (section#hero.dk-scene)", () => {
    const { container } = render(<Hero t={t} />);
    expect(container.querySelector("section#hero.dk-scene")).toBeInTheDocument();
  });
});

describe("About", () => {
  test("shows the bio, one source card per translated card, and the highlighted skills", () => {
    const { container } = render(<About t={t} />);
    expect(screen.getByRole("heading", { level: 2, name: t("deck.about.title") })).toBeInTheDocument();
    expect(screen.getByText(t("about.bio1"))).toBeInTheDocument();
    expect(container.querySelectorAll(".dk-src")).toHaveLength(t("about.cards", { returnObjects: true }).length);
    siteConfig.about.highlightSkills.forEach((s) => expect(screen.getByText(s)).toBeInTheDocument());
  });
});

describe("Experience", () => {
  const deck = { selectRole: jest.fn(), hoverRole: jest.fn(), focusRole: jest.fn() };
  test("one tab per role, oldest first, with only the selected panel shown", () => {
    const { container } = render(<Experience t={t} role={experience.length - 1} deck={() => deck} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(experience.length);
    expect(tabs[tabs.length - 1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
    expect(container.querySelectorAll(".dk-role.dk-on")).toHaveLength(1);
  });
  test("clicking a tab hands the choice to the controller", () => {
    render(<Experience t={t} role={0} deck={() => deck} />);
    fireEvent.click(screen.getAllByRole("tab")[1]);
    expect(deck.selectRole).toHaveBeenCalledWith(1);
  });
  test("domain names are translated", async () => {
    await act(async () => { await i18n.changeLanguage("de"); });
    render(<Experience t={t} role={0} deck={() => deck} />);
    expect(screen.getByRole("tab", { name: /Beratung/ })).toBeInTheDocument();
  });
});

describe("Projects", () => {
  test("a card per project, each linking to its repository and running a demo", () => {
    const { container } = render(<Projects t={t} carRef={createRef()} />);
    const cards = container.querySelectorAll(".dk-card");
    expect(cards).toHaveLength(projects.length);
    cards.forEach((c) => { expect(c.getAttribute("href")).toMatch(/^https:\/\/github\.com\//); expect(c.querySelector(".dk-viz svg")).toBeInTheDocument(); });
  });
  test("demo captions are translated", async () => {
    await act(async () => { await i18n.changeLanguage("de"); });
    render(<Projects t={t} carRef={createRef()} />);
    expect(screen.getByText("belegte Antwort")).toBeInTheDocument();
  });
  test("the carousel starts at the first project with 'previous' disabled", () => {
    render(<Projects t={t} carRef={createRef()} />);
    expect(screen.getByRole("button", { name: t("deck.projects.prev") })).toBeDisabled();
    expect(screen.getByText(`01 / ${String(projects.length).padStart(2, "0")}`)).toBeInTheDocument();
  });
});

describe("Toolkit", () => {
  test("six icon tiles, the full tool list, and certifications grouped by issuer", () => {
    const { container } = render(<Toolkit t={t} />);
    expect(container.querySelectorAll(".dk-tile")).toHaveLength(6);
    const issuers = new Set(skills.certifications.map((c) => c.org));
    expect(container.querySelectorAll(".dk-issuer")).toHaveLength(issuers.size);
    skills.categories.forEach((cat) => cat.skills.forEach((s) => expect(within(container).getAllByText(s.name).length).toBeGreaterThan(0)));
  });
  test("certificate counts are pluralised", () => {
    const { container } = render(<Toolkit t={t} />);
    expect(container.textContent).toMatch(/1 certificate(?!s)/);     // Google: one
    expect(container.textContent).toMatch(/3 certificates/);          // Coursera: three
  });
});

describe("Contact", () => {
  test("shows the address and three warp buttons (email, GitHub, LinkedIn) with no href", () => {
    const { container } = render(<Contact t={t} />);
    expect(screen.getByText(siteConfig.contact.email)).toBeInTheDocument();
    const warps = container.querySelectorAll("[data-warp]");
    expect(Array.from(warps).map((w) => w.getAttribute("data-href"))).toEqual([`mailto:${siteConfig.contact.email}`, siteConfig.contact.githubUrl, siteConfig.contact.linkedinUrl]);
    warps.forEach((w) => expect(w).not.toHaveAttribute("href"));
  });
  test("Copy puts the address on the clipboard and says so", async () => {
    const writeText = jest.fn().mockResolvedValue();
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Contact t={t} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: t("deck.contact.copy") })); });
    expect(writeText).toHaveBeenCalledWith(siteConfig.contact.email);
    expect(screen.getByRole("button", { name: t("deck.contact.copied") })).toBeInTheDocument();
  });
});
