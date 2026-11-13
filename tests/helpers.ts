/** Shared test helpers: an in-memory store, a voice that only records, and the app around them. */

import { render } from "@testing-library/svelte";
import { newProfile, type Profile } from "../src/core/profile";
import { seeded } from "../src/core/random";
import { type KeyValue, saveProfile } from "../src/core/storage";
import App from "../src/ui/App.svelte";
import { type Player, Voice } from "../src/ui/audio";
import { content } from "../src/ui/content";
import { AppState } from "../src/ui/state.svelte";

export class MemoryStore implements KeyValue {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

export class FakePlayer implements Player {
  played: string[] = [];
  stops = 0;
  play(url: string) {
    this.played.push(url);
  }
  stop() {
    this.stops += 1;
  }
}

export interface Setup {
  store?: MemoryStore;
  profile?: Profile | null;
  now?: Date;
  seed?: number;
}

export function makeApp(setup: Setup = {}) {
  const store = setup.store ?? new MemoryStore();
  const profile = setup.profile === undefined ? newProfile("Rosa") : setup.profile;
  if (profile) saveProfile(store, profile);
  const player = new FakePlayer();
  const app = new AppState({
    content,
    store,
    rng: seeded(setup.seed ?? 7),
    now: () => setup.now ?? new Date(2026, 10, 13, 10),
    voice: (state) =>
      new Voice(content.locale, player, () => state.profile?.settings.voice ?? true),
  });
  return { app, store, player };
}

export function renderApp(setup: Setup = {}) {
  const made = makeApp(setup);
  const view = render(App, { props: { app: made.app } });
  return { ...made, ...view };
}
