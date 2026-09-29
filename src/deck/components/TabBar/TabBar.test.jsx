import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import i18n from "../../../i18n/index.js";
import TabBar from "./TabBar";

const t = (...a) => i18n.t(...a);

describe("TabBar", () => {
  beforeEach(async () => { await i18n.changeLanguage("en"); });

  test("one tab per scene, each carrying data-go for the controller", () => {
    const { container } = render(<TabBar t={t} cur={0} />);
    expect(screen.getAllByRole("button")).toHaveLength(6);
    expect(Array.from(container.querySelectorAll("[data-go]")).map((b) => b.getAttribute("data-go"))).toEqual(["0", "1", "2", "3", "4", "5"]);
  });

  test("full scene names are the accessible names; the visible labels are the short ones", () => {
    render(<TabBar t={t} cur={0} />);
    const work = screen.getByRole("button", { name: "Experience" });
    expect(work).toHaveTextContent("Work");
  });

  test("marks only the current scene", () => {
    render(<TabBar t={t} cur={3} />);
    expect(screen.getByRole("button", { name: "Projects" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "About" })).not.toHaveAttribute("aria-current");
  });

  test("labels are translated", async () => {
    await i18n.changeLanguage("de");
    render(<TabBar t={t} cur={0} />);
    expect(screen.getByRole("button", { name: "Kontakt" })).toHaveTextContent("Kontakt");
    expect(screen.getByRole("button", { name: "Erfahrung" })).toHaveTextContent("Karriere");
  });
});
