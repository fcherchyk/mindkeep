/** The content of a locale (games, items, levels, words and spoken prompts), read from
 * `src/content/<locale>/*.json` and checked once, so the rest of the code can trust it. */

export const GAME_IDS = ["shopping", "odd"] as const;
export type GameId = (typeof GAME_IDS)[number];

export const DIFFERENCES = ["shape", "size", "rotation", "mark"] as const;
export type Difference = (typeof DIFFERENCES)[number];

export interface Game {
  id: GameId;
  area: string; // "memory", "attention"…
}

export interface Item {
  id: string; // a language-neutral concept, drawn in code (ui/icons.ts)
  word: string;
  group: string; // items of a group look alike: they are the "similar" distractors
}

export interface ShoppingLevel {
  items: number; // how many to remember
  choices: number; // how many to choose from
  pauseMs: number; // the wait between the list and the choice
  similar: boolean; // distractors from the same groups as the list
}

export interface OddLevel {
  size: number; // the grid is size × size
  difference: Difference;
}

export interface Prompt {
  id: string;
  spoken: string; // shown and said: the clip is audio/<locale>/prompts/<id>.wav
}

export interface Content {
  locale: string;
  games: Game[];
  rounds: number; // rounds of each game in a session
  items: Item[];
  shoppingLevels: ShoppingLevel[];
  oddLevels: OddLevel[];
  strings: Record<string, string>;
  prompts: Record<string, Prompt>;
}

export interface RawContent {
  locale: string;
  games: unknown;
  items: unknown;
  shoppingLevels: unknown;
  oddLevels: unknown;
  strings: unknown;
  prompts: unknown;
}

export class ContentError extends Error {}

type Json = Record<string, unknown>;

function object(value: unknown, where: string): Json {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ContentError(`${where}: expected an object`);
  }
  return value as Json;
}

function list(value: unknown, where: string): unknown[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ContentError(`${where}: expected a non-empty list`);
  }
  return value;
}

function text(value: unknown, where: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ContentError(`${where}: expected some text`);
  }
  return value;
}

function count(value: unknown, where: string, min: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min) {
    throw new ContentError(`${where}: expected a whole number of at least ${min}`);
  }
  return value;
}

function parseGames(raw: unknown): { games: Game[]; rounds: number } {
  const data = object(raw, "games.json");
  const games = list(data.games, "games.json games").map((entry, i) => {
    const game = object(entry, `game ${i + 1}`);
    const id = text(game.id, `game ${i + 1} id`);
    if (!(GAME_IDS as readonly string[]).includes(id)) {
      throw new ContentError(`game ${i + 1}: unknown game "${id}"`);
    }
    return { id: id as GameId, area: text(game.area, `game ${id} area`) };
  });
  return { games, rounds: count(data.rounds, "games.json rounds", 1) };
}

function parseItems(raw: unknown): Item[] {
  const items = list(object(raw, "items.json").items, "items.json items").map((entry, i) => {
    const item = object(entry, `item ${i + 1}`);
    return {
      id: text(item.id, `item ${i + 1} id`),
      word: text(item.word, `item ${i + 1} word`),
      group: text(item.group, `item ${i + 1} group`),
    };
  });
  const ids = new Set(items.map((item) => item.id));
  if (ids.size !== items.length) throw new ContentError("items.json: an item id is repeated");
  return items;
}

function parseShoppingLevels(raw: unknown, items: Item[]): ShoppingLevel[] {
  const levels = list(object(raw, "shopping_levels.json").levels, "shopping levels");
  return levels.map((entry, i) => {
    const level = object(entry, `shopping level ${i + 1}`);
    const parsed = {
      items: count(level.items, `shopping level ${i + 1} items`, 2),
      choices: count(level.choices, `shopping level ${i + 1} choices`, 3),
      pauseMs: count(level.pauseMs, `shopping level ${i + 1} pauseMs`, 0),
      similar: level.similar === true,
    };
    if (parsed.choices <= parsed.items || parsed.choices > items.length) {
      throw new ContentError(
        `shopping level ${i + 1}: choices must be more than items and at most ${items.length}`,
      );
    }
    return parsed;
  });
}

function parseOddLevels(raw: unknown): OddLevel[] {
  const levels = list(object(raw, "odd_levels.json").levels, "odd levels");
  return levels.map((entry, i) => {
    const level = object(entry, `odd level ${i + 1}`);
    const difference = text(level.difference, `odd level ${i + 1} difference`);
    if (!(DIFFERENCES as readonly string[]).includes(difference)) {
      throw new ContentError(`odd level ${i + 1}: unknown difference "${difference}"`);
    }
    const size = count(level.size, `odd level ${i + 1} size`, 2);
    if (size > 4) throw new ContentError(`odd level ${i + 1}: a grid is at most 4 × 4`);
    return { size, difference: difference as Difference };
  });
}

function parseStrings(raw: unknown): Record<string, string> {
  const strings = object(object(raw, "strings.json").strings, "strings.json strings");
  return Object.fromEntries(Object.entries(strings).map(([key, value]) => [key, text(value, key)]));
}

function parsePrompts(raw: unknown): Record<string, Prompt> {
  const prompts = list(object(raw, "prompts.json").prompts, "prompts").map((entry, i) => {
    const prompt = object(entry, `prompt ${i + 1}`);
    return {
      id: text(prompt.id, `prompt ${i + 1} id`),
      spoken: text(prompt.spoken, `prompt ${i + 1} spoken`),
    };
  });
  return Object.fromEntries(prompts.map((prompt) => [prompt.id, prompt]));
}

export function parseContent(raw: RawContent): Content {
  const { games, rounds } = parseGames(raw.games);
  const items = parseItems(raw.items);
  return {
    locale: raw.locale,
    games,
    rounds,
    items,
    shoppingLevels: parseShoppingLevels(raw.shoppingLevels, items),
    oddLevels: parseOddLevels(raw.oddLevels),
    strings: parseStrings(raw.strings),
    prompts: parsePrompts(raw.prompts),
  };
}

/** A UI string, with `{name}` placeholders filled in. A missing key shows itself, never crashes. */
export function say(content: Content, key: string, values: Record<string, string | number> = {}) {
  const template = content.strings[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? `{${name}}`));
}

export function maxLevel(content: Content, game: GameId): number {
  return game === "shopping" ? content.shoppingLevels.length : content.oddLevels.length;
}
