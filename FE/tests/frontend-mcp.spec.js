import { expect, test } from '@playwright/test';

/**
 * Final frontend E2E — driving the REAL UI against the current mock data layer.
 *
 * Written as native ESM JavaScript on purpose: the FE package is ESM
 * (`"type": "module"`) and this Playwright build cannot transpile TypeScript
 * specs under ESM (it throws `Unknown file extension ".ts"`). Node runs `.js`
 * ESM directly, so this file needs no build step. To author specs in `.ts`,
 * upgrade Playwright or add a TS ESM loader (e.g. `tsx`) — see the summary.
 *
 * IMPORTANT — how "mocking" works in this app today:
 * The frontend has no backend. All data goes through an in-memory /
 * localStorage stub (`src/shared/api/stubAdapter.ts`), NOT the network. The
 * HTTP adapter that would call `/api/**` (`src/shared/api/httpAdapter.ts`) is
 * written but deliberately NOT wired. Consequences for this test:
 *
 *   1. The interceptor matches ZERO requests from the app itself today. We
 *      still install it — (a) the first test proves the mechanism works and is
 *      ready for the real backend, and (b) the UI-driven test asserts the app
 *      makes no rogue `/api` calls (i.e. it is fully stubbed).
 *   2. To get an authenticated, non-empty starting state we SEED the stub's
 *      localStorage before the app boots (the stub starts empty by design —
 *      no seed data, per REQUIREMENTS §9).
 */

/** The stub's localStorage key + state shape (see stubAdapter.ts). */
const STUB_STORAGE_KEY = 'ticketing-system:stub:v1';

const SEED_USER = {
  id: 'u_qa_1',
  email: 'qa@example.com',
  displayName: 'Qa',
  emailVerified: true,
  // Irrelevant value: we set the session directly (`sessionUserId`) and never
  // exercise the password path.
  passwordHash: 'seed',
};

const SEED_TEAM = {
  id: 't_platform',
  name: 'Platform',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

/** A ready-to-use, authenticated stub state: one verified user, one team. */
const seededState = {
  users: [SEED_USER],
  teams: [SEED_TEAM],
  epics: [],
  tickets: [],
  comments: [],
  tokens: [],
  sessionUserId: SEED_USER.id,
};

/**
 * The mocked backend response we WOULD serve once the HTTP adapter is wired.
 * Shape matches the `Ticket` entity so a future `getTickets()` would render.
 */
const MOCK_TICKET = {
  id: 'srv_ticket_1',
  teamId: SEED_TEAM.id,
  type: 'feature',
  status: 'new',
  epicId: null,
  title: 'Server-mocked ticket',
  body: 'Returned by the Playwright /api interceptor.',
  createdBy: SEED_USER.id,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

/**
 * Matches only real backend calls: an `/api/` path segment immediately after
 * the host (e.g. http://localhost:5173/api/tickets).
 *
 * GOTCHA: the naive glob `**​/api/**` ALSO matches Vite's dev source-module
 * URLs like http://localhost:5173/src/shared/api/index.ts (their path contains
 * "/api/"). Fulfilling that with JSON breaks the app bundle and nothing mounts.
 * Anchoring to `//host/api/` avoids intercepting source files.
 */
const API_URL = /\/\/[^/]+\/api\//;

/** Install the API interceptor and seed the stub, before each test. */
async function setupPage(page, onApiHit) {
  // (1) Network interception for the (future) mock API. Every `/api/*` call
  //     is fulfilled locally with our mock payload — no real server needed.
  await page.route(API_URL, (route) => {
    if (onApiHit) onApiHit(route);
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([MOCK_TICKET]),
    });
  });

  // (2) Seed the stub BEFORE any app script runs, so the session + team exist
  //     the moment React mounts.
  await page.addInitScript(
    ([key, state]) => {
      window.localStorage.setItem(key, state);
    },
    [STUB_STORAGE_KEY, JSON.stringify(seededState)],
  );
}

test.describe('Ticketing System — frontend E2E (stub-backed)', () => {
  test('interceptor fulfills /api/** with a mocked response (backend-ready)', async ({
    page,
  }) => {
    await setupPage(page);
    await page.goto('/board');

    // Prove the mechanism: a fetch to /api/** is caught and served our mock,
    // never touching a real server. This is exactly what will drive the UI
    // once the app is switched from the stub to the HTTP adapter.
    const payload = await page.evaluate(async () => {
      const response = await fetch('/api/tickets');
      return response.json();
    });

    expect(Array.isArray(payload)).toBe(true);
    expect(payload[0]).toMatchObject({
      id: 'srv_ticket_1',
      title: 'Server-mocked ticket',
    });
  });

  test('user creates a ticket and sees it appear on the board', async ({
    page,
  }) => {
    // Guard: record any /api hit so we can assert the app is fully client-side.
    const apiHits = [];
    await setupPage(page, (route) => apiHits.push(route.request().url()));

    await page.goto('/board');

    // Authenticated shell is visible (RequireAuth passed via the seeded session).
    await expect(
      page.getByRole('button', { name: /qa@example\.com/ }),
    ).toBeVisible();
    // The board toolbar shows the seeded team and the create action.
    await expect(page.getByLabel('Team')).toHaveValue(SEED_TEAM.id);
    await expect(page.getByText(/no tickets yet/i)).toBeVisible();

    // --- User action: open the "New ticket" dialog and fill the form. ---
    await page.getByRole('button', { name: '+ New ticket' }).click();

    const dialog = page.getByRole('dialog', { name: 'New ticket' });
    await expect(dialog).toBeVisible();

    const ticketTitle = 'E2E smoke ticket';
    await dialog.getByLabel('Type').selectOption('feature');
    await dialog.getByLabel('Title').fill(ticketTitle);
    await dialog.getByLabel('Body').fill('Created by the Playwright E2E run.');
    await dialog.getByRole('button', { name: 'Create ticket' }).click();

    // --- Assert the UI updated: dialog closed, card is on the board. ---
    await expect(dialog).toBeHidden();
    await expect(page.getByText(/no tickets yet/i)).toBeHidden();

    // New tickets start in the "New" column (INITIAL_STATUS) and show as a card.
    await expect(
      page.getByRole('heading', { name: ticketTitle }),
    ).toBeVisible();

    // The whole flow ran WITHOUT any /api network call — proving the app is
    // still fully stub-backed today. (This assertion will need revisiting once
    // the HTTP adapter is wired; that is the intended signal.)
    expect(
      apiHits,
      `unexpected /api calls: ${apiHits.join(', ')}`,
    ).toHaveLength(0);
  });
});
