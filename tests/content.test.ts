/** S1_AC13: the content lives in JSON per locale and is checked when it loads. */

import { ContentError, maxLevel, parseContent, say } from "../src/core/content";
import { content, raw } from "../src/ui/content";

test("test_S1_AC13_the_english_content_loads", () => {
  expect(content.locale).toBe("en");
  expect(content.games.map((game) => game.id)).toEqual([
    "shopping",
    "odd",
    "pairs",
    "sequences",
    "trail",
    "steps",
  ]);
  expect(content.items.length).toBeGreaterThanOrEqual(12);
  expect(content.shoppingLevels.length).toBeGreaterThan(1);
  expect(content.oddLevels.length).toBeGreaterThan(1);
});

test("test_S1_AC13_content_that_breaks_a_rule_is_refused_with_its_place", () => {
  const broken = [
    { ...raw, games: { rounds: 3, games: [{ id: "chess", area: "logic" }] } },
    { ...raw, games: { rounds: 0, games: raw.games.games } },
    { ...raw, items: { items: [...raw.items.items, raw.items.items[0]] } },
    { ...raw, shoppingLevels: { levels: [{ items: 4, choices: 4, pauseMs: 0 }] } },
    { ...raw, shoppingLevels: { levels: [{ items: 3, choices: 99, pauseMs: 0 }] } },
    { ...raw, oddLevels: { levels: [{ size: 5, difference: "shape" }] } },
    { ...raw, oddLevels: { levels: [{ size: 3, difference: "colour" }] } },
    { ...raw, strings: { strings: { start: "" } } },
    { ...raw, prompts: { prompts: [] } },
    { ...raw, items: [] },
  ];
  for (const data of broken) expect(() => parseContent(data)).toThrow(ContentError);
});

test("test_S1_AC13_strings_fill_their_placeholders_and_a_missing_key_shows_itself", () => {
  expect(say(content, "greeting", { name: "Rosa" })).toBe("Hello, Rosa");
  expect(say(content, "round", { current: 2 })).toBe("Round 2 of {total}");
  expect(say(content, "no_such_key")).toBe("no_such_key");
});

// S2_AC5: the levels of Pairs and Sequences are content, checked when they load

test("test_S2_AC5_pairs_and_sequences_levels_load_and_get_harder", () => {
  expect(content.perSession).toBe(3);
  expect(maxLevel(content, "pairs")).toBe(content.pairsLevels.length);
  expect(maxLevel(content, "sequences")).toBe(content.sequenceLevels.length);
  const pairs = content.pairsLevels;
  expect(pairs[0]).toEqual({ pairs: 3, misses: 2 });
  expect(pairs.at(-1)?.pairs).toBe(8);
  const sequences = content.sequenceLevels;
  expect(sequences[0]).toEqual({ size: 3, length: 2, stepMs: 1000 });
  for (let i = 1; i < sequences.length; i++) {
    const [before, now] = [sequences[i - 1], sequences[i]];
    const harder =
      (now?.length ?? 0) > (before?.length ?? 0) ||
      (now?.stepMs ?? 0) < (before?.stepMs ?? 0) ||
      (now?.size ?? 0) > (before?.size ?? 0);
    expect(harder, `sequence level ${i + 1}`).toBe(true);
  }
});

test("test_S2_AC5_pairs_and_sequences_levels_that_break_a_rule_are_refused", () => {
  const broken = [
    { ...raw, games: { ...raw.games, perSession: 7 } },
    { ...raw, games: { ...raw.games, perSession: 0 } },
    { ...raw, games: { ...raw.games, games: [...raw.games.games, raw.games.games[0]] } },
    { ...raw, pairsLevels: { levels: [{ pairs: 9, misses: 2 }] } },
    { ...raw, pairsLevels: { levels: [{ pairs: 1, misses: 2 }] } },
    { ...raw, pairsLevels: { levels: [{ pairs: 3, misses: -1 }] } },
    { ...raw, sequenceLevels: { levels: [{ size: 5, length: 3, stepMs: 800 }] } },
    { ...raw, sequenceLevels: { levels: [{ size: 3, length: 10, stepMs: 800 }] } },
    { ...raw, sequenceLevels: { levels: [{ size: 3, length: 3, stepMs: 100 }] } },
    { ...raw, sequenceLevels: { levels: [] } },
  ];
  for (const data of broken) expect(() => parseContent(data)).toThrow(ContentError);
});

// S3_AC5: Trail levels, Steps levels and tasks are content, checked when they load

test("test_S3_AC5_trail_and_steps_levels_and_tasks_load_and_get_harder", () => {
  expect(maxLevel(content, "trail")).toBe(content.trailLevels.length);
  expect(maxLevel(content, "steps")).toBe(content.stepsLevels.length);
  expect(content.tasks.length).toBeGreaterThanOrEqual(8);
  for (const task of content.tasks) expect(task.steps).toHaveLength(6);
  const steps = content.stepsLevels;
  expect(steps[0]).toEqual({ steps: 3, extra: false });
  expect(steps.at(-1)).toEqual({ steps: 6, extra: true });
  for (let i = 1; i < steps.length; i++) {
    const [before, now] = [steps[i - 1], steps[i]];
    const harder =
      (now?.steps ?? 0) > (before?.steps ?? 0) || (now?.extra === true && before?.extra === false);
    expect(harder, `steps level ${i + 1}`).toBe(true);
  }
  expect(content.strings.area_planning).toBe("Planning");
});

test("test_S3_AC5_trail_and_steps_content_that_breaks_a_rule_is_refused", () => {
  const tea = raw.tasks.tasks[0];
  const broken = [
    { ...raw, games: { ...raw.games, perSession: 2 } }, // fewer than the 3 areas
    { ...raw, trailLevels: { levels: [{ count: 3, letters: false, misses: 1 }] } },
    { ...raw, trailLevels: { levels: [{ count: 17, letters: true, misses: 1 }] } },
    { ...raw, stepsLevels: { levels: [{ steps: 2, extra: false }] } },
    { ...raw, stepsLevels: { levels: [{ steps: 7, extra: false }] } },
    { ...raw, tasks: { tasks: [tea] } },
    { ...raw, tasks: { tasks: [tea, { ...tea, id: "short", steps: ["One", "Two"] }] } },
    { ...raw, tasks: { tasks: [tea, { ...tea, id: "twice", steps: Array(6).fill("Same") }] } },
  ];
  for (const data of broken) expect(() => parseContent(data)).toThrow(ContentError);
});
