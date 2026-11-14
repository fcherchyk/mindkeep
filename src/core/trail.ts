/** Trail (planning): circles scattered on a board are tapped in order, 1-2-3… or, at higher
 * levels, numbers and letters taking turns: 1-A-2-B-3-C. There is no clock: a wrong tap only
 * counts a miss and play goes on. */

import type { TrailLevel } from "./content";
import { type Rng, sample } from "./random";

/** The board is a grid of CELLS × CELLS cells, one circle at most per cell. */
export const CELLS = 4;
const LETTERS = "ABCDEFGHIJKLMNOP";

export interface TrailRound {
  labels: string[]; // in the order they must be tapped
  places: { x: number; y: number }[]; // the centre of each circle, from 0 to 1
  misses: number; // the most wrong taps for the round to be right
}

export interface TrailState {
  done: number; // how many circles are tapped, in order
  misses: number;
}

export interface TrailResult {
  right: boolean;
  misses: number;
}

export function trailLabels(level: TrailLevel): string[] {
  return Array.from({ length: level.count }, (_, i) =>
    level.letters
      ? i % 2 === 0
        ? String(i / 2 + 1)
        : (LETTERS[(i - 1) / 2] ?? "?")
      : String(i + 1),
  );
}

export function makeTrailRound(level: TrailLevel, rng: Rng): TrailRound {
  const cells = sample(
    Array.from({ length: CELLS * CELLS }, (_, i) => i),
    level.count,
    rng,
  );
  const places = cells.map((cell) => {
    const jitter = () => (rng() - 0.5) * 0.12; // up to 6% of a cell either way
    return {
      x: ((cell % CELLS) + 0.5 + jitter()) / CELLS,
      y: (Math.floor(cell / CELLS) + 0.5 + jitter()) / CELLS,
    };
  });
  return { labels: trailLabels(level), places, misses: level.misses };
}

export function startTrail(): TrailState {
  return { done: 0, misses: 0 };
}

/** Tap a circle: the next one moves on, another one not yet done counts a miss, and one already
 * done changes nothing. */
export function tapTrail(round: TrailRound, state: TrailState, index: number): TrailState {
  if (isDone(round, state) || index < state.done || index >= round.labels.length) return state;
  if (index === state.done) return { ...state, done: state.done + 1 };
  return { ...state, misses: state.misses + 1 };
}

export function isDone(round: TrailRound, state: TrailState): boolean {
  return state.done >= round.labels.length;
}

export function checkTrail(round: TrailRound, state: TrailState): TrailResult {
  return { right: isDone(round, state) && state.misses <= round.misses, misses: state.misses };
}
