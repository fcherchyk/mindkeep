/** S1_AC2: the profile is saved on the device; damaged data is set aside, never a crash. */

import { levelOf, newProfile } from "../src/core/profile";
import { CORRUPT_KEY, KEY, loadProfile, saveProfile } from "../src/core/storage";
import { MemoryStore } from "./helpers";

test("test_S1_AC2_a_saved_profile_loads_back_the_same", () => {
  const store = new MemoryStore();
  expect(loadProfile(store)).toBeNull();
  const profile = { ...newProfile("Rosa"), levels: { odd: { level: 3, streak: 1 } } };
  saveProfile(store, profile);
  expect(loadProfile(store)).toEqual(profile);
});

test("test_S1_AC2_damaged_or_unknown_data_is_set_aside_and_the_user_starts_again", () => {
  for (const raw of ["{not json", '{"version": 99, "name": "Rosa"}', "null", '{"version":1}']) {
    const store = new MemoryStore();
    store.setItem(KEY, raw);
    expect(loadProfile(store)).toBeNull();
    expect(store.getItem(KEY)).toBeNull();
    expect(store.getItem(CORRUPT_KEY)).toBe(raw);
  }
});

test("test_S1_AC2_settings_missing_or_wrong_in_saved_data_get_the_default", () => {
  const store = new MemoryStore();
  const { settings: _, ...old } = newProfile("Rosa");
  store.setItem(KEY, JSON.stringify({ ...old, settings: { textSize: "huge", voice: false } }));
  expect(loadProfile(store)?.settings).toEqual({
    textSize: "normal",
    voice: false,
    contrast: false,
  });
});

// S2_AC7: a profile saved before S2 keeps working

test("test_S2_AC7_a_profile_from_slice_1_loads_and_the_new_games_start_at_level_1", () => {
  const store = new MemoryStore();
  const s1 = {
    version: 1,
    name: "Rosa",
    settings: { textSize: "large", voice: true, contrast: false },
    levels: { shopping: { level: 3, streak: 1 }, odd: { level: 4, streak: 0 } },
    history: [{ date: "2026-11-12", games: { shopping: { rounds: 3, right: 2, level: 3 } } }],
  };
  store.setItem(KEY, JSON.stringify(s1));
  const profile = loadProfile(store);
  expect(profile).toEqual(s1);
  if (!profile) return;
  expect(levelOf(profile, "pairs")).toEqual({ level: 1, streak: 0 });
  expect(levelOf(profile, "sequences")).toEqual({ level: 1, streak: 0 });
  expect(levelOf(profile, "shopping").level).toBe(3);
});
