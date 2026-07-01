# E2E tests (Playwright)

End-to-end tests drive the **real UI in a real browser against the running
full stack** (frontend + backend + database). They live here, separate from the
Vitest unit tests under `src/`.

## Running

Start the whole stack first, then run Playwright against it:

```bash
docker compose up --build     # from the repo root — app on http://localhost:8080
cd FE && npm run test:e2e     # Playwright targets http://localhost:8080
```

- **View last report:** `npm run test:e2e:report`
- **Config:** [`../playwright.config.cjs`](../playwright.config.cjs) (`baseURL` →
  `http://localhost:8080`; assumes the stack is already up).

There is no stub or mock: the app always talks to the real backend over `/api`
(nginx-proxied). Seed test data through the API or UI, exactly as a user would.

> No `*.spec.js` files are checked in yet — add them here. Author specs as native
> ESM `.js` (this Playwright build can't load `.ts` config/specs under ESM).
