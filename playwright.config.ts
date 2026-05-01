import { defineConfig, devices } from "@playwright/test";

const DEFAULT_E2E_ORIGIN = "http://127.0.0.1:3127";
const baseURL = process.env.PLAYWRIGHT_BASE_URL || DEFAULT_E2E_ORIGIN;
const baseUrlConfig = new URL(baseURL);
const webServerHostname = baseUrlConfig.hostname;
const webServerPort = baseUrlConfig.port || (baseUrlConfig.protocol === "https:" ? "443" : "80");
const startWebServer = process.env.PLAYWRIGHT_START_SERVER !== "false";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  outputDir: "test-results/playwright",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  webServer: startWebServer
    ? {
        command: `npm run dev -- --hostname ${webServerHostname} --port ${webServerPort}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || baseURL,
          LOCAL_AUTOMATION_AUTH_ENABLED: process.env.LOCAL_AUTOMATION_AUTH_ENABLED || "true",
          NEXT_PUBLIC_APP_BASE_URL: process.env.NEXT_PUBLIC_APP_BASE_URL || baseURL,
          PORT: process.env.PORT || webServerPort,
        },
      }
    : undefined,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
