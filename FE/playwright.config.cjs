// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright E2E config.
 *
 * NOTE: this is a `.cjs` file on purpose. The FE package is ESM
 * (`"type": "module"`), and this Playwright build cannot transpile a `.ts`
 * CONFIG file under ESM (it throws `Unknown file extension ".ts"`). Spec files
 * stay `.ts` — those go through Playwright's own transform pipeline and work.
 *
 * The app has NO backend — the data layer is an in-memory / localStorage stub
 * (`src/shared/api/stubAdapter.ts`), so the only thing to serve is the Vite dev
 * server. Playwright starts (or reuses) `npm run dev` on the default Vite port.
 */
const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

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
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
