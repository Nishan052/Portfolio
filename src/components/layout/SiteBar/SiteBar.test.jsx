/**
 * SiteBar.test.jsx — the slim top bar shared by the home deck and the blog.
 */
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import i18n from "../../../i18n/index.js";
import SiteBar from "./SiteBar";

// react-router-dom v7 only ships an "exports" map, which CRA's Jest 27 cannot resolve (see __tests__/test-utils.js)
jest.mock("react-router-dom", () => ({ Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a> }), { virtual: true });

const renderBar = (props = {}) => render(<SiteBar isDark toggleTheme={() => {}} {...props} />);

describe("SiteBar", () => {
  beforeEach(async () => { await act(async () => { await i18n.changeLanguage("en"); }); });

  test("shows the wordmark from site config, linking to the given target", () => {
    renderBar({ brand: { to: "/" } });
    const brand = screen.getByRole("link", { name: /first scene/i });
    expect(brand).toHaveAttribute("href", "/");
    expect(brand).toHaveTextContent("nishanpoojary.com");
  });

  test("accepts a plain anchor with extra attributes (the deck uses data-go)", () => {
    renderBar({ brand: { href: "#hero", "data-go": 0 } });
    expect(screen.getByRole("link", { name: /first scene/i })).toHaveAttribute("data-go", "0");
  });

  test("renders page-specific controls passed as children", () => {
    renderBar({ children: <button type="button">Index</button> });
    expect(screen.getByRole("button", { name: "Index" })).toBeInTheDocument();
  });

  test("the theme button announces the theme it will switch to and calls back", () => {
    const toggle = jest.fn();
    const { rerender } = render(<SiteBar isDark toggleTheme={toggle} />);
    fireEvent.click(screen.getByRole("button", { name: /light/i }));
    expect(toggle).toHaveBeenCalledTimes(1);
    rerender(<SiteBar isDark={false} toggleTheme={toggle} />);
    expect(screen.getByRole("button", { name: /dark/i })).toBeInTheDocument();
  });

  test("the language switch changes the app language and reports the current one", async () => {
    renderBar();
    expect(screen.getByRole("button", { name: /^EN/ })).toHaveAttribute("aria-pressed", "true");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /^DE/ })); });
    expect(i18n.language).toBe("de");
  });

  test("the language switch can be hidden (English-only pages)", () => {
    renderBar({ showLang: false });
    expect(screen.queryByRole("group", { name: /language/i })).toBeNull();
  });

  test("variant sets the bar style", () => {
    const { container, rerender } = renderBar({ variant: "floating" });
    expect(container.firstChild).toHaveClass("sb--floating");
    rerender(<SiteBar isDark toggleTheme={() => {}} variant="solid" />);
    expect(container.firstChild).toHaveClass("sb--solid");
  });
});
