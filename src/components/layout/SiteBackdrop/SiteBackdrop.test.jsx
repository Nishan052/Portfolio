import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import SiteBackdrop from "./SiteBackdrop";

describe("SiteBackdrop", () => {
  test("is a decorative layer hidden from assistive technology", () => {
    const { container } = render(<SiteBackdrop />);
    expect(container.firstChild).toHaveClass("site-backdrop");
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
