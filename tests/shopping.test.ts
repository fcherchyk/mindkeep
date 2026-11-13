/** S1_AC4: Shopping List rounds. */

import type { ShoppingLevel } from "../src/core/content";
import { seeded } from "../src/core/random";
import { checkShopping, makeShoppingRound } from "../src/core/shopping";
import { content } from "../src/ui/content";

const items = content.items;
const group = new Map(items.map((item) => [item.id, item.group]));

test("test_S1_AC4_the_list_is_among_the_choices_with_distractors_that_are_not_on_it", () => {
  for (const [i, level] of content.shoppingLevels.entries()) {
    const round = makeShoppingRound(level, items, seeded(i));
    expect(round.list).toHaveLength(level.items);
    expect(round.choices).toHaveLength(level.choices);
    expect(new Set(round.choices).size).toBe(level.choices);
    expect(round.list.every((id) => round.choices.includes(id))).toBe(true);
    expect(round.pauseMs).toBe(level.pauseMs);
  }
});

test("test_S1_AC4_similar_levels_take_distractors_from_the_groups_of_the_list", () => {
  const level: ShoppingLevel = { items: 3, choices: 6, pauseMs: 0, similar: true };
  for (let seed = 0; seed < 20; seed++) {
    const round = makeShoppingRound(level, items, seeded(seed));
    const groups = new Set(round.list.map((id) => group.get(id)));
    const others = round.choices.filter((id) => !round.list.includes(id));
    const alikeLeft = items.filter(
      (item) => groups.has(item.group) && !round.list.includes(item.id),
    ).length;
    const alike = others.filter((id) => groups.has(group.get(id))).length;
    expect(alike).toBe(Math.min(alikeLeft, others.length));
  }
});

test("test_S1_AC4_a_round_is_right_only_with_every_item_and_nothing_else", () => {
  const round = makeShoppingRound(content.shoppingLevels[0] as ShoppingLevel, items, seeded(3));
  const [first, ...rest] = round.list;
  const extra = round.choices.find((id) => !round.list.includes(id)) as string;

  expect(checkShopping(round, round.list).right).toBe(true);
  expect(checkShopping(round, rest)).toMatchObject({ right: false, missed: [first] });
  expect(checkShopping(round, [...round.list, extra])).toMatchObject({
    right: false,
    wrong: [extra],
  });
});
