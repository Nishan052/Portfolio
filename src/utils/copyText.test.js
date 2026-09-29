import copyText from "./copyText";

describe("copyText", () => {
  const original = navigator.clipboard;
  afterEach(() => { Object.defineProperty(navigator, "clipboard", { value: original, configurable: true }); });

  test("resolves true when the clipboard accepts the text", async () => {
    const writeText = jest.fn().mockResolvedValue();
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await expect(copyText("hello")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  test("resolves false when the browser refuses", async () => {
    Object.defineProperty(navigator, "clipboard", { value: { writeText: jest.fn().mockRejectedValue(new Error("denied")) }, configurable: true });
    await expect(copyText("hello")).resolves.toBe(false);
  });

  test("resolves false when there is no clipboard API", async () => {
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    await expect(copyText("hello")).resolves.toBe(false);
  });
});
