/** The screens of S3: Trail, Put the Steps in Order and their instructions. */

import { fireEvent, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import type { GameId } from "../src/core/content";
import { content } from "../src/ui/content";
import { renderApp } from "./helpers";
import { click, playRound, playSteps, playTrail } from "./play";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

async function open(game: GameId) {
  const made = renderApp();
  made.app.session = { plan: [game, game], results: [] };
  made.app.go("play");
  await tick();
  return made;
}

const circles = () => within(screen.getByTestId("trail")).getAllByRole("button");

// S3_AC2: the Trail screen

test("test_S3_AC2_circles_are_buttons_named_by_their_label_and_marked_when_done", async () => {
  await open("trail");
  const level = content.trailLevels[0];
  expect(circles()).toHaveLength(level?.count ?? 0);
  expect(circles()[0]).toHaveAccessibleName("Circle 1");
  await fireEvent.click(circles()[0] as HTMLElement);
  expect(circles()[0]).toHaveAccessibleName("Circle 1, done");
  expect(circles()[0]).toHaveTextContent("✓");
  expect(circles()[0]).toHaveClass("done");
  await fireEvent.click(circles()[1] as HTMLElement);
  expect(document.querySelectorAll(".board line")).toHaveLength(1);
});

test("test_S3_AC2_a_wrong_circle_gets_a_hint_and_play_goes_on", async () => {
  await open("trail");
  await fireEvent.click(circles()[2] as HTMLElement);
  expect(screen.getByText("The next one is 1.")).toBeInTheDocument();
  await fireEvent.click(circles()[0] as HTMLElement);
  expect(screen.queryByText(/The next one is/)).toBeNull();
  expect(circles()[0]).toHaveClass("done");
});

test("test_S3_AC2_every_circle_joined_ends_the_round_calmly", async () => {
  const { app } = await open("trail");
  await playTrail(true);
  expect(screen.getByText("Well done.")).toBeInTheDocument();
  for (const circle of circles()) expect(circle).toBeDisabled();
  await click("Next");
  expect(app.session?.results[0]?.right).toBe(true);
  await tick();
  await playTrail(false, 3);
  expect(screen.getByText(/All joined up/)).toBeInTheDocument();
  expect(screen.getByText("3 taps were not the next one.")).toBeInTheDocument();
  expect(screen.queryByText(/lost|game over|try harder/i)).toBeNull();
});

// S3_AC4: the Put the Steps in Order screen

test("test_S3_AC4_tapped_steps_build_a_numbered_order_that_undo_takes_back", async () => {
  await open("steps");
  expect(screen.getByTestId("task").textContent).toMatch(/\w/);
  const order = (screen.getByTestId("steps").dataset.order ?? "").split("|");
  const done = screen.getByRole("button", { name: "Done" });
  expect(done).toBeDisabled();
  expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  await click(order[0] ?? "");
  const list = within(screen.getByTestId("order")).getAllByRole("listitem");
  expect(list.map((li) => li.textContent)).toEqual([order[0]]);
  expect(screen.queryByRole("button", { name: order[0] })).toBeNull(); // placed: no longer a card
  await click("Undo");
  expect(within(screen.getByTestId("order")).queryAllByRole("listitem")).toHaveLength(0);
  expect(screen.getByRole("button", { name: order[0] })).toBeInTheDocument();
  await vi.advanceTimersByTimeAsync(600); // past the double-tap guard on that card
  for (const step of order) await click(step);
  expect(screen.getByRole("button", { name: "Done" })).toBeEnabled();
});

test("test_S3_AC4_the_right_order_says_well_done", async () => {
  const { app } = await open("steps");
  await playSteps(true);
  expect(screen.getByText("Well done.")).toBeInTheDocument();
  await click("Next");
  expect(app.session?.results[0]?.right).toBe(true);
});

test("test_S3_AC4_a_wrong_order_shows_the_right_one_numbered_and_the_extra_step_marked", async () => {
  const { app } = renderApp();
  app.profile = {
    ...(app.profile as NonNullable<typeof app.profile>),
    levels: { steps: { level: 3, streak: 0 } },
  };
  app.session = { plan: ["steps"], results: [] };
  app.go("play");
  await tick();
  const order = await playSteps(false);
  expect(screen.getByText(/The right order is numbered/)).toBeInTheDocument();
  const answer = within(screen.getByTestId("answer")).getAllByRole("listitem");
  expect(answer.map((li) => li.textContent)).toEqual(order);
  expect(screen.getByText(/Not part of this task/)).toBeInTheDocument();
  await click("See today's summary");
  expect(app.session?.results[0]?.right).toBe(false);
});

// S3_AC7: instructions written, spoken and shown

test("test_S3_AC7_trail_and_steps_start_with_instructions_spoken_and_an_example", async () => {
  for (const [game, date] of [
    ["trail", 13],
    ["steps", 14],
  ] as const) {
    const { player, unmount } = renderApp({ now: new Date(2026, 10, date, 10) });
    await click("Start");
    await playRound(() => true); // Odd One Out
    await playRound(() => true); // the memory game
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      content.strings[`game_${game}`] ?? "",
    );
    expect(player.played.at(-1)).toContain(`${game}_intro`);
    await click("Show me");
    const example = screen.getByRole("region", { name: /Example/ });
    if (game === "trail") expect(within(example).getByRole("img")).toHaveAccessibleName("1, A, 2");
    else expect(within(example).getAllByRole("listitem")).toHaveLength(3);
    unmount();
  }
});
