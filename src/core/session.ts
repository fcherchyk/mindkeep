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

/** Games take turns: shopping, odd, shopping, odd… `rounds` times each. */
export function planSession(content: Content): GameId[] {
  const plan: GameId[] = [];
  for (let round = 0; round < content.rounds; round++) {
    for (const game of content.games) plan.push(game.id);
  }
  return plan;
}

export function newSession(content: Content): Session {
  return { plan: planSession(content), results: [] };
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
