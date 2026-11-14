/** Sequences (memory): tiles of a grid light up one by one, and the user taps them in the same
 * order. A tile lights at most once, so every tap has one right answer. */

import type { SequenceLevel } from "./content";
import { type Rng, sample } from "./random";

export interface SequenceRound {
  size: number; // the grid is size × size
  order: number[]; // tile indexes, in the order they light
  stepMs: number;
}

export interface SequenceResult {
  done: boolean; // the round is over: every tap made, or a wrong one
  right: boolean;
  firstWrong: number | null; // the position of the first wrong tap
}

export function makeSequenceRound(level: SequenceLevel, rng: Rng): SequenceRound {
  const tiles = Array.from({ length: level.size * level.size }, (_, i) => i);
  return { size: level.size, order: sample(tiles, level.length, rng), stepMs: level.stepMs };
}

export function checkSequence(round: SequenceRound, taps: readonly number[]): SequenceResult {
  const firstWrong = taps.findIndex((tile, i) => round.order[i] !== tile);
  if (firstWrong >= 0) return { done: true, right: false, firstWrong };
  const done = taps.length >= round.order.length;
  return { done, right: done, firstWrong: null };
}

/** Row and column of a tile, counted from 1, to name it for a screen reader. */
export function place(round: SequenceRound, tile: number): { row: number; column: number } {
  return { row: Math.floor(tile / round.size) + 1, column: (tile % round.size) + 1 };
}
