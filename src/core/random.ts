/** Random choices that tests can repeat: every rule takes an `Rng` instead of `Math.random`. */

export type Rng = () => number;

/** A small seeded generator (mulberry32): the same seed always gives the same numbers. */
export function seeded(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(rng: Rng, max: number): number {
  return Math.floor(rng() * max);
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1);
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** `count` different items, in random order. */
export function sample<T>(items: readonly T[], count: number, rng: Rng): T[] {
  return shuffle(items, rng).slice(0, count);
}

export function pick<T>(items: readonly T[], rng: Rng): T {
  const item = items[randomInt(rng, items.length)];
  if (item === undefined) throw new Error("pick from an empty list");
  return item;
}
