/** S1_AC10: a double tap counts once. */

import { REPEAT_MS, tapGate } from "../src/core/taps";

test("test_S1_AC10_a_second_tap_on_the_same_thing_soon_after_is_ignored", () => {
  const gate = tapGate();
  expect(gate("apple", 1000)).toBe(true);
  expect(gate("apple", 1000 + REPEAT_MS - 1)).toBe(false);
  expect(gate("pear", 1100)).toBe(true);
  expect(gate("apple", 1200)).toBe(true);
  expect(gate("apple", 1200 + REPEAT_MS)).toBe(true);
});
