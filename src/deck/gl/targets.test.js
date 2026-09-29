/**
 * fitName decides where the particle name sits. The rule: it never leaves the free band between the
 * hero's role line and its description block, at any viewport shape.
 */
import { fitName } from "./targets";

const NAME_TOP_EM = 0.14, NAME_HEIGHT_EM = 1.79;
const visibleTop = ({ fs, yTop }) => yTop + NAME_TOP_EM * fs;
const visibleBottom = ({ fs, yTop }) => yTop + (NAME_TOP_EM + NAME_HEIGHT_EM) * fs;

describe("fitName", () => {
  test("stays inside the free band for every viewport from small laptop to ultrawide", () => {
    for (let W = 1100; W <= 3440; W += 170) {
      for (let VH = 500; VH <= 1600; VH += 100) {
        // roughly what the hero lays out: role line near the top, description block hugging the bottom
        const box = { top: 130, bottom: VH - 40 - Math.min(300, VH * 0.3) };
        if (box.bottom - box.top < 120) continue;              // too short to hold anything legible
        const fit = fitName(W, VH, box);
        expect(visibleTop(fit)).toBeGreaterThanOrEqual(box.top - 0.5);
        expect(visibleBottom(fit)).toBeLessThanOrEqual(box.bottom + 0.5);
      }
    }
  });

  test("the case from the report: a wide, short window no longer runs into the description", () => {
    const W = 1920, VH = 990, box = { top: 130, bottom: 690 };   // description starts at y=690
    const fit = fitName(W, VH, box);
    expect(visibleBottom(fit)).toBeLessThan(box.bottom);
  });

  test("keeps the original proportions when there is plenty of room", () => {
    const W = 1440, VH = 1200, fit = fitName(W, VH, { top: 100, bottom: 1100 });
    expect(fit.fs).toBeCloseTo(Math.min(W * 0.12, VH * 0.235), 5);
  });

  test("falls back to the proportional layout when nothing could be measured", () => {
    const fit = fitName(1440, 900, null);
    expect(fit.yTop).toBeCloseTo(900 * 0.2, 5);
  });

  test("never shrinks below a legible size", () => {
    expect(fitName(1400, 400, { top: 100, bottom: 200 }).fs).toBeGreaterThanOrEqual(36);
  });
});
