/** Odd One Out (attention): a grid of figures that are all the same but one. The difference gets
 * subtler with the level: another shape, then a smaller size, then a turn, then a small mark.
 * Figures differ in form, never in colour alone. */

import type { Difference, OddLevel } from "./content";
import { pick, type Rng, randomInt } from "./random";

export const SHAPES = ["circle", "square", "triangle", "diamond", "hexagon"] as const;
export type Shape = (typeof SHAPES)[number];

export interface Figure {
  shape: Shape;
  scale: number; // 1 is full size
  turn: number; // degrees
  mark: boolean; // a small dot inside
}

export interface OddRound {
  size: number;
  difference: Difference;
  cells: Figure[];
  odd: number; // the index of the figure that differs
}

export const SMALL = 0.72;

/** Shapes whose half turn looks different (a circle turned looks the same). */
const TURNABLE: Shape[] = ["triangle"];

function oddFigure(base: Figure, difference: Difference, rng: Rng): Figure {
  switch (difference) {
    case "shape":
      return {
        ...base,
        shape: pick(
          SHAPES.filter((shape) => shape !== base.shape),
          rng,
        ),
      };
    case "size":
      return { ...base, scale: SMALL };
    case "rotation":
      return { ...base, turn: 180 };
    case "mark":
      return { ...base, mark: true };
  }
}

export function makeOddRound(level: OddLevel, rng: Rng): OddRound {
  const shape = level.difference === "rotation" ? pick(TURNABLE, rng) : pick(SHAPES, rng);
  const base: Figure = { shape, scale: 1, turn: 0, mark: false };
  const total = level.size * level.size;
  const odd = randomInt(rng, total);
  const different = oddFigure(base, level.difference, rng);
  const cells = Array.from({ length: total }, (_, i) => (i === odd ? different : base));
  return { size: level.size, difference: level.difference, cells, odd };
}

export function checkOdd(round: OddRound, index: number): boolean {
  return index === round.odd;
}
