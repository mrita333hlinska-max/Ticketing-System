# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Authoritative docs — read before changing code:**
>
> - [PROJECT_RULES.md](PROJECT_RULES.md) — engineering rules, coding standards, anti-patterns, architecture (**how to build**).
> - [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) — functional + non-functional spec (**what to build**).
> - [docs/design/](docs/design/) — screen-by-screen UI reference (**what it looks like**).
> - [docs/ROADMAP-FE.md](docs/ROADMAP-FE.md) — phased **frontend** plan (**how we get there**).
> - [docs/ROADMAP-BE.md](docs/ROADMAP-BE.md) — phased **backend** (API + RDBMS) plan.
>
> The notes below are a quick orientation; the docs above win on any conflict.

## Project status

Both apps are scaffolded and built out against the spec, and run together as a
full stack:

- **Frontend** — Vite + React + TypeScript, organized with Feature-Sliced Design.
- **Backend** — Express 5 + Drizzle ORM + PostgreSQL, organized by domain module.

The frontend **always talks to the real backend** over the `TicketApi` HTTP seam
(`/api`) — never browser storage. In local dev the Vite dev server proxies `/api`
to the backend on `:3000`, so `npm run dev` on the frontend alone will 500 on
`/api/*` until the backend is running (see **Commands**). The in-memory stub
adapter (`FE/src/shared/api/stubAdapter.ts`) exists **only for Vitest** and is
tree-shaken out of real builds. Treat [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)
as the source of truth for behavior.

## What we're building

A single-page app where **verified users** organize work **tickets by team** and
move them through a **fixed 5-state Kanban workflow**, with Teams, Epics,
Comments, and an email-verified auth flow. The system of record is a **backend
RDBMS reached over an API** — not browser storage. Full detail in
[docs/REQUIREMENTS.md](docs/REQUIREMENTS.md).

## Repository layout

The repo is split into two top-level apps:

- `FE/` — the frontend (Vite + React + TypeScript). All FE tooling, config, and
  `package.json` live here; run the FE commands below from inside `FE/`.
- `BE/` — the backend: **Express 5 + Drizzle ORM + PostgreSQL**, organized by
  domain module under `BE/src/modules/` (`auth`, `teams`, `epics`, `tickets`,
  `comments`, `users`). Drizzle migrations live in `BE/drizzle/`. Run the BE
  commands below from inside `BE/`.
- `docker-compose.yml` (repo root) — full-stack orchestration (db → backend →
  frontend + a Mailpit SMTP sink).

Project-wide files (`README.md`, `CLAUDE.md`, `PROJECT_RULES.md`, `docs/`,
`LICENSE`) and the shared `.gitignore` stay at the repo root.

## Commands

### Full stack (from the repo root)

- `docker compose up --build` — bring up the whole system (db + backend +
  frontend + Mailpit) with no host Node/Postgres needed. Open the app at
  `http://localhost:8080`; read verification emails at `http://localhost:8025`.

### Frontend (`cd FE` first)

- `npm install` — install dependencies (Node ≥ 18.18; see `FE/.nvmrc`).
- `npm run dev` — start the Vite dev server (**needs the backend on `:3000`** —
  bring it up with Docker or `cd BE && npm run dev`; otherwise `/api/*` returns 500).
- `npm run build` / `npm run preview` — production build / preview.
- `npm test` — run Vitest (`npm run test:watch` to watch; `vitest run <path>` for one file).
- `npm run lint` / `npm run format` — ESLint / Prettier.

### Backend (`cd BE` first)

- `npm install` — install dependencies (Node ≥ 18.18; see `BE/.nvmrc`).
- `npm run dev` — start the API on `:3000` (`tsx watch`; runs migrations, then listens).
  Needs PostgreSQL reachable via `DATABASE_URL` (e.g. `docker compose up -d db`).
- `npm run db:generate` — emit a new Drizzle migration from `src/db/schema.ts`.
- `npm run db:migrate` — apply pending migrations. `npm run db:studio` — Drizzle Studio.
- `npm test` — run Vitest (flow tests need the test DB; see `BE/tests/`).
- `npm run lint` / `npm run format` — ESLint / Prettier.
