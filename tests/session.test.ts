/** S1_AC3: today's session. */

import { newProfile } from "../src/core/profile";
import {
  currentGame,
  dayNumber,
  gamesOfDay,
  isFirstOfGame,
  isOver,
  newSession,
  planSession,
  record,
} from "../src/core/session";
import { content } from "../src/ui/content";

test("test_S1_AC3_a_session_takes_turns_between_areas_with_three_rounds_each", () => {
  const session = newSession(content, dayNumber("2026-11-15"));
  expect(session.plan).toEqual([
    ...["shopping", "odd", "trail"],
    ...["shopping", "odd", "trail"],
    ...["shopping", "odd", "trail"],
  ]);
  const areas = new Set(content.games.map((game) => game.area));
  expect(areas).toEqual(new Set(["memory", "attention", "planning"]));
});

test("test_S1_AC3_a_session_ends_when_its_rounds_are_played_whatever_the_answers", () => {
  let session = newSession(content);
  expect(isFirstOfGame(session)).toBe(true);
  for (const game of session.plan) {
    expect(currentGame(session)).toBe(game);
    session = record(session, { game, level: 1, right: false });
  }
  expect(isOver(session)).toBe(true);
  expect(currentGame(session)).toBeUndefined();
  expect(newProfile("Rosa").history).toEqual([]);
});

// S2_AC6 and S3_AC6: each day plays one game of each area

test("test_S2_AC6_each_day_plays_one_memory_game_in_turn_and_keeps_attention", () => {
  const days = ["2026-11-12", "2026-11-13", "2026-11-14"].map(dayNumber);
  const memory = days.map((day) => gamesOfDay(content, day).filter((id) => id !== "odd")[0]);
  expect(memory).toEqual(["shopping", "pairs", "sequences"]);
  for (const day of days) expect(gamesOfDay(content, day)).toContain("odd");
  const plan = planSession(content, days[0]);
  expect(plan).toHaveLength(9);
  expect(plan.slice(0, 3)).toEqual(plan.slice(3, 6));
});

test("test_S2_AC6_the_same_day_plays_the_same_games_again", () => {
  const day = dayNumber("2026-11-13");
  expect(planSession(content, day)).toEqual(planSession(content, day));
  expect(dayNumber("2026-11-14") - day).toBe(1);
  expect(dayNumber("2027-01-01") - dayNumber("2026-12-31")).toBe(1);
});

test("test_S3_AC6_every_area_plays_once_a_day_and_all_pairs_come_round_in_six_days", () => {
  const start = dayNumber("2026-11-12");
  const seen = new Set<string>();
  for (let day = start; day < start + 6; day++) {
    const games = gamesOfDay(content, day);
    expect(games).toHaveLength(3);
    const areas = games.map((id) => content.games.find((game) => game.id === id)?.area);
    expect(new Set(areas)).toEqual(new Set(["memory", "attention", "planning"]));
    seen.add(games.join(" "));
  }
  expect(seen.size).toBe(6);
  expect(gamesOfDay(content, start + 6)).toEqual(gamesOfDay(content, start));
});

test("test_S3_AC6_slots_beyond_one_per_area_rotate_among_the_other_games", () => {
  const four = { ...content, perSession: 4 };
  const extras = new Set<string>();
  for (let day = 0; day < 6; day++) {
    const games = gamesOfDay(four, day);
    expect(games).toHaveLength(4);
    expect(games).toContain("odd");
    extras.add(games.join(" "));
  }
  expect(extras.size).toBeGreaterThan(1);
  const all = { ...content, perSession: 6 };
  expect(gamesOfDay(all, 5)).toEqual(content.games.map((game) => game.id));
});
