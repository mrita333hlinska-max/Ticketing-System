---
name: testing
description: How we write tests in both apps. Auto-loads when touching any test file.
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "BE/tests/**"
  - "FE/src/test/**"
---

# Testing — how

The coverage bar (*what* must be tested) is in
[PROJECT_RULES.md](../../PROJECT_RULES.md) §2 (Testing) and REQUIREMENTS §11 — at
minimum one full backend flow and one frontend/API flow, plus the fixed 5-state
workflow rules. This file is the *how*.

- **Test behavior, not implementation** — assert outputs and rendered results; query by
  role/text (Testing Library), not CSS class or private internals.
- **Location:** unit/component tests sit next to the code as `*.test.ts(x)`;
  cross-cutting backend flow tests live in `BE/tests/flows/`.
- **Isolate the seams:** no real network, SMTP, or clock. The FE stubs the `TicketApi`
  adapter; BE flow tests use the test-DB harness (`BE/tests/testDb.ts`,
  `globalSetup.ts`) — never the dev/prod database. Each test sets up and tears down its
  own data and is order-independent.
- **Run:** `cd FE && npm test` · `cd BE && npm test` (needs Postgres). A change isn't
  done until the relevant suite plus `npm run lint` pass.
