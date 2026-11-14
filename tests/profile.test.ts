/** S1_AC1 (the profile) and S1_AC9 (today compared with the user's own past). */

import {
  cleanName,
  DEFAULT_SETTINGS,
  doneToday,
  finishSession,
  newProfile,
  summary,
  today,
} from "../src/core/profile";
import { newSession, record } from "../src/core/session";
import { content } from "../src/ui/content";

test("test_S1_AC1_a_first_name_makes_a_profile_with_the_default_settings", () => {
  const profile = newProfile("  María   José ");
  expect(profile.name).toBe("María José");
  expect(profile.settings).toEqual(DEFAULT_SETTINGS);
  expect(profile.levels).toEqual({});
  for (const name of ["Ann-Marie", "O'Neil", "Zoë"]) expect(cleanName(name)).toBe(name);
});

test("test_S1_AC1_anything_but_a_first_name_is_refused", () => {
  for (const name of ["", "   ", "R2D2", "a@b.c", "x".repeat(21), "-Ann"]) {
    expect(cleanName(name)).toBeNull();
  }
  expect(() => newProfile("123")).toThrow();
});

// The profile does not depend on which games a day plays: these use S1's two games every day.
const twoGames = { ...content, games: content.games.slice(0, 2), perSession: 2 };

function play(rightFor: (game: string, i: number) => boolean) {
  let session = newSession(twoGames);
  session.plan.forEach((game, i) => {
    session = record(session, { game, level: 1, right: rightFor(game, i) });
  });
  return session;
}

test("test_S1_AC9_a_finished_session_is_kept_as_the_day_and_marks_it_done", () => {
  const date = today(new Date(2026, 10, 13, 9));
  expect(date).toBe("2026-11-13");
  let profile = newProfile("Rosa");
  expect(doneToday(profile, date)).toBe(false);

  profile = finishSession(
    profile,
    play((game) => game === "odd"),
    date,
  );
  expect(doneToday(profile, date)).toBe(true);
  expect(profile.history).toEqual([
    {
      date,
      games: {
        shopping: { rounds: 3, right: 0, level: 1 },
        odd: { rounds: 3, right: 3, level: 1 },
      },
    },
  ]);
  profile = finishSession(
    profile,
    play(() => true),
    date,
  ); // the same day again replaces it
  expect(profile.history).toHaveLength(1);
});

test("test_S1_AC9_the_summary_compares_with_the_last_earlier_session_only", () => {
  let profile = newProfile("Rosa");
  expect(summary(profile, "2026-11-13")).toEqual([]);
  profile = { ...profile, levels: { shopping: { level: 2, streak: 0 } } };
  profile = finishSession(
    profile,
    play(() => true),
    "2026-11-10",
  );
  profile = {
    ...profile,
    levels: { shopping: { level: 4, streak: 0 }, odd: { level: 1, streak: 0 } },
  };
  profile = finishSession(
    profile,
    play(() => true),
    "2026-11-13",
  );

  const today = summary(profile, "2026-11-13");
  expect(today.find((g) => g.game === "shopping")).toEqual({
    game: "shopping",
    right: 3,
    rounds: 3,
    level: 4,
    previousLevel: 2,
  });
  expect(today.find((g) => g.game === "odd")?.previousLevel).toBe(1);
  expect(summary(profile, "2026-11-10").every((g) => g.previousLevel === null)).toBe(true);
});
