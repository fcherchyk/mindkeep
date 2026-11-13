/** Render public/icons/icon.svg to the PNG sizes the web app manifest asks for (192 and 512).
 *
 *     node scripts/make_icons.ts
 *
 * It uses Playwright with the installed Chrome, so no image library is needed. */
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const svg = readFileSync(new URL("../public/icons/icon.svg", import.meta.url), "utf8");
const browser = await chromium.launch({ channel: "chrome" });
for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<body style="margin:0">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body>`,
  );
  await page.screenshot({ path: `public/icons/icon-${size}.png`, omitBackground: true });
  await page.close();
}
await browser.close();
