/** S1_AC6: adaptive difficulty. */

import { newProfile } from "../src/core/profile";
import { START, step, UP_AFTER } from "../src/core/staircase";
import { makeApp } from "./helpers";

test("test_S1_AC6_three_right_in_a_row_raise_the_level_and_one_wrong_lowers_it", () => {
  let stairs = START;
  for (let i = 0; i < UP_AFTER - 1; i++) stairs = step(stairs, true, 7);
  expect(stairs.level).toBe(1);
  stairs = step(stairs, true, 7);
  expect(stairs).toEqual({ level: 2, streak: 0 });

  expect(step({ level: 4, streak: 2 }, false, 7)).toEqual({ level: 3, streak: 0 });
});

test("test_S1_AC6_the_level_stays_between_the_first_and_the_last", () => {
  expect(step(START, false, 7)).toEqual({ level: 1, streak: 0 });
  expect(step({ level: 7, streak: 2 }, true, 7)).toEqual({ level: 7, streak: 0 });
});

test("test_S1_AC6_the_level_is_saved_per_game_and_the_next_session_starts_there", () => {
  const { app, store } = makeApp({ profile: newProfile("Rosa") });
  app.startSession();
  app.go("play");
  for (let i = 0; i < 6; i++) app.finishRound(true); // 3 rounds of each game, all right

  expect(app.profile?.levels.shopping?.level).toBe(2);
  expect(app.profile?.levels.odd?.level).toBe(2);
  const again = makeApp({ store, profile: null });
  expect(again.app.profile?.levels.shopping?.level).toBe(2);
  again.app.startSession();
  expect(again.app.level).toBe(2);
});
