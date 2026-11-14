/** S1_AC15, S2_AC9 and S3_AC8: the sandbox demo. It plays whole sessions in a real browser (a fresh
 * profile each time, on fixed days, since the games rotate by day) and saves a picture of every
 * screen at desktop size (1280×800) and phone size (390×844) to .sandbox/screens/, or to the
 * folder in $SCREENS. */

import { expect, type Page, test } from "@playwright/test";

const OUT = process.env.SCREENS ?? ".sandbox/screens";
const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };
let shot = 0;

async function capture(page: Page, name: string) {
  shot += 1;
  const prefix = String(shot).padStart(2, "0");
  await page.screenshot({ path: `${OUT}/${prefix}-${name}-desktop.png`, fullPage: true });
  await page.setViewportSize(PHONE);
  // Let the page lay out at the new size first, or a full-page shot repeats its top.
  await page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => setTimeout(done, 50))),
  );
  await page.screenshot({ path: `${OUT}/${prefix}-${name}-phone.png`, fullPage: true });
  await page.setViewportSize(DESKTOP);
}

async function playShopping(page: Page, round: number) {
  const listed = (await page.getByTestId("list").getByRole("listitem").allTextContents()).map((t) =>
    t.trim(),
  );
  await capture(page, `shopping-list-${round}`);
  await page.getByRole("button", { name: "Ready" }).click();
  await expect(page.getByTestId("choices")).toBeVisible({ timeout: 10_000 });
  for (const item of listed) {
    await page.getByTestId("choices").getByRole("button", { name: item, exact: false }).click();
  }
  await capture(page, `shopping-pick-${round}`);
  await page.getByRole("button", { name: "Done" }).click();
}

async function playPairs(page: Page, round: number) {
  const cards = page.getByTestId("cards").getByRole("button");
  const ids = await cards.evaluateAll((buttons) => buttons.map((b) => b.getAttribute("data-card")));
  await capture(page, `pairs-${round}`);
  const other = ids.findIndex((id) => id !== ids[0]);
  await cards.nth(0).click();
  await cards.nth(other).click();
  await capture(page, `pairs-mismatch-${round}`);
  await page.waitForTimeout(1600);
  for (const id of new Set(ids)) {
    await cards.nth(ids.indexOf(id)).click();
    await cards.nth(ids.lastIndexOf(id)).click();
    await page.waitForTimeout(600);
  }
}

async function playSequences(page: Page, round: number, right: boolean) {
  const grid = page.getByTestId("tiles");
  const order = ((await grid.getAttribute("data-order")) ?? "").split(" ").map(Number);
  await capture(page, `sequences-${round}`);
  await page.getByRole("button", { name: "Watch" }).click();
  await expect(grid.locator(".lit")).toHaveCount(1);
  await capture(page, `sequences-lit-${round}`);
  const tiles = grid.getByRole("button");
  await expect(tiles.first()).toBeEnabled({ timeout: 15_000 });
  const taps = right ? order : [order[0] === 0 ? 1 : 0];
  for (const tile of taps) {
    await page.waitForTimeout(550);
    await tiles.nth(tile as number).click();
  }
}

async function playTrail(page: Page, round: number, right: boolean) {
  const board = page.getByTestId("trail");
  const labels = ((await board.getAttribute("data-labels")) ?? "").split(" ");
  const circles = board.getByRole("button");
  await capture(page, `trail-${round}`);
  if (!right) {
    await circles.nth(labels.length - 1).click();
    await capture(page, `trail-hint-${round}`);
  }
  for (let i = 0; i < labels.length; i++) {
    await circles.nth(i).click();
    if (i === Math.floor(labels.length / 2)) await capture(page, `trail-half-${round}`);
  }
}

async function playSteps(page: Page, round: number, right: boolean) {
  const order = ((await page.getByTestId("steps").getAttribute("data-order")) ?? "").split("|");
  await capture(page, `steps-${round}`);
  const taps = right ? order : [order[1], order[0], ...order.slice(2)];
  for (const [i, step] of taps.entries()) {
    await page.getByTestId("steps").getByRole("button", { name: step, exact: true }).click();
    if (i === 1) await capture(page, `steps-half-${round}`);
  }
  await page.getByRole("button", { name: "Done" }).click();
}

/** Play the session on screen (Show me on each intro) until today's summary. */
async function playSession(page: Page, day: string, wrongRound: number) {
  await page.getByRole("button", { name: /^(Start|Play again)$/ }).click();
  for (let round = 1; ; round++) {
    if (await page.getByRole("button", { name: "Show me" }).isVisible()) {
      await page.getByRole("button", { name: "Show me" }).click();
      await capture(page, `${day}-intro-${round}`);
      await page.getByRole("button", { name: "Start" }).click();
    }
    const name = `${day}-${round}`;
    if (await page.getByTestId("list").isVisible()) await playShopping(page, round);
    else if (await page.getByTestId("cards").isVisible()) await playPairs(page, round);
    else if (await page.getByTestId("tiles").isVisible())
      await playSequences(page, round, round !== wrongRound);
    else if (await page.getByTestId("trail").isVisible())
      await playTrail(page, round, round !== wrongRound);
    else if (await page.getByTestId("steps").isVisible())
      await playSteps(page, round, round !== wrongRound);
    else await playOdd(page, round, round !== wrongRound);
    await capture(page, `${name}-feedback`);
    const next = page.getByRole("button", { name: /^(Next|See today's summary)$/ });
    const last = (await next.textContent()) === "See today's summary";
    await next.click();
    if (last) break;
  }
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Today's summary");
  await capture(page, `${day}-summary`);
}

async function playOdd(page: Page, round: number, right: boolean) {
  const cells = page.getByTestId("grid").getByRole("button");
  const kinds = await cells.evaluateAll((buttons) =>
    buttons.map((b) => b.getAttribute("data-figure")),
  );
  const odd = kinds.findIndex((k) => kinds.filter((other) => other === k).length === 1);
  await capture(page, `odd-${round}`);
  await cells.nth(right ? odd : (odd + 1) % kinds.length).click();
}

test("test_S1_AC15_the_demo_plays_a_whole_session_and_saves_every_screen", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 15, 10)); // Shopping, Odd One Out, Trail
  await page.setViewportSize(DESKTOP);
  await page.goto("/");
  await capture(page, "welcome");
  await page.getByLabel("Your first name").fill("Rosa");
  await page.getByRole("button", { name: "Continue" }).click();
  await capture(page, "home");
  await playSession(page, "day1", 4);

  await page.getByRole("button", { name: "Home" }).click();
  await expect(page.getByTestId("done-today")).toBeVisible();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Larger" }).click();
  await page
    .locator("section", { hasText: "High contrast" })
    .getByRole("button", { name: "On" })
    .click();
  await capture(page, "settings");
  await page.getByRole("button", { name: "Back" }).click();
  await capture(page, "home-larger-contrast");
});

async function newProfile(page: Page, date: Date) {
  await page.clock.setFixedTime(date);
  await page.setViewportSize(DESKTOP);
  await page.goto("/");
  await page.getByLabel("Your first name").fill("Rosa");
  await page.getByRole("button", { name: "Continue" }).click();
}

/** The next day: back home, then today's session. */
async function nextDay(page: Page, date: Date, name: string, wrongRound: number) {
  await page.clock.setFixedTime(date);
  await page.getByRole("button", { name: "Home" }).click();
  await capture(page, `${name}-home`);
  await playSession(page, name, wrongRound);
}

test("test_S2_AC9_the_demo_plays_the_days_with_pairs_and_sequences", async ({ page }) => {
  await newProfile(page, new Date(2026, 10, 13, 10)); // Odd One Out, Pairs, Trail
  await playSession(page, "pairs-day", 3);
  await nextDay(page, new Date(2026, 10, 14, 10), "sequences-day", 2); // … Sequences, Steps
});

test("test_S3_AC8_the_demo_plays_the_days_with_trail_and_steps", async ({ page }) => {
  await newProfile(page, new Date(2026, 10, 12, 10)); // Shopping, Odd One Out, Steps
  await playSession(page, "steps-day", 3);
  await nextDay(page, new Date(2026, 10, 17, 10), "trail-day", 3); // Odd, Sequences, Trail
});
