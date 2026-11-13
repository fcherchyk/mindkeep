/** Shopping List (memory): remember a list of things, wait, then pick them out from a larger
 * set. The user decides when the list has been learnt: there is no clock. */

import type { Item, ShoppingLevel } from "./content";
import { type Rng, sample, shuffle } from "./random";

export interface ShoppingRound {
  list: string[]; // item ids to remember, in the order shown
  choices: string[]; // the list and the distractors, mixed
  pauseMs: number;
}

export interface ShoppingResult {
  right: boolean; // every item found and nothing else picked
  found: string[];
  missed: string[];
  wrong: string[];
}

function distractors(level: ShoppingLevel, items: Item[], list: Item[], rng: Rng): Item[] {
  const others = items.filter((item) => !list.includes(item));
  const needed = level.choices - level.items;
  if (!level.similar) return sample(others, needed, rng);
  const groups = new Set(list.map((item) => item.group));
  const alike = shuffle(
    others.filter((item) => groups.has(item.group)),
    rng,
  );
  const rest = shuffle(
    others.filter((item) => !groups.has(item.group)),
    rng,
  );
  return [...alike, ...rest].slice(0, needed);
}

export function makeShoppingRound(level: ShoppingLevel, items: Item[], rng: Rng): ShoppingRound {
  const list = sample(items, level.items, rng);
  const choices = shuffle([...list, ...distractors(level, items, list, rng)], rng);
  return {
    list: list.map((item) => item.id),
    choices: choices.map((item) => item.id),
    pauseMs: level.pauseMs,
  };
}

export function checkShopping(round: ShoppingRound, picked: Iterable<string>): ShoppingResult {
  const chosen = new Set(picked);
  const found = round.list.filter((id) => chosen.has(id));
  const missed = round.list.filter((id) => !chosen.has(id));
  const wrong = round.choices.filter((id) => chosen.has(id) && !round.list.includes(id));
  return { right: missed.length === 0 && wrong.length === 0, found, missed, wrong };
}
