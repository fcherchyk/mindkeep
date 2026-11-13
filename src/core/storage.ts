/** Saving the profile in a key-value store (the browser's localStorage, a fake in tests). Damaged
 * or unknown data is set aside under another key, never a crash: the user starts again. */

import { GAME_IDS } from "./content";
import { DEFAULT_SETTINGS, type Profile, TEXT_SIZES, VERSION } from "./profile";

export interface KeyValue {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const KEY = "mindkeep:profile";
export const CORRUPT_KEY = `${KEY}:corrupt`;

function isProfile(data: unknown): data is Profile {
  if (typeof data !== "object" || data === null) return false;
  const profile = data as Partial<Profile>;
  return (
    profile.version === VERSION &&
    typeof profile.name === "string" &&
    typeof profile.levels === "object" &&
    profile.levels !== null &&
    Array.isArray(profile.history) &&
    Object.keys(profile.levels).every((game) => (GAME_IDS as readonly string[]).includes(game))
  );
}

/** Settings saved by an older version may lack a field: the default fills it. */
function withSettings(profile: Profile): Profile {
  const settings = { ...DEFAULT_SETTINGS, ...(profile.settings ?? {}) };
  if (!TEXT_SIZES.includes(settings.textSize)) settings.textSize = DEFAULT_SETTINGS.textSize;
  return { ...profile, settings };
}

export function loadProfile(store: KeyValue): Profile | null {
  const raw = store.getItem(KEY);
  if (raw === null) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (isProfile(data)) return withSettings(data);
  } catch {
    // not JSON: set aside below
  }
  store.setItem(CORRUPT_KEY, raw);
  store.removeItem(KEY);
  return null;
}

export function saveProfile(store: KeyValue, profile: Profile): void {
  store.setItem(KEY, JSON.stringify(profile));
}
