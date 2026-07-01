---
name: testing
description: Test conventions for both apps. Auto-loads when touching any test file.
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "BE/tests/**"
  - "FE/src/test/**"
---

# Testing rules

Vitest in both apps. Tests exist to protect **core behavior**, not to chase coverage
numbers.

## What to test (REQUIREMENTS §11 minimum bar)

- At least **one full backend business flow** — e.g. `BE/tests/flows/auth-to-ticket.test.ts`
  (sign-up → verify → authenticate → create a ticket).
- At least **one frontend / API flow** — the service layer + a key component/hook.
- The **fixed 5-state workflow rules** and any state-transition logic.

## Conventions

- Unit/component tests live **next to the code** as `*.test.ts(x)`. Cross-cutting
  backend flow tests live in `BE/tests/flows/`.
- **Test behavior, not implementation** — assert on outputs and rendered results, not
  private internals. Query by role/text (Testing Library), not by CSS class.
- Backend flow tests use the **test DB** harness (`BE/tests/testDb.ts`,
  `globalSetup.ts`) — never the dev/prod database.
- No real network, SMTP, or clock in tests — stub the seams (the `TicketApi` adapter on
  FE, the mailer on BE). Timestamps are asserted as ISO-8601 UTC.
- Each test is independent and order-free — set up and tear down its own data.

## Running

- FE: `cd FE && npm test` (or `npx vitest run <path>`; `npm run test:watch` to watch).
- BE: `cd BE && npm test` (needs Postgres for the test DB; `npm run test:watch` to watch).
- A change is not "done" until the relevant suite plus `npm run lint` pass.
