---
name: api-module
description: >-
  Add or change a backend API endpoint the way this repo does it — a repo/service/routes
  module of factory functions with zod validation and requireAuth wiring. Use before
  creating a new BE domain module or adding a route to an existing one under BE/src/modules/.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Add a backend API module

The BE is organized by **domain module** under `BE/src/modules/<name>/`. Each module is
three factory functions (no classes, no `this`) wired together in
`BE/src/http/routes.ts`. Follow the existing modules (`auth`, `teams`, `epics`,
`tickets`, `comments`, `users`) — read the closest one before writing.

## Steps

1. **Read a sibling module first.** Open the nearest existing module (e.g.
   `BE/src/modules/teams/`) and mirror its structure, naming, and error handling. Reuse
   before inventing.

2. **Repository — `<name>.repo.ts`.** Export `create<Name>Repository(db)` returning an
   object of query functions. This is the **only** place that touches Drizzle / SQL for
   the domain. Return domain shapes, not raw rows where they differ.

3. **Service — `<name>.service.ts`.** Export `create<Name>Service({ repo, ...deps })`.
   Put business rules here. Dependencies (its repo, other repos, the mailer) come in by
   injection — never import `db` here. Throw the shared domain errors from
   `BE/src/lib/errors.ts` for not-found / conflict / forbidden.

4. **Routes — `<name>.routes.ts`.** Export `create<Name>Router(service)` returning an
   Express `Router`. Parse every input (params, query, body) with a **zod** schema —
   backend validation is authoritative. Map domain errors to HTTP status; return JSON.
   Never trust client-side enum/reference checks.

5. **Wire it up in `BE/src/http/routes.ts`.** Instantiate repo → service → router and
   `api.use('/<name>', ...)`. Public routes (sign-up, login, verify, resend) mount
   **above** `requireAuth`; everything else mounts **below** it. Respect the ordering
   comment at the top of the file.

6. **Validate.** `cd BE && npm run lint && npm test`. Add/extend a flow test in
   `BE/tests/flows/` when the endpoint is part of a business flow.

## Guardrails

- Argon2id for passwords; never log secrets or tokens. No tokens in URLs (email-verify
  token excepted).
- Timestamps server-set, UTC, ISO-8601.
- Schema changes are a **new** migration — see the `/migrations` rules; never edit a
  committed migration.
