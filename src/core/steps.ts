/** Put the Steps in Order (planning): the steps of an everyday task, shuffled, are put back in
 * order by tapping them one after another. Harder levels have more steps, and one step that
 * belongs to another task and must be left out. */

import type { StepsLevel, Task } from "./content";
import { pick, type Rng, sample, shuffle } from "./random";

export interface StepsRound {
  task: string; // the task's title
  steps: string[]; // the right order
  cards: string[]; // the steps and the extra one, shuffled
  extra: string | null; // a step of another task, or none
}

export interface StepsResult {
  right: boolean;
  firstWrong: number | null; // the first place where the order differs
}

export function makeStepsRound(level: StepsLevel, tasks: Task[], rng: Rng): StepsRound {
  const task = pick(tasks, rng);
  const kept = sample(
    task.steps.map((_, i) => i),
    level.steps,
    rng,
  ).sort((a, b) => a - b);
  const steps = kept.map((i) => task.steps[i] as string);
  const others = tasks
    .filter((other) => other.id !== task.id)
    .flatMap((other) => other.steps)
    .filter((step) => !task.steps.includes(step));
  const extra = level.extra && others.length > 0 ? pick(others, rng) : null;
  return {
    task: task.title,
    steps,
    cards: shuffle(extra ? [...steps, extra] : steps, rng),
    extra,
  };
}

/** Add a card as the next step; a card already chosen, or one more than the task has, is not. */
export function choose(round: StepsRound, chosen: readonly string[], card: string): string[] {
  if (chosen.includes(card) || !round.cards.includes(card)) return [...chosen];
  if (chosen.length >= round.steps.length) return [...chosen];
  return [...chosen, card];
}

export function undo(chosen: readonly string[]): string[] {
  return chosen.slice(0, -1);
}

export function checkSteps(round: StepsRound, chosen: readonly string[]): StepsResult {
  const at = round.steps.findIndex((step, i) => chosen[i] !== step);
  if (at >= 0) return { right: false, firstWrong: at };
  return { right: chosen.length === round.steps.length, firstWrong: null };
}
