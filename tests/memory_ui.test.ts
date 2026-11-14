/** The screens of S2: Pairs, Sequences, their instructions and the day's games on the home. */

import { fireEvent, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import type { GameId } from "../src/core/content";
import { TURN_BACK_MS } from "../src/core/pairs";
import { content } from "../src/ui/content";
import { renderApp } from "./helpers";
import { click, playPairs, playRound, playSequences, turnUp } from "./play";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Open a game straight away, past the home and the intro. */
async function open(game: GameId, setup: Parameters<typeof renderApp>[0] = {}) {
  const made = renderApp(setup);
  made.app.session = { plan: [game, game], results: [] };
  made.app.go("play");
  await tick();
  return made;
}

const cards = () => within(screen.getByTestId("cards")).getAllByRole("button");
const tiles = () => within(screen.getByTestId("tiles")).getAllByRole("button");

// S2_AC2: the Pairs screen

test("test_S2_AC2_cards_start_face_down_with_a_name_each", async () => {
  await open("pairs");
  const level = content.pairsLevels[0];
  expect(cards()).toHaveLength((level?.pairs ?? 0) * 2);
  expect(cards()[0]).toHaveAccessibleName("Card 1, face down");
  for (const card of cards()) expect(card.tagName).toBe("BUTTON");
});

test("test_S2_AC2_two_cards_that_do_not_match_turn_back_after_a_pause", async () => {
  await open("pairs");
  const ids = cards().map((card) => card.dataset.card);
  const other = ids.findIndex((id) => id !== ids[0]);
  await fireEvent.click(cards()[0] as HTMLElement);
  await fireEvent.click(cards()[other] as HTMLElement);
  expect(cards()[0]).toHaveAccessibleName(content.items.find((i) => i.id === ids[0])?.word ?? "");
  const third = ids.findIndex((_, i) => i !== 0 && i !== other);
  await fireEvent.click(cards()[third] as HTMLElement); // taps wait while two are up
  expect(cards()[third]).toHaveAccessibleName(`Card ${third + 1}, face down`);
  await vi.advanceTimersByTimeAsync(TURN_BACK_MS - 100);
  expect(cards()[other]).not.toHaveAccessibleName(/face down/);
  await vi.advanceTimersByTimeAsync(100);
  await tick();
  expect(cards()[0]).toHaveAccessibleName("Card 1, face down");
  expect(cards()[other]).toHaveAccessibleName(`Card ${other + 1}, face down`);
});

test("test_S2_AC2_a_matching_pair_stays_up_with_a_tick", async () => {
  await open("pairs");
  const ids = cards().map((card) => card.dataset.card ?? "");
  const twin = ids.lastIndexOf(ids[0] ?? "");
  await turnUp(0, twin);
  expect(cards()[0]).toHaveTextContent("✓");
  expect(cards()[0]).toHaveClass("matched");
  expect(cards()[twin]).toBeDisabled();
  await fireEvent.click(cards()[0] as HTMLElement);
  expect(cards()[0]).toHaveClass("matched");
});

test("test_S2_AC2_all_pairs_found_ends_the_round_calmly_with_the_misses", async () => {
  const { app } = await open("pairs");
  await playPairs(true);
  expect(screen.getByText("Well done.")).toBeInTheDocument();
  await click("Next");
  expect(app.session?.results).toEqual([{ game: "pairs", level: 1, right: true }]);

  await tick();
  await playPairs(false, 3); // more misses than level 1 allows
  expect(screen.getByText(/All pairs found\. Next time/)).toBeInTheDocument();
  expect(screen.getByText("3 tries did not match.")).toBeInTheDocument();
  expect(screen.queryByText(/lost|game over|try harder/i)).toBeNull();
  await click("See today's summary");
  expect(app.session?.results.at(-1)?.right).toBe(false);
});

// S2_AC4: the Sequences screen

test("test_S2_AC4_nothing_lights_until_watch_and_the_tiles_wait_meanwhile", async () => {
  await open("sequences");
  await vi.advanceTimersByTimeAsync(60_000);
  expect(document.querySelector(".lit")).toBeNull();
  for (const tile of tiles()) expect(tile).toBeDisabled();
  expect(tiles()[0]).toHaveAccessibleName("Row 1, column 1");
  expect(tiles()[4]).toHaveAccessibleName("Row 2, column 2");
});

test("test_S2_AC4_tiles_light_one_by_one_with_a_mark_and_a_spoken_name", async () => {
  await open("sequences");
  const order = (screen.getByTestId("tiles").dataset.order ?? "").split(" ").map(Number);
  const step = content.sequenceLevels[0]?.stepMs ?? 1000;
  await click("Watch");
  for (const [i, tile] of order.entries()) {
    await vi.advanceTimersByTimeAsync(i === 0 ? 400 : step);
    expect(document.querySelectorAll(".lit")).toHaveLength(1);
    expect(tiles()[tile]).toHaveClass("lit");
    expect(tiles()[tile]?.querySelector(".dot")).not.toBeNull();
    expect(screen.getByTestId("lit")).toHaveTextContent(/^Lit: row \d, column \d$/);
    for (const other of tiles()) expect(other).toBeDisabled();
  }
  await vi.runAllTimersAsync();
  expect(document.querySelector(".lit")).toBeNull();
  expect(screen.getByText(content.prompts.sequences_repeat?.spoken ?? "")).toBeInTheDocument();
  expect(tiles()[0]).toBeEnabled();
});

test("test_S2_AC4_the_right_order_says_well_done", async () => {
  const { app, player } = await open("sequences");
  await playSequences(true);
  expect(screen.getByText("Well done.")).toBeInTheDocument();
  expect(player.played.some((url) => url.includes("sequences_repeat"))).toBe(true);
  await click("Next");
  expect(app.session?.results[0]?.right).toBe(true);
});

test("test_S2_AC4_a_wrong_tap_ends_the_round_and_numbers_the_right_order", async () => {
  const { app } = await open("sequences");
  const order = await playSequences(false);
  expect(screen.getByText(/The right order is numbered/)).toBeInTheDocument();
  for (const [i, tile] of order.entries()) expect(tiles()[tile]).toHaveTextContent(String(i + 1));
  for (const tile of tiles()) expect(tile).toBeDisabled();
  await click("Next");
  expect(app.session?.results[0]?.right).toBe(false);
});

// S2_AC6: the home shows the day's games; S2_AC8: instructions written, spoken and shown

test("test_S2_AC6_the_home_lists_only_todays_games", () => {
  renderApp({ now: new Date(2026, 10, 13, 10) });
  for (const name of ["Odd One Out", "Pairs", "Trail"]) {
    expect(screen.getByText(name)).toBeInTheDocument();
  }
  for (const name of ["Shopping List", "Sequences", "Put the Steps in Order"]) {
    expect(screen.queryByText(name)).toBeNull();
  }
});

test("test_S2_AC8_pairs_and_sequences_start_with_instructions_spoken_and_an_example", async () => {
  for (const [game, date] of [
    ["pairs", 13],
    ["sequences", 14],
  ] as const) {
    const { player, unmount } = renderApp({ now: new Date(2026, 10, date, 10) });
    await click("Start");
    await playRound(() => true); // Odd One Out comes first
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      content.strings[`game_${game}`] ?? "",
    );
    expect(player.played.at(-1)).toContain(`${game}_intro`);
    expect(screen.getByText(content.prompts[`${game}_intro`]?.spoken ?? "")).toBeInTheDocument();
    await click("Show me");
    expect(screen.getByRole("region", { name: /Example/ })).toBeInTheDocument();
    expect(document.querySelectorAll(".example .marked").length).toBeGreaterThanOrEqual(2);
    unmount();
  }
});
