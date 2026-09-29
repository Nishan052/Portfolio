import openLink from "./openLink";

describe("openLink", () => {
  let clicked;
  beforeEach(() => {
    clicked = [];
    jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function click() {
      clicked.push({ href: this.getAttribute("href"), target: this.target, rel: this.rel });
    });
  });
  afterEach(() => jest.restoreAllMocks());

  test("web links open in a new tab without giving the page an opener", () => {
    openLink("https://github.com/Nishan052");
    expect(clicked).toEqual([{ href: "https://github.com/Nishan052", target: "_blank", rel: "noopener noreferrer" }]);
  });

  test("mailto links stay in this tab (they hand off to the mail app)", () => {
    openLink("mailto:a@b.co");
    expect(clicked[0].target).toBe("");
  });

  test("leaves no element behind", () => {
    openLink("https://example.com");
    expect(document.querySelector('a[href="https://example.com"]')).toBeNull();
  });
});
