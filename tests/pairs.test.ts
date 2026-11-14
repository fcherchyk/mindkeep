/** S2_AC1: the rules of Pairs. */

import {
  checkPairs,
  flip,
  isDone,
  makePairsRound,
  mismatched,
  type PairsRound,
  startPairs,
  turnBack,
} from "../src/core/pairs";
import { seeded } from "../src/core/random";
import { content } from "../src/ui/content";

const round: PairsRound = { cards: ["key", "cup", "key", "cup"], misses: 1 };

test("test_S2_AC1_a_deck_holds_each_picture_twice_shuffled", () => {
  for (const level of content.pairsLevels) {
    const made = makePairsRound(level, content.items, seeded(3));
    expect(made.cards).toHaveLength(level.pairs * 2);
    for (const id of new Set(made.cards)) {
      expect(made.cards.filter((card) => card === id)).toHaveLength(2);
    }
    expect(made.misses).toBe(level.misses);
  }
  const a = makePairsRound({ pairs: 8, misses: 4 }, content.items, seeded(1)).cards;
  const b = makePairsRound({ pairs: 8, misses: 4 }, content.items, seeded(2)).cards;
  expect(a).not.toEqual(b);
});

test("test_S2_AC1_a_matching_pair_stays_up_and_a_wrong_pair_counts_and_turns_back", () => {
  let state = startPairs(round);
  state = flip(round, state, 0);
  state = flip(round, state, 1); // key and cup: no match
  expect(mismatched(state)).toBe(true);
  expect(state.mismatches).toBe(1);
  expect(flip(round, state, 2)).toBe(state); // a third card waits until these turn back
  state = turnBack(state);
  expect(state.up).toEqual([]);
  expect(turnBack(state)).toBe(state);

  state = flip(round, state, 0);
  expect(flip(round, state, 0)).toBe(state); // the same card twice changes nothing
  state = flip(round, state, 2); // key and key
  expect(state.matched).toEqual([true, false, true, false]);
  expect(flip(round, state, 0)).toBe(state); // a matched card stays as it is
  expect(flip(round, state, 9)).toBe(state);
  expect(isDone(state)).toBe(false);
  state = flip(round, flip(round, state, 1), 3);
  expect(isDone(state)).toBe(true);
  expect(checkPairs(round, state)).toEqual({ right: true, mismatches: 1 });
});

test("test_S2_AC1_a_round_is_right_with_at_most_the_levels_misses", () => {
  let state = startPairs(round);
  for (let i = 0; i < 2; i++) state = turnBack(flip(round, flip(round, state, 0), 1));
  state = flip(round, flip(round, state, 0), 2);
  state = flip(round, flip(round, state, 1), 3);
  expect(checkPairs(round, state)).toEqual({ right: false, mismatches: 2 });
  expect(checkPairs(round, startPairs(round)).right).toBe(false); // not finished
});
