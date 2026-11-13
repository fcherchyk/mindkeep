/** S1_AC10: the theme keeps a contrast of at least 7:1 (WCAG AAA) and big tap targets. */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(import.meta.dirname, "../src/ui/theme.css"), "utf8");

/** The colour tokens of a rule (`:root { … }` or the high-contrast one). */
function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const block = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1], m[2]]),
  );
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const PAIRS: [string, string][] = [
  ["text", "bg"],
  ["text", "surface"],
  ["muted", "bg"],
  ["muted", "surface"],
  ["on-primary", "primary"],
  ["right", "surface"],
  ["right", "bg"],
  ["wrong", "surface"],
  ["wrong", "bg"],
  ["text", "selected"],
];

test("test_S1_AC10_text_and_controls_keep_a_contrast_of_at_least_7_to_1", () => {
  const normal = tokens(":root");
  const high = { ...normal, ...tokens(':root[data-contrast="high"]') };
  for (const theme of [normal, high]) {
    for (const [fore, back] of PAIRS) {
      const ratio = contrast(theme[fore] as string, theme[back] as string);
      expect(ratio, `${fore} on ${back}`).toBeGreaterThanOrEqual(7);
    }
  }
});

test("test_S1_AC10_tap_targets_are_at_least_64_px_and_16_px_apart", () => {
  expect(css).toMatch(/--target: max\(4rem, 64px\)/);
  expect(css).toMatch(/--gap: max\(1rem, 16px\)/);
  expect(css).toMatch(/button,?[\s\S]*?min-height: var\(--target\);\s*min-width: var\(--target\)/);
  expect(css).toMatch(/touch-action: manipulation/); // no double-tap zoom delay
});

test("test_S1_AC11_the_text_size_setting_scales_every_rem", () => {
  const sizes = [...css.matchAll(/font-size: ([\d.]+)%/g)].map((m) => Number(m[1]));
  expect(sizes).toEqual([112.5, 131.25, 150]);
  expect(css).not.toMatch(/font-size: \d+px/);
});
