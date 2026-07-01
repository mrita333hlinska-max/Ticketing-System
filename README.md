# Ticketing-System

Web application that allows registered users to organize work tickets by team and
move them through a fixed Kanban workflow. The solution must demonstrate a
functional user interface, server-side business logic, and persistent relational
storage.

## Documentation

- [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) — functional + non-functional spec (**what to build**).
- [PROJECT_RULES.md](PROJECT_RULES.md) — engineering rules & standards (**how to build**).
- [docs/design/](docs/design/) — screen-by-screen UI reference (**what it looks like**).
- [docs/ROADMAP.md](docs/ROADMAP.md) — phased **frontend** plan (**how we get there**).
- [docs/ROADMAP-BE.md](docs/ROADMAP-BE.md) — phased **backend** (API + RDBMS) plan.
- [CLAUDE.md](CLAUDE.md) — orientation for contributors/agents.

## Repository layout

- [FE/](FE/) — frontend (Vite + React + TypeScript). All FE tooling and
  `package.json` live here; run the scripts below from inside `FE/`.
- [BE/](BE/) — backend (API + RDBMS). Planned; see [docs/ROADMAP-BE.md](docs/ROADMAP-BE.md).

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

## Frontend-only development (stub, no backend)

The frontend can also run standalone against an in-memory stub adapter — handy
for UI work with no backend or database.

- **Node.js ≥ 18.18** (see [FE/.nvmrc](FE/.nvmrc); with nvm: `nvm use`).

```bash
cd FE            # all frontend commands run from here
npm install      # install dependencies
npm run dev      # start the dev server (prints a localhost URL)
```

Backend development commands live in [BE/README.md](BE/README.md).

## Signing up & logging in

The app is gated by an **email-verified auth flow**: you create an account,
verify it via an emailed link, then log in. Every app route (`/board`, `/teams`,
`/epics`) redirects to `/login` until you have a verified session.

1. **Sign up** — open `/signup`, enter your email and a password (**minimum 8
   characters**, entered twice). Submitting creates an _unverified_ account.
2. **Verify your email** — the backend emails a single-use verification link
   pointing at `/verify?token=…`. Opening it activates the account.
   > **Dev mode:** the dev server uses a stub that sends no real email. Instead,
   > the sign-up confirmation (and the login/verify screens) show a clickable
   > **"verify this account →"** link — click it to verify locally.
3. **Log in** — open `/login`, enter the same email and password. On success you
   land on `/board`.

### Troubleshooting

- _"Verify your email before logging in"_ — the account exists but isn't
  verified yet. Use the **Resend email** action on the login or `/verify` screen
  to get a fresh link (in dev, a new clickable verify link appears).
- _Verification link expired or invalid_ — go to `/verify`, enter your email,
  and click **Resend email** for a new single-use link.
- _Logging out_ — open the account menu in the top navigation and choose
  **Log out**; you'll be returned to `/login`.

## Scripts

| Command           | Purpose                                            |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server.                         |
| `npm run build`   | Production build.                                  |
| `npm run preview` | Preview the production build locally.              |
| `npm test`        | Run tests (Vitest). `npm run test:watch` to watch. |
| `npm run lint`    | Lint with ESLint.                                  |
| `npm run format`  | Format with Prettier.                              |

## Configuration

No configuration is required in the current phase — the frontend runs against a
stub data adapter, so **no backend or environment setup is needed** to start it.
When the backend lands, the API base URL will come from a single configurable
setting (placeholder `API_BASE_URL`); see PROJECT_RULES.md §2.

## Compatibility

Targets current desktop versions of **Chrome, Edge, and Firefox**. Desktop-only.
