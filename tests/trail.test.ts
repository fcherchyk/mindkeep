/** S3_AC1: the rules of Trail. */

import { seeded } from "../src/core/random";
import {
  CELLS,
  checkTrail,
  isDone,
  makeTrailRound,
  startTrail,
  type TrailRound,
  tapTrail,
  trailLabels,
} from "../src/core/trail";
import { content } from "../src/ui/content";

test("test_S3_AC1_numbers_come_first_then_numbers_and_letters_take_turns", () => {
  expect(trailLabels({ count: 5, letters: false, misses: 2 })).toEqual(["1", "2", "3", "4", "5"]);
  expect(trailLabels({ count: 6, letters: true, misses: 2 })).toEqual([
    ...["1", "A", "2", "B", "3", "C"],
  ]);
  const levels = content.trailLevels;
  expect(levels[0]?.letters).toBe(false);
  expect(levels.at(-1)?.letters).toBe(true);
});

test("test_S3_AC1_circles_sit_in_different_cells_so_they_never_overlap", () => {
  for (const level of content.trailLevels) {
    for (let seed = 0; seed < 20; seed++) {
      const round = makeTrailRound(level, seeded(seed));
      expect(round.places).toHaveLength(level.count);
      const cells = round.places.map(
        (p) => `${Math.floor(p.x * CELLS)},${Math.floor(p.y * CELLS)}`,
      );
      expect(new Set(cells).size).toBe(level.count);
      for (const p of round.places) {
        const inCell = (v: number) => (v * CELLS) % 1;
        // near the cell's centre: two circles are always at least 88% of a cell apart
        expect(inCell(p.x)).toBeGreaterThanOrEqual(0.44 - 0.001);
        expect(inCell(p.x)).toBeLessThanOrEqual(0.56 + 0.001);
        expect(inCell(p.y)).toBeGreaterThanOrEqual(0.44 - 0.001);
        expect(inCell(p.y)).toBeLessThanOrEqual(0.56 + 0.001);
      }
    }
  }
});

test("test_S3_AC1_only_the_next_circle_moves_on_and_a_wrong_one_counts_a_miss", () => {
  const round: TrailRound = {
    labels: ["1", "A", "2"],
    places: [
      { x: 0.1, y: 0.1 },
      { x: 0.5, y: 0.5 },
      { x: 0.9, y: 0.9 },
    ],
    misses: 1,
  };
  let state = startTrail();
  state = tapTrail(round, state, 2); // 2 before A
  expect(state).toEqual({ done: 0, misses: 1 });
  state = tapTrail(round, tapTrail(round, state, 0), 1);
  expect(state.done).toBe(2);
  expect(tapTrail(round, state, 0)).toBe(state); // a circle already done changes nothing
  expect(tapTrail(round, state, 7)).toBe(state);
  state = tapTrail(round, state, 2);
  expect(isDone(round, state)).toBe(true);
  expect(tapTrail(round, state, 2)).toBe(state);
  expect(checkTrail(round, state)).toEqual({ right: true, misses: 1 });
  expect(checkTrail(round, { done: 3, misses: 2 }).right).toBe(false);
  expect(checkTrail(round, startTrail()).right).toBe(false);
});
