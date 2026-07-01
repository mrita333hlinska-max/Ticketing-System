# Backend Implementation Roadmap

Phased build plan for the **backend** (API + RDBMS), aligned to
[REQUIREMENTS.md](REQUIREMENTS.md) (what), [PROJECT_RULES.md](../PROJECT_RULES.md)
(how), and [design/](design/) (looks). The frontend roadmap lives in
[ROADMAP.md](ROADMAP.md); its final phase wires the two together.

> **The API contract already exists.** The frontend was built against a precise
> contract — routes, DTOs, status codes, and business rules — captured in
> [`FE/src/shared/api/httpAdapter.ts`](../FE/src/shared/api/httpAdapter.ts) (the
> real HTTP client, already written but unwired) and mirrored by
> [`FE/src/shared/api/stubAdapter.ts`](../FE/src/shared/api/stubAdapter.ts) (an
> in-memory server that enforces every rule). **The backend's job is to satisfy
> that exact contract** so switching the FE from stub to HTTP is a one-line
> change. The stub is the executable spec — when in doubt, match its behaviour.

## Status

- ☐ Phase 0 — Scaffolding & tooling
- ☐ Phase 1 — Database schema & migrations
- ☐ Phase 2 — App skeleton (Express, config, tiers, error mapping)
- ☐ Phase 3 — Auth, sessions, email verification (SMTP)
- ☐ Phase 4 — Teams
- ☐ Phase 5 — Epics
- ☐ Phase 6 — Tickets
- ☐ Phase 7 — Comments & users directory
- ☐ Phase 8 — Testing (backend business flow + unit)
- ☐ Phase 9 — Docker Compose & repo-root startup

## Chosen stack (decided)

- **Runtime / language:** Node.js (≥ 20 LTS) + **TypeScript** (strict).
- **HTTP framework:** **Express 5** — minimal and functional; handlers are plain
  functions + middleware, no classes/decorators (honours PROJECT_RULES §2
  "factory functions, avoid `this`").
- **Data layer:** **Drizzle ORM** + `pg` driver — TypeScript-first, functional,
  SQL-like, with typed schema and built-in migration tooling (**drizzle-kit**),
  which satisfies the "schema via automated, repeatable migrations" rule
  (REQUIREMENTS §9) in one tool.
- **RDBMS:** **PostgreSQL 16** (free & open-source; no licensing cost) in a
  dedicated container.
- **Validation:** **Zod** — one schema per DTO; the backend is the authoritative
  validator (REQUIREMENTS §6, §9). Client-side validation is never trusted.
- **Auth / sessions:** **cookie-based sessions** via `express-session` +
  `connect-pg-simple` (session store in Postgres). httpOnly, `SameSite=Lax`,
  `Secure` configurable. This matches the FE (`credentials: 'include'`, and
  `GET /auth/me` returning `User | null`) and keeps tokens out of URLs (§9).
- **Password hashing:** **Argon2id** via the `argon2` package (REQUIREMENTS §3).
- **Email:** **Nodemailer** over configurable SMTP; must support
  `relay1.dataart.com`. In local/docker dev, a **Mailpit** container catches mail
  so QA can read verification links without a real relay.
- **Tests:** **Vitest** (matches the FE) + **supertest** against a disposable
  Postgres.

## Deployment topology (decided)

Three containers, orchestrated from the **repository root** with
`docker compose up --build` (REQUIREMENTS §11, Definition of Done):

```text
                         ┌─────────────┐
  browser ──:80──►  nginx (frontend)   │  serves compiled SPA
                    │  proxies /api ───┼──► backend (Express, :3000)
                    └─────────────┘         │
                                            └──► postgres (:5432, volume)
                    mailpit (dev SMTP sink, web UI :8025)
```

- nginx serves the built SPA **and** reverse-proxies `/api/*` to the backend, so
  the FE and API are **same-origin** — session cookies work with no CORS setup.
  This matches the FE's default `API_BASE_URL = '/api'`
  ([`config.ts`](../FE/src/shared/api/config.ts)).
- Migrations run automatically on backend startup, **before** it serves traffic.
- A fresh volume ⇒ schema + migration metadata only, **no seed data** (§9).

## Three-tier separation (REQUIREMENTS §NFR)

- **Presentation** — the SPA served by nginx (the `FE/` app).
- **Application / API** — the Express backend, layered internally:
  `routes (HTTP) → services (business rules) → repositories (Drizzle data access)`.
  Routes never touch the DB; services never touch `req`/`res`.
- **Persistence** — PostgreSQL, reached only through the repository layer.

## Target backend layout

```text
BE/
  Dockerfile
  drizzle.config.ts
  package.json  tsconfig.json  .env.example
  drizzle/                    generated SQL migrations (committed)
  src/
    index.ts                  compose app + start server (migrate → listen)
    config/env.ts             Zod-validated env, single source of truth
    db/
      client.ts               drizzle(pg Pool)
      schema.ts               tables, enums, constraints
      migrate.ts              run pending migrations on boot
    http/
      app.ts                  express app, middleware order, route mounting
      middleware/
        requireAuth.ts        401 unless a verified session exists
        errorHandler.ts       ApiError → { message } + status
        requestContext.ts     current user id from session
    lib/
      errors.ts               ApiError + Validation/Unauthorized/Forbidden/
                              NotFound/Conflict (mirror FE errors.ts)
      password.ts             argon2 hash/verify
      tokens.ts               verification-token issue/consume
      mailer.ts               nodemailer transport + verification email
    modules/
      auth/    { auth.routes.ts, auth.service.ts, auth.schema.ts }
      users/   { users.routes.ts, users.repo.ts }
      teams/   { teams.routes.ts, teams.service.ts, teams.repo.ts, teams.schema.ts }
      epics/   { epics.routes.ts, epics.service.ts, epics.repo.ts, epics.schema.ts }
      tickets/ { tickets.routes.ts, tickets.service.ts, tickets.repo.ts, tickets.schema.ts }
      comments/{ comments.routes.ts, comments.service.ts, comments.repo.ts, comments.schema.ts }
  tests/
    flows/auth-to-ticket.test.ts   the required backend business-flow test
    unit/*.test.ts
```

Modules are **factory functions returning closures** (a repo/service factory
takes its dependencies and returns an object of functions) — no `this`, no
class-based services (PROJECT_RULES §2). Custom `Error` subclasses are the one
sanctioned class use.

---

## The contract to satisfy (reference)

Every route below is mounted under `/api`. Request/response bodies are the DTOs
in `FE/src/entities/*/model/types.ts`. Timestamps are **ISO-8601 UTC strings**.
IDs are **UUIDs** (strings). Errors return JSON `{ "message": string }` with the
status the FE maps in [`errors.ts`](../FE/src/shared/api/errors.ts).

| Method & path                         | Auth | Success        | Notes |
| ------------------------------------- | ---- | -------------- | ----- |
| `POST /auth/signup`                   | no   | `201` `User`   | unverified; issues token + sends email |
| `POST /auth/login`                    | no   | `200` `User`   | `403` if email unverified |
| `POST /auth/logout`                   | yes  | `204`          | destroys session |
| `GET  /auth/me`                       | no   | `200` `User\|null` | **must return `200` with `null`** when signed out (FE reads body, not status) |
| `POST /auth/verify`  `{ token }`      | no   | `204`          | single-use, 24h expiry → else `400` |
| `POST /auth/resend`  `{ email }`      | no   | `204`          | invalidates prior unused tokens |
| `GET  /users`                         | yes  | `200` `User[]` | directory for `createdBy`/author names |
| `GET  /teams`                         | yes  | `200` `Team[]` | |
| `POST /teams`  `{ name }`             | yes  | `201` `Team`   | `409` on dup name (case-insensitive) |
| `PATCH /teams/:id`  `{ name }`        | yes  | `200` `Team`   | `409` dup; `updatedAt` bumps only on real change |
| `DELETE /teams/:id`                   | yes  | `204`          | **`409`** if it has tickets or epics |
| `GET  /epics?teamId=`                 | yes  | `200` `Epic[]` | |
| `POST /epics`                         | yes  | `201` `Epic`   | team fixed at creation |
| `PATCH /epics/:id`                    | yes  | `200` `Epic`   | no `teamId` (immutable) |
| `DELETE /epics/:id`                   | yes  | `204`          | **`409`** if referenced by tickets |
| `GET  /tickets?teamId=`               | yes  | `200` `Ticket[]` | |
| `GET  /tickets/:id`                   | yes  | `200` `Ticket` | |
| `POST /tickets`                       | yes  | `201` `Ticket` | status starts `new`; `createdBy` from session |
| `PATCH /tickets/:id`                  | yes  | `200` `Ticket` | edits + drag-drop (`{ status }`); epic must be same team |
| `DELETE /tickets/:id`                 | yes  | `204`          | cascades comments |
| `GET  /tickets/:id/comments`          | yes  | `200` `TicketComment[]` | oldest-first |
| `POST /tickets/:id/comments` `{ body }` | yes | `201` `TicketComment` | does **not** bump ticket `updatedAt` |
| `GET  /health`                        | no   | `200`          | readiness for compose healthcheck |

> **Counts:** the Teams/Epics screens show ticket/epic counts, but the contract
> does **not** add count fields — the FE derives them from the entity lists it
> already loads. Keep the DTOs exactly as typed; do not add fields.

---

## Phase 0 — Scaffolding & tooling

- `cd BE`; init `package.json` (type: module), TypeScript strict, ESLint +
  Prettier configured to the same rules as `FE/` (PROJECT_RULES §2).
- Install: `express`, `pg`, `drizzle-orm`, `zod`, `argon2`, `express-session`,
  `connect-pg-simple`, `nodemailer`; dev: `drizzle-kit`, `typescript`, `tsx`,
  `vitest`, `supertest`, `@types/*`.
- `src/config/env.ts`: Zod schema over `process.env` (`DATABASE_URL`,
  `SESSION_SECRET`, `SMTP_*`, `APP_BASE_URL`, `PORT`, `COOKIE_SECURE`), failing
  fast on missing/invalid values. **No secrets in code**; `.env.example`
  documents every key, real `.env` is gitignored (§NFR security).
- Scripts: `dev` (tsx watch), `build` (tsc), `start` (node dist), `migrate`
  (drizzle-kit), `test`, `lint`, `format`.

## Phase 1 — Database schema & migrations

- `src/db/schema.ts` (Drizzle), all PKs `uuid` default `gen_random_uuid()`,
  all timestamps `timestamptz`:
  - **users** — `email` (unique, case-insensitive via a `lower(email)` unique
    index or `citext`), `password_hash`, `display_name`, `email_verified`
    (default false), `created_at`, `updated_at`.
  - **verification_tokens** — `token` (unique, random), `user_id` → users,
    `expires_at`, `used_at` (null). Issuing a new one deletes the user's prior
    unused tokens (§3).
  - **teams** — `name`, unique index on `lower(name)`, timestamps.
  - **epics** — `team_id` → teams (`ON DELETE RESTRICT`), `title`,
    `description` (null), timestamps. Add `UNIQUE (id, team_id)` to enable the
    composite FK below.
  - **tickets** — `team_id` → teams (RESTRICT), `type` (pgEnum
    `bug|feature|fix`), `status` (pgEnum, 5 states), `epic_id` (null),
    `title`, `body`, `created_by` → users, timestamps.
    **Same-team epic enforced at the DB level** via a composite FK
    `(epic_id, team_id)` → `epics (id, team_id)` — the database itself rejects a
    ticket whose epic belongs to another team (§5, §6), in addition to the
    service check.
  - **comments** — `ticket_id` → tickets (`ON DELETE CASCADE` ⇒ deleting a
    ticket deletes its comments, §6), `author_id` → users, `body`, `created_at`.
  - Session table is managed by `connect-pg-simple`.
- `drizzle-kit generate` → commit SQL under `BE/drizzle/`.
- `src/db/migrate.ts`: apply pending migrations programmatically on boot.
  **Fresh DB = schema + migration metadata only, no seed** (§9).
- `updated_at` is **not** a DB trigger — services set it, and only on a real
  change, so "save unchanged" and "add comment" never advance a ticket (§6, §7).

## Phase 2 — App skeleton (Express, tiers, error mapping)

- `src/lib/errors.ts`: `ApiError` + `Validation(400)/Unauthorized(401)/
  Forbidden(403)/NotFound(404)/Conflict(409)` — a mirror of the FE's
  [`errors.ts`](../FE/src/shared/api/errors.ts) so both ends speak the same
  status/message language.
- `src/http/app.ts`: JSON body parsing, session middleware, route mounting under
  `/api`, then a terminal `errorHandler` that turns any `ApiError` into
  `res.status(err.status).json({ message })` and anything else into `500`.
- `requireAuth` middleware: `401` unless the session has a user id; attaches the
  current user id for handlers. Applied to every module route **except** the
  public auth routes and `/health`.
- `GET /health` (public) for the compose healthcheck.

## Phase 3 — Auth, sessions, email verification

- `lib/password.ts`: `hashPassword` / `verifyPassword` with **Argon2id**.
- `lib/tokens.ts`: issue single-use token (24h TTL), consume, invalidate prior
  unused tokens for a user (§3).
- `lib/mailer.ts`: Nodemailer transport from `SMTP_*`; sends a verification email
  whose link is `${APP_BASE_URL}/verify?token=…` (single-use token in URL is the
  one sanctioned exception — §9).
- `auth.service.ts` + `auth.routes.ts` implementing the six auth endpoints with
  the exact semantics of the stub:
  - **signup** — normalize email (trim + lowercase), password ≥ 8, unique email
    (`409`), hash, insert unverified, issue token, send email, return `User`.
  - **login** — verify password; `403` if unverified; set session; return `User`.
  - **logout** — destroy session (`204`).
  - **me** — `200` with the session `User` **or `null`** (never `401`).
  - **verify** — validate token not expired/used → mark verified, consume all
    the user's tokens; else `400`.
  - **resend** — unknown email `404`, already-verified `400`, else re-issue.
- Confirm **auth-gating**: only signup/login/verify/resend/me + health are
  public; everything else requires a verified session (§3).

## Phase 4 — Teams

- `teams.repo.ts` (Drizzle CRUD) + `teams.service.ts` + `teams.routes.ts`:
  - Name non-empty after trim; unique case-insensitively (`409` on dup).
  - `PATCH` bumps `updated_at` only when the name actually changes.
  - `DELETE` → **`409`** if any ticket or epic references the team; no cascade
    (§4, §9). Rely on both the service check and the FK `RESTRICT`.

## Phase 5 — Epics

- `epics.*`:
  - Belongs to exactly one team, chosen at create, **immutable** (`PATCH` has no
    `teamId`).
  - Title non-empty after trim; description trimmed → `null` when empty.
  - `GET /epics?teamId=` filters by team.
  - `DELETE` → **`409`** if any ticket references it (§5).

## Phase 6 — Tickets

- `tickets.*` — the core module; match the stub's `updateTicket` precisely:
  - Create: validate `type`/`status` enums server-side, non-empty trimmed
    `title` and non-empty `body`, `teamId` exists; if `epicId` set it must belong
    to the ticket's team (service check + composite FK). `status` starts `new`;
    `createdBy` from session; server sets `createdAt`/`updatedAt`.
  - Patch (edit + drag-drop): resolve next `teamId`/`epicId`, **re-check
    same-team**; validate enums; compute whether anything actually changed and
    **bump `updatedAt` only then** (unchanged save must not advance it — §6).
  - `moveTicket` is `PATCH { status }`; a no-op move returns unchanged with no
    timestamp bump.
  - Delete cascades comments (FK). Reject bad enums/refs with `400`/`404`.
  - `GET /tickets?teamId=` powers the per-team board; board must stay usable at
    **100+ tickets** (indexed `team_id`, `status`) — filtering/search/ordering
    remain client-side per the FE.

## Phase 7 — Comments & users directory

- `comments.*`: add comment (non-empty body, author from session), list
  **oldest-first**, immutable. Adding a comment **must not** touch the ticket's
  `updated_at` (§7).
- `users.*`: `GET /users` returns the public `User[]` (no password hash) for
  resolving `createdBy` and comment-author display names.

## Phase 8 — Testing

- **Required backend business-flow test** (`tests/flows/auth-to-ticket.test.ts`,
  supertest): signup → read the token from the DB (stand-in for the emailed
  link) → verify → login → create team → create epic → create ticket → move it →
  add a comment → assert everything persisted and that the comment did not bump
  the ticket's `updatedAt`. This closes the REQUIREMENTS §11 item the FE roadmap
  deferred ("backend business-flow test — deferred until a backend exists").
- Unit tests for the fiddly rules: `updatedAt`-only-on-change, epic same-team
  rejection, team/epic delete `409`, single-use/expired token.
- Tests run against a disposable Postgres (a compose test service or
  testcontainers); migrations applied before the suite; DB reset between tests.

## Phase 9 — Docker Compose & repo-root startup

- `BE/Dockerfile`: multi-stage (install + `tsc` build → slim runtime running
  `dist`); entrypoint runs migrations then starts the server.
- `FE/Dockerfile`: multi-stage (`npm ci` + `npm run build` → nginx serving
  `dist`). `nginx.conf`: SPA fallback (`try_files … /index.html`) **and**
  `location /api/ { proxy_pass http://backend:3000/; }`.
- **Root `docker-compose.yml`** with `db` (postgres:16-alpine + named volume +
  `pg_isready` healthcheck), `backend` (`depends_on db: healthy`), `frontend`
  (`depends_on backend`), and `mailpit` (dev SMTP sink + web UI on `:8025`).
  Backend `SMTP_HOST` defaults to `mailpit` in compose so QA reads verification
  emails locally.
- Root `.env.example` (committed) documents `POSTGRES_*`, `SESSION_SECRET`,
  `SMTP_*`, `APP_BASE_URL`; real `.env` gitignored. **No committed secrets.**
- Verify the Definition of Done: from a clean checkout, `docker compose up
  --build` at the repo root brings up the whole stack with **no host-installed
  Node/Postgres**; a fresh DB has schema + migration metadata only; QA creates
  all data through the UI/API.

---

## Deferred / out of scope

- Everything in REQUIREMENTS §12 (sprints, SSO, roles/membership, attachments,
  notifications, real-time, custom workflows, production HA).
- Concurrent-edit conflict detection — last write wins (§9).
- Production-grade mail infrastructure — Mailpit is a dev convenience; real
  sending uses the configured SMTP relay.
