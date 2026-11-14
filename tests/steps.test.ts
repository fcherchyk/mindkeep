/** S3_AC3: the rules of Put the Steps in Order. */

import { seeded } from "../src/core/random";
import { checkSteps, choose, makeStepsRound, type StepsRound, undo } from "../src/core/steps";
import { content } from "../src/ui/content";

test("test_S3_AC3_a_round_keeps_the_tasks_steps_in_their_order_and_shuffles_the_cards", () => {
  for (const level of content.stepsLevels) {
    for (let seed = 0; seed < 20; seed++) {
      const round = makeStepsRound(level, content.tasks, seeded(seed));
      const task = content.tasks.find((t) => t.title === round.task);
      expect(task).toBeDefined();
      expect(round.steps).toHaveLength(level.steps);
      const places = round.steps.map((step) => task?.steps.indexOf(step) ?? -1);
      expect(places).toEqual([...places].sort((a, b) => a - b));
      expect(places.every((at) => at >= 0)).toBe(true);
      expect([...round.cards].sort()).toEqual(
        [...round.steps, ...(round.extra ? [round.extra] : [])].sort(),
      );
    }
  }
});

test("test_S3_AC3_an_extra_step_comes_from_another_task", () => {
  const level = { steps: 4, extra: true };
  for (let seed = 0; seed < 20; seed++) {
    const round = makeStepsRound(level, content.tasks, seeded(seed));
    const task = content.tasks.find((t) => t.title === round.task);
    expect(round.extra).not.toBeNull();
    expect(task?.steps).not.toContain(round.extra);
    expect(round.cards).toHaveLength(5);
  }
  expect(makeStepsRound({ steps: 4, extra: false }, content.tasks, seeded(1)).extra).toBeNull();
});

test("test_S3_AC3_steps_are_chosen_one_by_one_undone_and_checked_in_order", () => {
  const round: StepsRound = {
    task: "Make toast",
    steps: ["Bread in", "Press down", "Butter"],
    cards: ["Butter", "Dial", "Bread in", "Press down"],
    extra: "Dial",
  };
  let chosen = choose(round, [], "Bread in");
  expect(choose(round, chosen, "Bread in")).toEqual(chosen); // already chosen
  expect(choose(round, chosen, "Fly")).toEqual(chosen); // not a card
  chosen = choose(round, chosen, "Butter");
  expect(checkSteps(round, chosen)).toEqual({ right: false, firstWrong: 1 });
  chosen = undo(chosen);
  expect(chosen).toEqual(["Bread in"]);
  chosen = choose(round, choose(round, chosen, "Press down"), "Butter");
  expect(choose(round, chosen, "Dial")).toEqual(chosen); // the list is full
  expect(checkSteps(round, chosen)).toEqual({ right: true, firstWrong: null });
  expect(checkSteps(round, ["Bread in", "Press down", "Dial"]).right).toBe(false);
  expect(checkSteps(round, ["Bread in"]).right).toBe(false);
  expect(undo([])).toEqual([]);
});
