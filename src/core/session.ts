/** Today's session: a few rounds of each game, taking turns, so one session exercises several
 * areas. A session never fails: it ends when its rounds are played. */

import type { Content, GameId } from "./content";

export interface RoundResult {
  game: GameId;
  level: number;
  right: boolean;
}

export interface Session {
  plan: GameId[];
  results: RoundResult[];
}

/** The number of a day (YYYY-MM-DD) counted from 1970-01-01, to rotate the games by. */
export function dayNumber(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Math.round(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1) / 86_400_000);
}

/** The games of a day: `perSession` of them. Each area plays one of its games, in turn from day
 * to day, so every area is exercised every day; any slots left rotate among the other games. */
export function gamesOfDay(content: Content, day: number): GameId[] {
  const areas = new Map<string, GameId[]>();
  for (const game of content.games)
    areas.set(game.area, [...(areas.get(game.area) ?? []), game.id]);
  const chosen = new Set<GameId>();
  for (const games of areas.values()) chosen.add(games[day % games.length] as GameId);
  const rest = content.games.map((game) => game.id).filter((id) => !chosen.has(id));
  const extra = Math.min(content.perSession - chosen.size, rest.length);
  for (let i = 0; i < extra; i++) chosen.add(rest[(day + i) % rest.length] as GameId);
  return content.games.map((game) => game.id).filter((id) => chosen.has(id));
}

/** The day's games take turns (shopping, odd, pairs, shopping…), `rounds` times each. */
export function planSession(content: Content, day = 0): GameId[] {
  const games = gamesOfDay(content, day);
  const plan: GameId[] = [];
  for (let round = 0; round < content.rounds; round++) plan.push(...games);
  return plan;
}

export function newSession(content: Content, day = 0): Session {
  return { plan: planSession(content, day), results: [] };
}

export function currentGame(session: Session): GameId | undefined {
  return session.plan[session.results.length];
}

export function isOver(session: Session): boolean {
  return session.results.length >= session.plan.length;
}

/** The first round of a game in this session: its instructions are shown before it. */
export function isFirstOfGame(session: Session): boolean {
  const game = currentGame(session);
  return game !== undefined && !session.results.some((result) => result.game === game);
}

export function record(session: Session, result: RoundResult): Session {
  return { ...session, results: [...session.results, result] };
}
