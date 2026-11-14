/** The user's profile: a first name, the settings, the level reached in each game, and a short
 * record of each day's session. Nothing else is kept, and it never leaves the device. */

import type { Content, GameId } from "./content";
import { maxLevel } from "./content";
import type { RoundResult, Session } from "./session";
import { START, type Staircase, step } from "./staircase";

export const VERSION = 1;
export const TEXT_SIZES = ["normal", "large", "larger"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];
export const NAME_MAX = 20;
export const VOLUME_MIN = 1;
export const VOLUME_MAX = 5;

export interface Settings {
  textSize: TextSize;
  voice: boolean; // false: muted
  volume: number; // VOLUME_MIN to VOLUME_MAX
  contrast: boolean; // high contrast
}

export interface GameDay {
  rounds: number;
  right: number;
  level: number; // the level reached at the end of the session
}

export interface DayRecord {
  date: string; // YYYY-MM-DD, the device's own day
  games: Partial<Record<GameId, GameDay>>;
}

export interface Profile {
  version: number;
  name: string;
  settings: Settings;
  levels: Partial<Record<GameId, Staircase>>;
  history: DayRecord[];
}

export const DEFAULT_SETTINGS: Settings = {
  textSize: "normal",
  voice: true,
  volume: VOLUME_MAX,
  contrast: false,
};

/** A volume level, kept from VOLUME_MIN to VOLUME_MAX. */
export function clampVolume(level: number): number {
  return Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, Math.round(level)));
}

/** The audio element's volume (0 to 1) for a volume level: the loudest is the clip as recorded. */
export function volumeGain(level: number): number {
  return clampVolume(level) / VOLUME_MAX;
}

const NAME = /^[\p{L}][\p{L}\p{M} '’-]*$/u;

/** A first name: letters, with spaces, hyphens or apostrophes inside, up to 20 characters. */
export function cleanName(name: string): string | null {
  const clean = name.trim().replace(/\s+/g, " ");
  return clean.length <= NAME_MAX && NAME.test(clean) ? clean : null;
}

export function newProfile(name: string): Profile {
  const clean = cleanName(name);
  if (clean === null) throw new Error("not a first name");
  return {
    version: VERSION,
    name: clean,
    settings: { ...DEFAULT_SETTINGS },
    levels: {},
    history: [],
  };
}

export function levelOf(profile: Profile, game: GameId): Staircase {
  return profile.levels[game] ?? START;
}

/** Move the game's staircase after a round, so the next round (and the next day) fits. */
export function afterRound(
  profile: Profile,
  content: Content,
  game: GameId,
  right: boolean,
): Profile {
  const stairs = step(levelOf(profile, game), right, maxLevel(content, game));
  return { ...profile, levels: { ...profile.levels, [game]: stairs } };
}

export function today(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function dayOf(results: RoundResult[], profile: Profile, game: GameId): GameDay | undefined {
  const rounds = results.filter((result) => result.game === game);
  if (rounds.length === 0) return undefined;
  return {
    rounds: rounds.length,
    right: rounds.filter((result) => result.right).length,
    level: levelOf(profile, game).level,
  };
}

/** Keep the finished session as today's record (a second session the same day replaces it). */
export function finishSession(profile: Profile, session: Session, date: string): Profile {
  const games: DayRecord["games"] = {};
  for (const game of new Set(session.plan)) {
    const day = dayOf(session.results, profile, game);
    if (day) games[game] = day;
  }
  const history = [...profile.history.filter((day) => day.date !== date), { date, games }];
  return { ...profile, history };
}

export function doneToday(profile: Profile, date: string): boolean {
  return profile.history.some((day) => day.date === date);
}

export interface GameSummary {
  game: GameId;
  right: number;
  rounds: number;
  level: number;
  previousLevel: number | null; // the level at the end of the last earlier session, if any
}

/** Today compared only with the user's own past: never with other people. */
export function summary(profile: Profile, date: string): GameSummary[] {
  const todayRecord = profile.history.find((day) => day.date === date);
  if (!todayRecord) return [];
  const earlier = profile.history.filter((day) => day.date < date);
  return Object.entries(todayRecord.games).map(([id, day]) => {
    const game = id as GameId;
    const before = earlier.findLast((record) => record.games[game] !== undefined);
    return {
      game,
      right: day.right,
      rounds: day.rounds,
      level: day.level,
      previousLevel: before?.games[game]?.level ?? null,
    };
  });
}
