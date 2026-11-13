/** S1_AC3: today's session. */

import { newProfile } from "../src/core/profile";
import { currentGame, isFirstOfGame, isOver, newSession, record } from "../src/core/session";
import { content } from "../src/ui/content";

test("test_S1_AC3_a_session_takes_turns_between_areas_with_three_rounds_each", () => {
  const session = newSession(content);
  expect(session.plan).toEqual(["shopping", "odd", "shopping", "odd", "shopping", "odd"]);
  const areas = new Set(content.games.map((game) => game.area));
  expect(areas).toEqual(new Set(["memory", "attention"]));
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
