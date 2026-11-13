/** Hands that shake often tap twice. A second tap on the same thing within a short time is the
 * same tap, so a choice is never undone by accident. */

export const REPEAT_MS = 500;

export type TapGate = (key: string, now: number) => boolean;

/** Returns a gate that lets a tap through unless the same key was tapped less than `ms` ago. */
export function tapGate(ms: number = REPEAT_MS): TapGate {
  let lastKey: string | null = null;
  let lastAt = Number.NEGATIVE_INFINITY;
  return (key, now) => {
    const repeat = key === lastKey && now - lastAt < ms;
    lastKey = key;
    lastAt = now;
    return !repeat;
  };
}
