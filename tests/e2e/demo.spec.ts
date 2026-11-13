/** S1_AC15: the sandbox demo. It plays a whole session in a real browser (a fresh profile each
 * time) and saves a picture of every screen at desktop size (1280×800) and phone size (390×844)
 * to .sandbox/screens/, or to the folder in $SCREENS. */

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
  await page.setViewportSize(DESKTOP);
  await page.goto("/");
  await capture(page, "welcome");
  await page.getByLabel("Your first name").fill("Rosa");
  await page.getByRole("button", { name: "Continue" }).click();
  await capture(page, "home");

  await page.getByRole("button", { name: "Start" }).click();
  for (let round = 1; round <= 6; round++) {
    if (await page.getByRole("button", { name: "Show me" }).isVisible()) {
      await page.getByRole("button", { name: "Show me" }).click();
      await capture(page, `intro-${round}`);
      await page.getByRole("button", { name: "Start" }).click();
    }
    if (await page.getByTestId("list").isVisible()) await playShopping(page, round);
    else await playOdd(page, round, round !== 4);
    await capture(page, `feedback-${round}`);
    await page.getByRole("button", { name: /^(Next|See today's summary)$/ }).click();
  }
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Today's summary");
  await capture(page, "summary");

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
