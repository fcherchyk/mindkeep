/** Pairs (memory): cards lie face down, two at a time are turned up, and a matching pair stays
 * up. There is no clock: a round counts as right when few pairs failed to match. */

import type { Item, PairsLevel } from "./content";
import { type Rng, sample, shuffle } from "./random";

/** How long two cards that do not match stay up before they turn back. */
export const TURN_BACK_MS = 1500;

export interface PairsRound {
  cards: string[]; // item ids, each twice, shuffled
  misses: number; // the most pairs that may not match for the round to be right
}

export interface PairsState {
  matched: boolean[]; // per card
  up: number[]; // the cards turned up and not matched yet (0, 1 or 2)
  mismatches: number;
}

export interface PairsResult {
  right: boolean;
  mismatches: number;
}

export function makePairsRound(level: PairsLevel, items: Item[], rng: Rng): PairsRound {
  const ids = sample(items, level.pairs, rng).map((item) => item.id);
  return { cards: shuffle([...ids, ...ids], rng), misses: level.misses };
}

export function startPairs(round: PairsRound): PairsState {
  return { matched: round.cards.map(() => false), up: [], mismatches: 0 };
}

/** Turn a card up. A matched card, a card already up, or a third card while two are up (waiting
 * to be turned back) changes nothing. */
export function flip(round: PairsRound, state: PairsState, index: number): PairsState {
  if (index < 0 || index >= round.cards.length) return state;
  if (state.matched[index] || state.up.includes(index) || state.up.length === 2) return state;
  const up = [...state.up, index];
  if (up.length < 2) return { ...state, up };
  const [first, second] = up as [number, number];
  if (round.cards[first] === round.cards[second]) {
    const matched = state.matched.map((done, i) => done || i === first || i === second);
    return { ...state, matched, up: [] };
  }
  return { ...state, up, mismatches: state.mismatches + 1 };
}

/** Two cards up that do not match: they must be turned back before the next card. */
export function mismatched(state: PairsState): boolean {
  return state.up.length === 2;
}

export function turnBack(state: PairsState): PairsState {
  return mismatched(state) ? { ...state, up: [] } : state;
}

export function isDone(state: PairsState): boolean {
  return state.matched.every(Boolean);
}

export function checkPairs(round: PairsRound, state: PairsState): PairsResult {
  return { right: isDone(state) && state.mismatches <= round.misses, mismatches: state.mismatches };
}
