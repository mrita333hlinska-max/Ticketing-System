# Source layout — Feature-Sliced Design (FSD)

Per [PROJECT_RULES.md](../PROJECT_RULES.md) §2. Layers, top → bottom; **imports
may only point downward** (a layer never imports from a layer above it):

| Layer | Role | Examples (planned) |
| --- | --- | --- |
| `app/` | App composition: entry, providers, router, global styles | `main.tsx`, `App.tsx`, `index.css` |
| `pages/` | One slice per route/screen | login, signup, verify-email, board, ticket, teams, epics |
| `widgets/` | Large composed UI blocks | top-nav, kanban-board |
| `features/` | User interactions | auth, create-ticket, move-ticket, filter-tickets, manage-teams, manage-epics, add-comment |
| `entities/` | Business objects (`ui/ model/ api/`) | ticket, team, epic, comment, user |
| `shared/` | Generic, business-agnostic | `ui/`, `lib/`, `api/` |

## Conventions

- **Imports:** use the `@/` alias (e.g. `@/shared/lib`), not long relative
  paths. Configured in `vite.config.ts` and `tsconfig.app.json`.
- **Public API:** import a slice through its barrel `index.ts`, not deep files.
- **Tests:** co-located as `*.test.ts(x)`.

## Status

Phase 0 (skeleton) is in place: `app/` entry + `shared/lib/`. Remaining layers
are empty placeholders (`.gitkeep`) to be filled per
[docs/ROADMAP.md](../docs/ROADMAP.md). Automated import-boundary linting
(e.g. `eslint-plugin-boundaries`) is a planned follow-up; for now the rule is
enforced by review.
