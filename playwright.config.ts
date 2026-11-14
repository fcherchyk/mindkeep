import { defineConfig } from "@playwright/test";

/** The sandbox demo: plays a full session in a real browser and saves a picture of each screen.
 * Locally it uses the installed Chrome; set PW_CHROMIUM=1 to use Playwright's own Chromium (CI). */
export default defineConfig({
  testDir: "tests/e2e",
  outputDir: ".sandbox/test-results",
  reporter: "list",
  timeout: 360_000, // a demo plays whole sessions, a picture at two sizes per screen (3 min
  // on a slow machine)
  use: {
    baseURL: "http://localhost:4173",
    channel: process.env.PW_CHROMIUM ? undefined : "chrome",
  },
  webServer: { command: "pnpm build && pnpm preview --port 4173 --strictPort", port: 4173 },
});
