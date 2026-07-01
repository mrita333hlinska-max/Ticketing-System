# Ticketing-System

Web application that allows registered users to organize work tickets by team and
move them through a fixed Kanban workflow. The solution must demonstrate a
functional user interface, server-side business logic, and persistent relational
storage.

## Documentation

- [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) — functional + non-functional spec (**what to build**).
- [PROJECT_RULES.md](PROJECT_RULES.md) — engineering rules & standards (**how to build**).
- [docs/design/](docs/design/) — screen-by-screen UI reference (**what it looks like**).
- [docs/ROADMAP-FE.md](docs/ROADMAP-FE.md) — phased **frontend** plan (**how we get there**).
- [docs/ROADMAP-BE.md](docs/ROADMAP-BE.md) — phased **backend** (API + RDBMS) plan.
- [CLAUDE.md](CLAUDE.md) — orientation for contributors/agents.

## Repository layout

- [FE/](FE/) — frontend (Vite + React + TypeScript). All FE tooling and
  `package.json` live here; run the scripts below from inside `FE/`.
- [BE/](BE/) — backend (Node + Express + PostgreSQL via Drizzle). See
  [BE/README.md](BE/README.md).

## Running the full stack (Docker)

From a clean checkout, one command builds and starts every tier — PostgreSQL,
the backend API, the frontend (nginx serving the SPA and proxying `/api`), and a
Mailpit dev mail sink. **No host-installed Node or Postgres is required — only
Docker Compose** (REQUIREMENTS §6).

```bash
docker compose up --build      # from the repository root
```

Then open:

- **App** — <http://localhost:8080>
- **Mailpit** (reads verification emails) — <http://localhost:8025>

Sign up, open the verification email in Mailpit, click the link to verify, then
log in. A fresh database starts **empty** (schema + migrations only, no seed
data); create all teams/epics/tickets through the UI or API.

> No `docker`? On macOS/Windows you don't need Docker Desktop — a free engine
> such as [Colima](https://github.com/abiosoft/colima) (`brew install colima
> docker docker-compose && colima start`) provides the same `docker compose`.

### Ports

| Service          | URL / Port              | Purpose                          |
| ---------------- | ----------------------- | -------------------------------- |
| Frontend (nginx) | <http://localhost:8080> | The app (serves SPA + `/api`)    |
| Mailpit          | <http://localhost:8025> | Read verification emails         |
| PostgreSQL       | `localhost:5432`        | Database (for direct inspection) |

### Stopping & resetting

```bash
docker compose down       # stop and remove containers (keeps the database)
docker compose down -v     # also delete the database volume — a fully fresh start
```

## Local development (with live reload)

Docker is the simplest way to run everything, but for fast frontend/backend
iteration you can run them on the host. The frontend always talks to the real
backend (there is no offline/stub mode), so start the backing services first.

- **Node.js ≥ 20** (see [FE/.nvmrc](FE/.nvmrc); with nvm: `nvm use`).

```bash
# 1. Backing services (Postgres + Mailpit) in the background:
docker compose up -d db mailpit

# 2. Backend API (migrates on start, serves http://localhost:3000):
cd BE && npm install && npm run dev

# 3. Frontend dev server in another terminal (http://localhost:5173):
cd FE && npm install && npm run dev
```

The Vite dev server proxies `/api` to the backend on `:3000` (see
[FE/vite.config.ts](FE/vite.config.ts)), so the app is same-origin and session
cookies work. Verification emails land in Mailpit at <http://localhost:8025>.

## Signing up & logging in

The app is gated by an **email-verified auth flow**: you create an account,
verify it via an emailed link, then log in. Every app route (`/board`, `/teams`,
`/epics`) redirects to `/login` until you have a verified session.

1. **Sign up** — open `/signup`, enter your email and a password (**minimum 8
   characters**, entered twice). Submitting creates an _unverified_ account.
2. **Verify your email** — the backend emails a single-use verification link
   pointing at `/verify?token=…` (expires after 24h, single-use). Open
   **Mailpit** at <http://localhost:8025>, open the message, and click the link —
   it lands back on the app and activates the account.
3. **Log in** — open `/login`, enter the same email and password. On success you
   land on `/board`.

### Troubleshooting

- _"Verify your email before logging in"_ — the account exists but isn't
  verified yet. Use the **Resend email** action on the login or `/verify` screen
  to get a fresh link (check Mailpit).
- _Verification link expired or invalid_ — go to `/verify`, enter your email,
  and click **Resend email** for a new single-use link.
- _Logging out_ — open the account menu in the top navigation and choose
  **Log out**; you'll be returned to `/login`.

## Running the tests

- **Backend** (Vitest + supertest, needs the DB container running):

  ```bash
  docker compose up -d db            # start Postgres
  cd BE && npm install && npm test   # unit tests + a full business-flow test
  ```

- **Frontend** unit tests (Vitest + jsdom; run in-memory, no server needed):

  ```bash
  cd FE && npm install && npm test
  ```

- **End-to-end** (Playwright) runs against the full stack — bring it up first
  (`docker compose up --build`), then `cd FE && npm run test:e2e`. See
  [FE/tests/README.md](FE/tests/README.md).

## Configuration

All settings come from the environment. Copy [.env.example](.env.example) to
`.env` to override compose defaults (Postgres credentials, `SESSION_SECRET`,
`APP_BASE_URL`); backend-specific variables are documented in
[BE/.env.example](BE/.env.example). No secrets are committed — a real `.env` is
gitignored, and the compose `SESSION_SECRET` default is a clearly-labelled dev
placeholder to override outside local use.

## Data model — per-user workspaces (deviation from spec)

**Intentional deviation from [REQUIREMENTS.md](docs/REQUIREMENTS.md) §4/§12.** The
spec describes a _shared_ workspace ("all verified users can view and manage all
teams"). By product decision, this build instead gives every user an **isolated
workspace**: teams, epics, and tickets are scoped to the user who created them
(`created_by`), so a new account starts empty and never sees another user's data.
Requests for another user's records return **404** (existence is hidden), and
team names are unique **per owner**. Everything else follows the spec.

## Compatibility

Targets current desktop versions of **Chrome, Edge, and Firefox**. Desktop-only.
