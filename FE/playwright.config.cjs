// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright E2E config.
 *
 * NOTE: this is a `.cjs` file on purpose. The FE package is ESM
 * (`"type": "module"`), and this Playwright build cannot transpile a `.ts`
 * CONFIG file under ESM (it throws `Unknown file extension ".ts"`).
 *
 * E2E runs against the full stack served by nginx at :8080 (start it with
 * `docker compose up --build`), so the app talks to the real backend over
 * `/api`. Bring the stack up before running Playwright.
 */
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:8080';

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
