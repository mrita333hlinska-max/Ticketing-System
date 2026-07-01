# Backend (BE)

The backend service (API + RDBMS) for the Ticketing System. **Planned, not yet
scaffolded** — the phased build plan lives in
[docs/ROADMAP-BE.md](../docs/ROADMAP-BE.md).

## Stack

- **Node.js (≥ 20 LTS) + TypeScript** (strict)
- **Express 5** — HTTP API (functional handlers + middleware, no classes)
- **Drizzle ORM** + `pg` on **PostgreSQL 16** — schema, queries, and automated
  migrations (drizzle-kit)
- **Zod** — authoritative server-side validation
- **express-session** + **connect-pg-simple** — cookie-based sessions
- **Argon2id** (`argon2`) — password hashing
- **Nodemailer** — SMTP email verification (supports `relay1.dataart.com`;
  Mailpit as a dev sink)
- **Vitest** + **supertest** — tests

## Contract

The API contract is already fixed by the frontend it must serve — see the route
table in [docs/ROADMAP-BE.md](../docs/ROADMAP-BE.md) and the executable spec in
[`FE/src/shared/api/httpAdapter.ts`](../FE/src/shared/api/httpAdapter.ts) /
[`stubAdapter.ts`](../FE/src/shared/api/stubAdapter.ts).

## Running

The whole stack (db + backend + frontend) starts from the **repository root**:

```bash
docker compose up --build
```

No host-installed Node or Postgres is required — only Docker Compose.

See the root [docs/REQUIREMENTS.md](../docs/REQUIREMENTS.md) for the spec and
[PROJECT_RULES.md](../PROJECT_RULES.md) for engineering rules.
