# E2E tests (Playwright)

End-to-end tests that drive the **real UI in a real browser**. They live here,
separate from the Vitest unit tests under `src/`.

- **Run:** `npm run test:e2e` (from `FE/`)
- **View last report:** `npm run test:e2e:report` → opens `playwright-report/`
- **Config:** [`../playwright.config.cjs`](../playwright.config.cjs)
- **Spec:** [`frontend-mcp.spec.js`](frontend-mcp.spec.js)

Playwright starts (or reuses) the Vite dev server on `:5173` automatically.

---

## How "mocking" works today — read this first

The frontend has **no backend**. All data goes through an in-memory /
localStorage **stub** ([`src/shared/api/stubAdapter.ts`](../src/shared/api/stubAdapter.ts)),
wired in [`src/shared/api/index.ts`](../src/shared/api/index.ts) via
`createStubApi`. The HTTP adapter that would call `/api/**`
([`src/shared/api/httpAdapter.ts`](../src/shared/api/httpAdapter.ts)) is written
but **deliberately not wired**.

Consequences the tests are built around:

1. **`page.route(...)` intercepts none of the app's own requests today** — there
   are no `/api` network calls. We still install the interceptor for two reasons:
   - one test proves the interception mechanism works and is ready for the real
     backend;
   - the UI-driven test **asserts zero `/api` calls happen**, proving the app is
     still fully client-side.
2. **State is seeded via localStorage**, not the network. Before the app boots,
   `page.addInitScript` writes a ready-made stub state (a verified user + a team
   + an active session) under the key `ticketing-system:stub:v1`. The stub
   starts empty by design (no seed data — REQUIREMENTS §9), so tests create
   their own starting point.

---

## ⭐ When the real backend lands

This is the migration checklist. Do these in order:

1. **Flip the barrel** in [`src/shared/api/index.ts`](../src/shared/api/index.ts):
   swap `createStubApi(browserStorage)` for `createHttpAdapter()`. Per the
   architecture this is a one-line change with no UI edits.
2. **The UI test's "zero `/api` calls" guard will start failing — by design.**
   That failure is the signal that the app now talks to the network. At that
   point:
   - Remove the `expect(apiHits).toHaveLength(0)` assertion.
   - Convert the interceptor stubs from a passive safety-net into the **actual
     driving mock for the UI**: fulfill `GET /api/tickets`, `POST /api/tickets`,
     `/api/auth/*`, etc. with realistic payloads, and assert the UI renders them.
   - Replace the localStorage seeding with either seeded API responses (mocked)
     or a real test database/fixtures (integration).
3. **Point the config at the right server** if the backend runs separately from
   Vite (update `webServer` / `baseURL` in `playwright.config.cjs`).

---

## Gotchas we already hit (so you don't have to)

- **TypeScript specs don't run under ESM in this Playwright build.** The FE
  package is ESM (`"type": "module"`), and this Playwright build throws
  `Unknown file extension ".ts"` for both the config and specs. Workarounds in
  use: the config is `.cjs`, and the spec is native ESM `.js`. To author specs
  in `.ts`, upgrade Playwright or add a TS ESM loader (e.g. `tsx`).

- **Don't intercept with the naive glob `**/api/**`.** It also matches Vite's
  dev **source-module** URLs like `http://localhost:5173/src/shared/api/index.ts`
  (their path contains `/api/`). Fulfilling that with JSON breaks the app bundle
  and nothing mounts. Anchor to the host instead — the spec uses
  `const API_URL = /\/\/[^/]+\/api\//;` which matches `//host/api/...` only.

- **Vitest vs Playwright collision.** Vitest's default glob would collect
  `tests/*.spec.js` and choke on `test.describe`. Vitest is scoped to
  `src/**/*.{test,spec}.{ts,tsx}` in [`../vite.config.ts`](../vite.config.ts);
  keep E2E specs under `tests/` and unit tests under `src/`.
