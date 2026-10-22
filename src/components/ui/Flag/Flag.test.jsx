import { render } from "@testing-library/react";
import Flag from "./Flag";

describe("Flag", () => {
  test("German is three horizontal stripes, black then red then gold", () => {
    const { container } = render(<Flag lang="de" />);
    const fills = [...container.querySelectorAll("rect")].map((r) => r.getAttribute("fill"));
    expect(fills).toEqual(["#000", "#D00", "#FFCE00"]);
  });

  test("English is the Union Jack", () => {
    const { container } = render(<Flag lang="en" />);
    expect(container.querySelector("svg").getAttribute("viewBox")).toBe("0 0 60 30");
    expect(container.querySelector("clipPath")).not.toBeNull();
  });

  test("is decorative, so a screen reader hears the button's label and not the flag", () => {
    const { container } = render(<Flag lang="en" />);
    expect(container.querySelector("svg").getAttribute("aria-hidden")).toBe("true");
  });

  test("two flags on one page do not share a clip id", () => {
    const { container } = render(<><Flag lang="en" /><Flag lang="en" /></>);
    const ids = [...container.querySelectorAll("clipPath")].map((c) => c.id);
    expect(new Set(ids).size).toBe(2);
  });
});
