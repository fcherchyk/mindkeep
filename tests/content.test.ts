/** S1_AC13: the content lives in JSON per locale and is checked when it loads. */

import { ContentError, parseContent, say } from "../src/core/content";
import { content, raw } from "../src/ui/content";

test("test_S1_AC13_the_english_content_loads", () => {
  expect(content.locale).toBe("en");
  expect(content.games.map((game) => game.id)).toEqual(["shopping", "odd"]);
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
