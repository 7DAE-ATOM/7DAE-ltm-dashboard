import { defineConfig, devices } from "@playwright/test";

/**
 * Starts `npm run dev` itself before the run (and reuses an already-running
 * one locally) — see https://playwright.dev/docs/test-webserver. CI always
 * boots a fresh server so a stale build never masks a regression.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3002",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3002",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
