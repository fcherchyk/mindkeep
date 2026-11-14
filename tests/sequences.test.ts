/** S2_AC3: the rules of Sequences. */

import { seeded } from "../src/core/random";
import { checkSequence, makeSequenceRound, place } from "../src/core/sequences";
import { content } from "../src/ui/content";

test("test_S2_AC3_a_sequence_lights_distinct_tiles_of_the_grid", () => {
  for (const level of content.sequenceLevels) {
    for (let seed = 0; seed < 20; seed++) {
      const round = makeSequenceRound(level, seeded(seed));
      expect(round.order).toHaveLength(level.length);
      expect(new Set(round.order).size).toBe(level.length);
      for (const tile of round.order) {
        expect(tile).toBeGreaterThanOrEqual(0);
        expect(tile).toBeLessThan(level.size * level.size);
      }
      expect(round.stepMs).toBe(level.stepMs);
    }
  }
});

test("test_S2_AC3_the_taps_must_follow_the_order_and_a_wrong_one_ends_the_round", () => {
  const round = { size: 3, order: [4, 0, 8], stepMs: 1000 };
  expect(checkSequence(round, [])).toEqual({ done: false, right: false, firstWrong: null });
  expect(checkSequence(round, [4, 0])).toEqual({ done: false, right: false, firstWrong: null });
  expect(checkSequence(round, [4, 0, 8])).toEqual({ done: true, right: true, firstWrong: null });
  expect(checkSequence(round, [4, 8])).toEqual({ done: true, right: false, firstWrong: 1 });
  expect(checkSequence(round, [0])).toEqual({ done: true, right: false, firstWrong: 0 });
});

test("test_S2_AC3_a_tile_is_named_by_its_row_and_column", () => {
  const round = { size: 4, order: [], stepMs: 800 };
  expect(place(round, 0)).toEqual({ row: 1, column: 1 });
  expect(place(round, 6)).toEqual({ row: 2, column: 3 });
  expect(place(round, 15)).toEqual({ row: 4, column: 4 });
});
