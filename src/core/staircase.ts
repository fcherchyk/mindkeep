/** Adaptive difficulty: a 3-up/1-down staircase. Three right answers in a row raise the level,
 * one wrong answer lowers it. The user ends up right about 80% of the time: challenged, rarely
 * discouraged. */

export interface Staircase {
  level: number; // 1 is the easiest
  streak: number; // right answers in a row at this level
}

export const UP_AFTER = 3;

export const START: Staircase = { level: 1, streak: 0 };

export function step(stairs: Staircase, right: boolean, maxLevel: number): Staircase {
  if (!right) return { level: Math.max(1, stairs.level - 1), streak: 0 };
  const streak = stairs.streak + 1;
  if (streak < UP_AFTER) return { level: stairs.level, streak };
  return { level: Math.min(maxLevel, stairs.level + 1), streak: 0 };
}
