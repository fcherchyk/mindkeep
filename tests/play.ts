/** Play a round of each game on screen, right or wrong, the way a user would. */

import { fireEvent, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { TURN_BACK_MS } from "../src/core/pairs";

export async function click(name: string | RegExp) {
  await fireEvent.click(screen.getByRole("button", { name }));
}

/** Shopping List: the list, Ready, the pause, then the choices (all of the list, or one short). */
export async function playShopping(right: boolean) {
  const listed = within(screen.getByTestId("list"))
    .getAllByRole("listitem")
    .map((li) => li.textContent?.trim() ?? "");
  await click("Ready");
  await vi.runAllTimersAsync();
  await tick();
  const choices = within(screen.getByTestId("choices")).getAllByRole("button");
  const wanted = right ? listed : listed.slice(1);
  for (const choice of choices) {
    if (wanted.some((w) => choice.textContent?.includes(w))) await fireEvent.click(choice);
  }
  await click("Done");
  return listed;
}

/** Odd One Out: the different figure, or another one. */
export async function playOdd(right: boolean) {
  const cells = within(screen.getByTestId("grid")).getAllByRole("button");
  const kinds = cells.map((cell) => cell.dataset.figure);
  const odd = kinds.findIndex((k) => kinds.filter((other) => other === k).length === 1);
  await fireEvent.click(cells[right ? odd : (odd + 1) % cells.length] as HTMLElement);
  return { cells, odd };
}

function cards(): HTMLElement[] {
  return within(screen.getByTestId("cards")).getAllByRole("button");
}

/** Turn up two cards; if they do not match, wait until they turn back. */
export async function turnUp(first: number, second: number) {
  await fireEvent.click(cards()[first] as HTMLElement);
  await fireEvent.click(cards()[second] as HTMLElement);
  await vi.advanceTimersByTimeAsync(TURN_BACK_MS);
  await tick();
}

/** Pairs: with no misses, or with `misses` pairs that do not match first. */
export async function playPairs(right: boolean, misses = 9) {
  const ids = cards().map((card) => card.dataset.card ?? "");
  if (!right) {
    const other = ids.findIndex((id) => id !== ids[0]);
    for (let i = 0; i < misses; i++) await turnUp(0, other);
  }
  for (const id of new Set(ids)) {
    await turnUp(ids.indexOf(id), ids.lastIndexOf(id));
  }
}

/** Sequences: Watch, let the tiles light, then tap the order (or a wrong tile first). */
export async function playSequences(right: boolean) {
  await click("Watch");
  await vi.runAllTimersAsync();
  await tick();
  const grid = screen.getByTestId("tiles");
  const order = (grid.dataset.order ?? "").split(" ").map(Number);
  const tiles = within(grid).getAllByRole("button");
  const taps = right ? order : [tiles.findIndex((_, i) => i !== order[0])];
  for (const tile of taps) {
    await vi.advanceTimersByTimeAsync(600); // past the double-tap guard
    await fireEvent.click(tiles[tile] as HTMLElement);
  }
  return order;
}

/** Trail: the circles in order, or with `misses` wrong taps first. */
export async function playTrail(right: boolean, misses = 9) {
  const board = screen.getByTestId("trail");
  const count = (board.dataset.labels ?? "").split(" ").length;
  const circles = () => within(board).getAllByRole("button");
  if (!right) {
    for (let i = 0; i < misses; i++) {
      await vi.advanceTimersByTimeAsync(600); // past the double-tap guard
      await fireEvent.click(circles()[count - 1] as HTMLElement);
    }
  }
  for (let i = 0; i < count; i++) await fireEvent.click(circles()[i] as HTMLElement);
}

/** Put the Steps in Order: the right order, or the first two swapped. */
export async function playSteps(right: boolean) {
  const order = (screen.getByTestId("steps").dataset.order ?? "").split("|");
  const taps = right ? order : [order[1], order[0], ...order.slice(2)];
  for (const step of taps) await click(step ?? "");
  await click("Done");
  return order;
}

/** Whatever game is on screen (after its intro, if any), right or wrong. */
export async function playRound(right: (game: string) => boolean) {
  if (screen.queryByRole("button", { name: "Start" })) await click("Start");
  if (screen.queryByTestId("list")) await playShopping(right("shopping"));
  else if (screen.queryByTestId("cards")) await playPairs(right("pairs"));
  else if (screen.queryByTestId("tiles")) await playSequences(right("sequences"));
  else if (screen.queryByTestId("trail")) await playTrail(right("trail"));
  else if (screen.queryByTestId("steps")) await playSteps(right("steps"));
  else await playOdd(right("odd"));
  await click(/^(Next|See today's summary)$/);
}
