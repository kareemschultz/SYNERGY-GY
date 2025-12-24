import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry once locally to handle flaky tests
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  // Give tests more time to complete
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "on",
    video: "on",
    ignoreHTTPSErrors: true,
    // Clear storage state between tests for better isolation
    storageState: undefined,
    // Action timeout
    actionTimeout: 15_000,
    // Navigation timeout
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Add launch args to help with network stability
        launchOptions: {
          args: [
            "--disable-dev-shm-usage",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--dns-prefetch-disable",
            "--disable-features=IsolateOrigins,site-per-process",
          ],
        },
      },
    },
  ],
});
