/** The guards of the project: the core stays apart from the screen, the docs list exactly the
 * tests that exist, every asset is credited, every string is used, and the app installs. */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, posix } from "node:path";
import { manifest } from "../manifest";
import { clipUrl } from "../src/ui/audio";
import { content } from "../src/ui/content";

const ROOT = join(import.meta.dirname, "..");

function files(dir: string, pattern: RegExp): string[] {
  return readdirSync(join(ROOT, dir)).flatMap((name) => {
    const path = posix.join(dir, name); // always "/", so the checks match on Windows too
    if (statSync(join(ROOT, path)).isDirectory()) return files(path, pattern);
    return pattern.test(name) ? [path] : [];
  });
}

const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

// S1_AC12: the core is apart from the screen

test("test_S1_AC12_the_core_never_imports_svelte_or_touches_the_browser", () => {
  const core = files("src/core", /\.ts$/);
  expect(core.length).toBeGreaterThan(5);
  for (const path of core) {
    const source = read(path);
    expect(source, path).not.toMatch(/from "svelte|from "\.\.\/ui|\.svelte"/);
    expect(source, path).not.toMatch(/\b(document|window|localStorage|navigator|Audio)\b[.(]/);
  }
});

// S1_AC14: docs, tests and credits agree

const TEST_NAME = /\b(?:test|it)\(\s*["'`](test_S(\d+)_AC(\d+)_\w+)["'`]/g;
const testFiles = [...files("tests", /\.test\.ts$/), ...files("tests/e2e", /\.spec\.ts$/)];

function testsInSources(): Map<string, string> {
  const found = new Map<string, string>();
  for (const path of testFiles) {
    for (const match of read(path).matchAll(TEST_NAME)) {
      found.set(`${path.replaceAll("\\", "/")}::${match[1]}`, match[1] as string);
    }
  }
  return found;
}

function documented(): Map<string, Set<string>> {
  const byCriterion = new Map<string, Set<string>>();
  for (const doc of files("docs", /^S\d+_.*\.md$/)) {
    for (const section of read(doc).split(/^### /m).slice(1)) {
      const id = section.match(/^(S\d+_AC\d+):/)?.[1];
      if (!id) continue;
      const tests = [...section.matchAll(/^- `([^`]+::test_\w+)`/gm)].map((m) => m[1] as string);
      byCriterion.set(id, new Set(tests));
    }
  }
  return byCriterion;
}

test("test_S1_AC14_every_slice_has_a_doc_with_its_acceptance_criteria", () => {
  expect(files("docs", /^S\d+_.*\.md$/)).toEqual(["docs/S1_mvp.md"]);
  expect([...documented().keys()]).toEqual(Array.from({ length: 16 }, (_, i) => `S1_AC${i + 1}`));
});

test("test_S1_AC14_every_criterion_has_tests_and_the_doc_lists_exactly_those_that_exist", () => {
  const sources = testsInSources();
  const docs = documented();
  for (const [id, tests] of docs) expect(tests.size, `${id} has no tests`).toBeGreaterThan(0);
  const listed = [...docs.values()].flatMap((tests) => [...tests]).sort();
  expect(listed).toEqual([...sources.keys()].sort());
  for (const [id, tests] of docs) {
    for (const test of tests) expect(test, `${test} is listed under ${id}`).toContain(`${id}_`);
  }
});

test("test_S1_AC14_every_test_names_its_criterion", () => {
  for (const path of testFiles) {
    const all = [...read(path).matchAll(/\b(?:test|it)\(\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);
    for (const name of all) expect(name).toMatch(/^test_S\d+_AC\d+_[a-z0-9_]+$/);
  }
});

const LICENCES = ["SIL Open Font License 1.1", "Public domain", "MIT", "CC0"];

test("test_S1_AC14_every_asset_is_credited_with_an_allowed_licence", () => {
  const credits = read("CREDITS.md");
  const sections = credits.split(/^## /m).slice(1);
  const assets = [...files("src/assets", /./), ...files("public", /./)].map((p) =>
    posix.relative("src/assets", p).startsWith("..") ? p : posix.relative("src/assets", p),
  );
  for (const asset of assets) {
    const section = sections.find((s) =>
      [...s.matchAll(/^- `([^`]+)`/gm)].some((m) => {
        const pattern = new RegExp(
          `^${(m[1] as string).replace(".", "\\.").replace("*", "[^/]+")}$`,
        );
        return pattern.test(asset);
      }),
    );
    expect(section, `${asset} is not in CREDITS.md`).toBeDefined();
    const licence = section?.match(/^Licence: (.+)$/m)?.[1] ?? "";
    expect(
      LICENCES.some((allowed) => licence.startsWith(allowed)),
      licence,
    ).toBe(true);
  }
});

// S1_AC13: strings and prompts are content, all of them used

test("test_S1_AC13_every_ui_string_used_exists_and_every_string_is_used", () => {
  const ui = files("src/ui", /\.(svelte|ts)$/)
    .map(read)
    .join("\n");
  const used = new Set([...ui.matchAll(/\bt\(\s*"(\w+)"/g)].map((m) => m[1] as string));
  for (const key of used) expect(content.strings, key).toHaveProperty(key);
  // keys built from a game or setting: game_<id>, area_<area>, text_<size>
  const dynamic = new Set([
    ...content.games.flatMap((game) => [`game_${game.id}`, `area_${game.area}`]),
    "text_normal",
    "text_large",
    "text_larger",
  ]);
  for (const key of Object.keys(content.strings)) {
    expect(used.has(key) || dynamic.has(key), `${key} is never used`).toBe(true);
  }
});

// S1_AC8: every prompt is said by a clip

test("test_S1_AC8_every_prompt_has_its_clip", () => {
  for (const id of Object.keys(content.prompts)) expect(clipUrl("en", id), id).toBeDefined();
  for (const game of content.games) expect(content.prompts).toHaveProperty(`${game.id}_intro`);
});

// S1_AC16: an installable app that works offline

test("test_S1_AC16_the_manifest_makes_it_installable_with_icons_of_192_and_512", () => {
  expect(manifest).toMatchObject({ name: "MindKeep", display: "standalone", start_url: "./" });
  const sizes = (manifest.icons ?? []).map((icon) => icon.sizes);
  expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  for (const icon of manifest.icons ?? []) {
    expect(statSync(join(ROOT, "public", icon.src)).size).toBeGreaterThan(1000);
  }
});

test("test_S1_AC16_the_service_worker_caches_everything_the_app_needs_offline", () => {
  const config = read("vite.config.ts");
  expect(config).toMatch(/VitePWA\(/);
  for (const kind of ["js", "css", "html", "woff2", "wav", "png", "svg"]) {
    expect(config).toMatch(new RegExp(`globPatterns: \\["\\*\\*/\\*\\.\\{[^}]*\\b${kind}\\b`));
  }
  expect(read("src/main.ts")).toMatch(/registerSW\(/);
});
