---
name: backend
description: Always-on rules for the Express + Drizzle API. Auto-loads when touching files under BE/.
paths:
  - "BE/**"
---

# Backend rules

Supplement the root [PROJECT_RULES.md](../../PROJECT_RULES.md) and
[docs/REQUIREMENTS.md](../../docs/REQUIREMENTS.md); on conflict, those win.

## Stack

Express 5 · Drizzle ORM (Postgres, `pg`) · express-session + connect-pg-simple ·
argon2 · nodemailer · zod. Node ≥ 18.18. TypeScript strict.

## Module architecture

Each domain lives in `BE/src/modules/<name>/` as three factory functions returning
closures (no classes, no `this`):

- `<name>.repo.ts` — `create<Name>Repository(db)` — the only place that touches
  Drizzle / SQL for that domain.
- `<name>.service.ts` — `create<Name>Service({ repo, ...deps })` — business rules,
  dependencies injected (repo, other repos, mailer).
- `<name>.routes.ts` — `create<Name>Router(service)` — Express router; parses input
  with **zod**, maps domain errors to HTTP status, returns JSON.

Wire new routers in `BE/src/http/routes.ts`. Mount **above** `requireAuth` only for
public endpoints (sign-up, login, verify, resend); everything else mounts below.

Adding or changing an endpoint? Invoke the `/api-module` skill.

## Security & data (non-negotiable — REQUIREMENTS §3/§9/§11)

- Passwords hashed with **argon2id**, min 8 chars — never stored or logged in clear.
- **Backend validation is authoritative** — validate every enum/reference server-side
  with zod even if the client checked.
- **Auth-gate everything** except sign-up, login, email verification, resend, health.
- Never put session IDs / tokens in URLs (single-use email-verification token is the
  one exception). No secrets in source — read from `BE/src/config/env.ts`.
- Timestamps server-set in **UTC**, serialized **ISO-8601**.

## Migrations

Never hand-edit committed migrations — see [migrations.md](migrations.md) (enforced by
the migration-guard hook).

## Tests

Vitest. Flow tests in `BE/tests/flows/` (need a test DB — `tests/testDb.ts`,
`globalSetup.ts`); unit tests next to code. `cd BE && npm test`. Must pass
`npm run lint` and `npm run format:check`.
