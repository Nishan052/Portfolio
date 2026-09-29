/**
 * tokens.test.js — the design tokens are the single source of the palette and typefaces, so the two
 * themes must define the same names, the older semantic names must resolve, and nothing else in the
 * source may bring back the retired fonts.
 */
import fs from "fs";
import path from "path";

const css = fs.readFileSync(path.join(__dirname, "tokens.css"), "utf8");
const block = (selector) => {
  const m = css.match(new RegExp(`${selector.replace(/[[\]"]/g, "\\$&")}\\s*\\{([^}]*)\\}`));
  return m ? m[1] : "";
};
const names = (body) => new Set((body.match(/--[a-z0-9-]+(?=\s*:)/g) || []));

describe("design tokens", () => {
  const dark = names(block(':root,\n[data-theme="dark"]')), light = names(block('[data-theme="light"]'));

  test("the light theme redefines only names the dark theme defines, and everything colour-critical", () => {
    expect(dark.size).toBeGreaterThan(20);
    light.forEach((n) => expect(dark.has(n)).toBe(true));
    ["--bg", "--text", "--mute", "--line", "--brand", "--support", "--spare", "--panel", "--ink-on-brand"].forEach((n) => expect(light.has(n)).toBe(true));
  });

  test("the older semantic names are aliases of the new vocabulary", () => {
    ["--surface", "--text-muted", "--accent", "--accent2", "--border", "--nav-bg", "--section-overlay"].forEach((n) => expect(css).toContain(`${n}:`));
    expect(css).toMatch(/--accent:\s*var\(--brand\)/);
    expect(css).toMatch(/--border:\s*var\(--line\)/);
  });

  test("defines the three typefaces", () => {
    ["--font-display", "--font-body", "--font-mono"].forEach((n) => expect(css).toContain(`${n}:`));
  });
});

describe("retired typefaces", () => {
  const ROOT = path.join(__dirname, "..");
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "data" || e.name === "node_modules" ? [] : walk(p);
    return /\.(css|jsx?|)$/.test(e.name) && !/\.test\./.test(e.name) ? [p] : [];
  });

  test("no stylesheet or component names Syne, DM Mono or Outfit any more", () => {
    const offenders = walk(ROOT).filter((f) => /['"]?(Syne|DM Mono|Outfit)['"]?\s*[,;)]/.test(fs.readFileSync(f, "utf8")));
    expect(offenders.map((f) => path.relative(ROOT, f))).toEqual([]);
  });
});
