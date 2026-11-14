/** The app's state: the profile, the screen shown and today's session. Screens read it and call
 * its methods; the rules themselves live in src/core. */

import { type Content, type GameId, say } from "../core/content";
import {
  afterRound,
  finishSession,
  levelOf,
  newProfile,
  type Profile,
  type Settings,
  today,
} from "../core/profile";
import type { Rng } from "../core/random";
import {
  currentGame,
  dayNumber,
  gamesOfDay,
  isFirstOfGame,
  isOver,
  newSession,
  record,
  type Session,
} from "../core/session";
import { type KeyValue, loadProfile, saveProfile } from "../core/storage";
import type { Voice } from "./audio";

export type Screen = "welcome" | "home" | "settings" | "intro" | "play" | "summary";

export interface AppOptions {
  content: Content;
  store: KeyValue;
  voice: (app: AppState) => Voice;
  rng: Rng;
  now?: () => Date;
}

export class AppState {
  readonly content: Content;
  readonly rng: Rng;
  readonly voice: Voice;
  private store: KeyValue;
  private now: () => Date;

  profile = $state<Profile | null>(null);
  screen = $state<Screen>("welcome");
  session = $state<Session | null>(null);

  constructor(options: AppOptions) {
    this.content = options.content;
    this.store = options.store;
    this.rng = options.rng;
    this.now = options.now ?? (() => new Date());
    this.voice = options.voice(this);
    this.profile = loadProfile(this.store);
    this.screen = this.profile ? "home" : "welcome";
  }

  /** A UI string of the locale, with its `{placeholders}` filled in. */
  t = (key: string, values: Record<string, string | number> = {}): string =>
    say(this.content, key, values);

  get date(): string {
    return today(this.now());
  }

  /** The games of today's session (they rotate from day to day). */
  get todayGames(): GameId[] {
    return gamesOfDay(this.content, dayNumber(this.date));
  }

  get game(): GameId | undefined {
    return this.session ? currentGame(this.session) : undefined;
  }

  get level(): number {
    const game = this.game;
    return this.profile && game ? levelOf(this.profile, game).level : 1;
  }

  /** The round being played is the session's last one. */
  get lastRound(): boolean {
    return this.session !== null && this.session.results.length + 1 === this.session.plan.length;
  }

  get firstOfGame(): boolean {
    return this.session !== null && isFirstOfGame(this.session);
  }

  private save(profile: Profile): void {
    this.profile = profile;
    saveProfile(this.store, profile);
  }

  createProfile(name: string): void {
    this.save(newProfile(name));
    this.screen = "home";
  }

  updateSettings(changes: Partial<Settings>): void {
    if (!this.profile) return;
    this.save({ ...this.profile, settings: { ...this.profile.settings, ...changes } });
    if (changes.voice === false) this.voice.stop();
  }

  go(screen: Screen): void {
    this.voice.stop();
    this.screen = screen;
  }

  startSession(): void {
    this.session = newSession(this.content, dayNumber(this.date));
    this.go("intro");
  }

  /** A round is over: move the game's level, then go on to the next round or the summary. */
  finishRound(right: boolean): void {
    const game = this.game;
    if (!this.session || !this.profile || !game) return;
    this.session = record(this.session, { game, level: this.level, right });
    this.save(afterRound(this.profile, this.content, game, right));
    if (isOver(this.session)) {
      this.save(finishSession(this.profile, this.session, this.date));
      this.go("summary");
    } else {
      this.go(this.firstOfGame ? "intro" : "play");
    }
  }
}
