/** The screens: the first visit, the home, both games, instructions, settings and the summary. */

import { fireEvent, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { newProfile } from "../src/core/profile";
import { content } from "../src/ui/content";
import { renderApp } from "./helpers";
import { click, playOdd, playRound, playShopping } from "./play";

const word = new Map(content.items.map((item) => [item.word, item.id]));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.documentElement.removeAttribute("data-text-size");
  document.documentElement.removeAttribute("data-contrast");
});

test("test_S1_AC1_the_first_visit_asks_only_for_a_first_name", async () => {
  const { app, store } = renderApp({ profile: null });
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Welcome");
  expect(screen.getAllByRole("textbox")).toHaveLength(1);

  await fireEvent.input(screen.getByLabelText("Your first name"), { target: { value: "42" } });
  await click("Continue");
  expect(screen.getByText(/letters only/)).toBeInTheDocument();
  expect(app.profile).toBeNull();

  await fireEvent.input(screen.getByLabelText("Your first name"), { target: { value: " Rosa " } });
  await click("Continue");
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hello, Rosa");
  expect(store.getItem("mindkeep:profile")).toContain('"name":"Rosa"');
});

test("test_S1_AC3_the_home_shows_todays_session_and_marks_it_done", async () => {
  renderApp();
  expect(screen.getByRole("heading", { name: "Today's session" })).toBeInTheDocument();
  expect(screen.getByText("Shopping List")).toBeInTheDocument();
  expect(screen.getByText("Odd One Out")).toBeInTheDocument();
  expect(screen.queryByTestId("done-today")).toBeNull();
  expect(screen.queryByText(/streak/i)).toBeNull();

  await click("Start");
  for (let round = 0; round < 9; round++) await playRound(() => true);
  await click("Home");
  expect(screen.getByTestId("done-today")).toHaveTextContent("Done today");
  expect(screen.getByRole("button", { name: "Play again" })).toBeInTheDocument();
});

test("test_S1_AC4_shopping_list_waits_for_ready_pauses_then_offers_the_choices", async () => {
  const { app } = renderApp();
  await click("Start");
  await click("Start");
  await vi.advanceTimersByTimeAsync(60_000); // no clock: the list stays until Ready
  expect(screen.getByTestId("list")).toBeInTheDocument();

  await click("Ready");
  expect(screen.getByText("Get ready…")).toBeInTheDocument();
  await vi.runAllTimersAsync();
  await tick();
  const choices = within(screen.getByTestId("choices")).getAllByRole("button");
  expect(choices).toHaveLength(content.shoppingLevels[0]?.choices ?? 0);
  expect(screen.getByRole("button", { name: "Done" })).toBeDisabled();

  await fireEvent.click(choices[0] as HTMLElement);
  expect(choices[0]).toHaveAttribute("aria-pressed", "true");
  await fireEvent.click(choices[0] as HTMLElement); // a shaky double tap: still picked
  expect(choices[0]).toHaveAttribute("aria-pressed", "true");
  await vi.advanceTimersByTimeAsync(1000);
  await fireEvent.click(choices[0] as HTMLElement); // a real second tap: unpicked
  expect(choices[0]).toHaveAttribute("aria-pressed", "false");
  expect(app.voice).toBeDefined();
});

test("test_S1_AC7_a_wrong_answer_shows_the_right_one_calmly_and_the_session_goes_on", async () => {
  const { app } = renderApp();
  await click("Start");
  await click("Start");
  const listed = await playShopping(false);
  expect(screen.getByText(/Not quite/)).toBeInTheDocument();
  for (const item of listed) {
    const tile = within(screen.getByTestId("choices"))
      .getAllByRole("button")
      .find((b) => b.textContent?.includes(item));
    expect(tile).toHaveTextContent("On the list");
    expect(tile).toBeDisabled();
  }
  expect(word.size).toBeGreaterThan(0);
  await click(/^(Next|See today's summary)$/);
  await click("Start"); // the intro of the next game
  const { cells, odd } = await playOdd(false);
  expect(screen.getByText(/The different one is marked/)).toBeInTheDocument();
  expect(cells[odd]).toHaveClass("odd");
  await click(/^(Next|See today's summary)$/);
  expect(app.session?.results.map((r) => r.right)).toEqual([false, false]);
  expect(screen.queryByText(/lost|game over|try harder/i)).toBeNull();
});

test("test_S1_AC8_instructions_are_written_and_spoken_and_can_be_heard_again", async () => {
  const { player } = renderApp();
  await click("Start");
  expect(screen.getByText(content.prompts.shopping_intro?.spoken ?? "")).toBeInTheDocument();
  expect(player.played).toHaveLength(1);
  expect(player.played[0]).toContain("shopping_intro");
  await click(/Listen/);
  expect(player.played).toHaveLength(2);
});

test("test_S1_AC8_show_me_marks_the_answer_of_an_example", async () => {
  renderApp();
  await click("Start");
  await click("Show me");
  expect(screen.getByRole("region", { name: /Example/ })).toBeInTheDocument();
  expect(screen.getAllByText(/On the list/)).toHaveLength(2);
  await click("Show me");
  expect(screen.queryByRole("region", { name: /Example/ })).toBeNull();
});

test("test_S1_AC8_with_the_voice_off_nothing_is_said_and_the_text_stays", async () => {
  const profile = newProfile("Rosa");
  profile.settings.voice = false;
  const { player } = renderApp({ profile });
  await click("Start");
  await click(/Listen/);
  expect(player.played).toEqual([]);
  expect(screen.getByText(content.prompts.shopping_intro?.spoken ?? "")).toBeInTheDocument();
});

test("test_S1_AC9_the_summary_shows_today_against_the_users_last_time", async () => {
  const profile = newProfile("Rosa");
  profile.levels = { shopping: { level: 2, streak: 0 }, odd: { level: 3, streak: 2 } };
  profile.history = [
    {
      date: "2026-11-12",
      games: {
        shopping: { rounds: 3, right: 2, level: 2 },
        odd: { rounds: 3, right: 3, level: 3 },
      },
    },
  ];
  renderApp({ profile });
  await click("Start");
  for (let round = 0; round < 9; round++) await playRound((game) => game !== "shopping");
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Today's summary");
  const shopping = screen.getByTestId("summary-shopping");
  expect(shopping).toHaveTextContent("0 of 3 right");
  expect(shopping).toHaveTextContent("Level 1 · Level 2 last time");
  const odd = screen.getByTestId("summary-odd");
  expect(odd).toHaveTextContent("3 of 3 right");
  expect(odd).toHaveTextContent("Level 4 · Up from level 3 last time");
});

test("test_S1_AC9_a_first_session_is_called_a_good_start", async () => {
  renderApp();
  await click("Start");
  for (let round = 0; round < 9; round++) await playRound(() => true);
  expect(screen.getByTestId("summary-odd")).toHaveTextContent("Level 2 · Your first time");
  expect(screen.getByTestId("summary-shopping")).toHaveTextContent("Level 2 · Your first time");
});

test("test_S1_AC10_every_control_is_a_real_button_with_a_name", async () => {
  renderApp();
  await click("Start");
  await click("Start");
  await click("Ready");
  await vi.runAllTimersAsync();
  await tick();
  for (const button of screen.getAllByRole("button")) {
    expect(button.tagName).toBe("BUTTON");
    expect(button.textContent?.trim() || button.getAttribute("aria-label")).toBeTruthy();
  }
  expect(document.querySelectorAll("[onclick], div[role=button], span[role=button]")).toHaveLength(
    0,
  );
});

test("test_S1_AC10_each_screen_puts_the_focus_on_its_title", async () => {
  renderApp();
  expect(document.activeElement).toBe(screen.getByRole("heading", { level: 1 }));
  await click("Settings");
  expect(document.activeElement).toHaveTextContent("Settings");
});

test("test_S1_AC11_settings_change_the_text_size_contrast_and_voice_and_are_saved", async () => {
  const { app, player } = renderApp();
  const root = document.documentElement;
  expect(root.dataset.textSize).toBe("normal");
  await click("Settings");
  await click("Larger");
  expect(root.dataset.textSize).toBe("larger");
  expect(screen.getByRole("button", { name: "Larger" })).toHaveAttribute("aria-pressed", "true");

  const [contrastOn] = within(
    screen.getByRole("heading", { name: "High contrast" }).parentElement as HTMLElement,
  ).getAllByRole("button");
  await fireEvent.click(contrastOn as HTMLElement);
  expect(root.dataset.contrast).toBe("high");

  const [, voiceOff] = within(
    screen.getByRole("heading", { name: "Spoken instructions" }).parentElement as HTMLElement,
  ).getAllByRole("button");
  await fireEvent.click(voiceOff as HTMLElement);
  expect(player.stops).toBeGreaterThan(0);
  expect(app.profile?.settings).toEqual({ textSize: "larger", voice: false, contrast: true });
  await click("Back");
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hello, Rosa");
});
