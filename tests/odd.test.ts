/** S1_AC5: Odd One Out rounds. */

import { DIFFERENCES, type OddLevel } from "../src/core/content";
import { checkOdd, type Figure, makeOddRound, SMALL } from "../src/core/odd";
import { seeded } from "../src/core/random";
import { content } from "../src/ui/content";

const key = (figure: Figure) => JSON.stringify(figure);

test("test_S1_AC5_exactly_one_figure_differs_and_it_is_the_answer", () => {
  for (const [i, level] of content.oddLevels.entries()) {
    const round = makeOddRound(level, seeded(i));
    expect(round.cells).toHaveLength(level.size * level.size);
    const odd = key(round.cells[round.odd] as Figure);
    expect(round.cells.filter((cell) => key(cell) === odd)).toHaveLength(1);
    expect(checkOdd(round, round.odd)).toBe(true);
    expect(checkOdd(round, (round.odd + 1) % round.cells.length)).toBe(false);
  }
});

test("test_S1_AC5_the_figure_differs_by_the_level_difference_and_never_by_colour_alone", () => {
  for (const difference of DIFFERENCES) {
    const level: OddLevel = { size: 3, difference };
    for (let seed = 0; seed < 10; seed++) {
      const round = makeOddRound(level, seeded(seed));
      const odd = round.cells[round.odd] as Figure;
      const base = round.cells[(round.odd + 1) % round.cells.length] as Figure;
      const changed = (Object.keys(odd) as (keyof Figure)[]).filter((k) => odd[k] !== base[k]);
      const expected = { shape: "shape", size: "scale", rotation: "turn", mark: "mark" }[
        difference
      ];
      expect(changed).toEqual([expected]);
      if (difference === "size") expect(odd.scale).toBe(SMALL);
      if (difference === "rotation") expect(odd.shape).toBe("triangle");
    }
  }
});
