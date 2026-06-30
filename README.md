# Ticketing-System

Web application that allows registered users to organize work tickets by team and
move them through a fixed Kanban workflow. The solution must demonstrate a
functional user interface, server-side business logic, and persistent relational
storage.

## Documentation

- [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) — functional + non-functional spec (**what to build**).
- [PROJECT_RULES.md](PROJECT_RULES.md) — engineering rules & standards (**how to build**).
- [docs/design/](docs/design/) — screen-by-screen UI reference (**what it looks like**).
- [docs/ROADMAP.md](docs/ROADMAP.md) — phased implementation plan (**how we get there**).
- [CLAUDE.md](CLAUDE.md) — orientation for contributors/agents.

## Prerequisites

- **Node.js ≥ 18.18** (see [.nvmrc](.nvmrc); with nvm: `nvm use`).
- **npm** (bundled with Node).

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server (prints a localhost URL)
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Production build. |
| `npm run preview` | Preview the production build locally. |
| `npm test` | Run tests (Vitest). `npm run test:watch` to watch. |
| `npm run lint` | Lint with ESLint. |
| `npm run format` | Format with Prettier. |

## Configuration

No configuration is required in the current phase — the frontend runs against a
stub data adapter, so **no backend or environment setup is needed** to start it.
When the backend lands, the API base URL will come from a single configurable
setting (placeholder `API_BASE_URL`); see PROJECT_RULES.md §2.

## Compatibility

Targets current desktop versions of **Chrome, Edge, and Firefox**. Desktop-only.
