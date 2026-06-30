# Implementation Roadmap

Phased build plan, aligned to [REQUIREMENTS.md](REQUIREMENTS.md) (what),
[PROJECT_RULES.md](../PROJECT_RULES.md) (how), and [design/](design/) (looks).
This supersedes the earlier localStorage/single-board plan.

## Status

- ✅ Phase 0 — FSD skeleton
- ✅ Phase 1 — entities & workflow
- ✅ Phase 2 — data layer (TicketApi + stub)
- ✅ Phase 3 — app shell & routing
- ✅ Phase 4 — Kanban board
- ✅ Phase 5 — ticket detail / edit / comments
- ✅ Phase 6 — teams management
- ⬜ **Phase 7 — epics management (not started; the Epics page is still a placeholder)**
- ✅ Phase 8 — auth flow
- ◻️ Phase 9 — testing & polish (in progress; backend business-flow test still deferred until a backend exists)

## Decisions baked in

- **Architecture:** Feature-Sliced Design — `app → pages → widgets → features →
  entities → shared`, imports point downward only (PROJECT_RULES §2).
- **Scope now:** frontend only. Build against the backend's API contract via the
  `TicketApi` seam; the real backend (RDBMS, SMTP, Argon2id, migrations) is
  out of current scope but its contract is honoured (REQUIREMENTS §9).
- **Dev data:** a temporary stub adapter behind `TicketApi`. It starts **empty**
  (no seed — §9); QA creates data through the UI. `localStorage` may back the
  stub for dev convenience but is **not** the system of record and will be
  replaced by an HTTP adapter (`API_BASE_URL` placeholder).
- **States:** `new · ready_for_implementation · in_progress ·
  ready_for_acceptance · done`; cards move **any-to-any** (§8).
- **Compatibility:** current desktop Chrome/Edge/Firefox; desktop-only.

## Target FSD layout

```
src/
  app/          providers, router, global styles
  pages/        login, signup, verify-email, board, ticket, teams, epics
  widgets/      top-nav, kanban-board
  features/     auth (login/signup/resend), create-ticket, edit-ticket,
                move-ticket, filter-tickets, manage-teams, manage-epics,
                add-comment
  entities/     ticket, team, epic, comment, user  (each: ui/ model/ api/)
  shared/       ui/ (Button, Modal, Select, Field, Badge, …), lib/ (cn, id,
                date), api/ (TicketApi client, base-url config, errors)
```

---

## Phase 0 — Foundations & FSD skeleton

- Stand up the FSD folder structure; configure import-boundary discipline.
- Move existing code into place: `domain/types` + `domain/workflow` →
  `entities/ticket/model`; `components/ui/*` → `shared/ui/*`; `utils/*` →
  `shared/lib/*`; `services/*` → `shared/api/*`.
- **Remove seed auto-load**; stub starts empty.
- Verify tooling: `npm run lint`, `format:check`, `build`, `test` all green.

## Phase 1 — Entities & workflow (spec-aligned)

- `entities/ticket/model`: `Ticket` with `type` (`bug|feature|fix`), 5-state
  `status`, `body`, optional `epicId`, `teamId`, `createdBy`, `createdAt`,
  `updatedAt`.
- Add `entities/team`, `entities/epic`, `entities/comment`, `entities/user`.
- Rewrite `workflow`: 5 ordered states (for column order) + labels; **drop
  single-step enforcement** — any-to-any allowed.

## Phase 2 — Data layer (API contract + stub)

- `shared/api`: `TicketApi` interface covering teams, epics, tickets, comments
  CRUD (+ auth contract). `API_BASE_URL` placeholder; HTTP-adapter skeleton
  (unwired).
- Stub adapter implements the interface in-memory/localStorage; enforces the
  rules a backend would (unique team name case-insensitive; epic same-team;
  block team delete with tickets/epics; block epic delete when referenced) and
  surfaces them as **409-style conflict** errors for the UI.
- Server-set timestamps semantics: `updatedAt` advances only on real change;
  adding a comment doesn't touch it.

## Phase 3 — App shell & routing

- `app/`: providers + router. Routes for login/signup/verify, board, ticket
  detail, teams, epics.
- `widgets/top-nav`: TICKET TRACKER brand, Board/Teams/Epics tabs, user menu
  (design shell).

## Phase 4 — Kanban board (primary screen)

- `widgets/kanban-board`: 5 columns in workflow order; cards show title + type
  (+ epic); **team selector**.
- `features/move-ticket`: drag-and-drop → persist via API; **revert + error on
  failure**. Column order = most-recently-modified first.
- `features/filter-tickets`: type + epic filters and case-insensitive title
  search, combined with **AND**.
- Create/open entry points; loading/empty/error states; usable at **100+
  tickets**.

## Phase 5 — Ticket create / edit / detail

- `pages/ticket`: meta (id, created by/at, modified at), form (team, type,
  state, epic, title, body), Save + Delete-with-confirmation (cascades comments).
- Team change **clears/replaces** epic; epic restricted to same team.
- `features/add-comment` + comments list: oldest-first, immutable; does not bump
  `updatedAt`.

## Phase 6 — Teams management

- `pages/teams` + `features/manage-teams`: list (name/tickets/epics/modified/
  actions), create, rename, delete.
- Name non-empty trimmed, unique case-insensitive. **Delete blocked** while
  tickets/epics exist → clear validation message (409).

## Phase 7 — Epics management

- `pages/epics` + `features/manage-epics`: separate CRUD screen. Team chosen at
  create, **immutable** after. Title non-empty trimmed.
- **Delete blocked** while referenced by tickets → clear message (409).

## Phase 8 — Auth flow *(deferred earlier; required by spec)*

- `pages` + `features/auth`: sign-up, login, email-verification result,
  resend-verification. Built against the auth API contract.
- Route guard gates all business screens except auth routes.
- SMTP/Argon2id/token expiry/single-use live in the **backend** (documented,
  not implemented this phase).

## Phase 9 — Testing & polish

- Vitest: workflow (any-to-any + ordering), a stub-adapter rule test, and a
  board/ticket **frontend flow** test. *(REQUIREMENTS §11 also wants one backend
  business-flow test — deferred until the backend exists; tracked here so it
  isn't forgotten.)*
- Audit loading/empty/success/error states across screens.
- `lint` + `format:check` + `build` + `test` green; desktop sanity in
  Chrome/Edge/Firefox.

---

## Deferred / out of scope (current phase)

- Backend service, RDBMS, migrations, SMTP integration, password hashing — only
  their **frontend contract** is built now.
- Real authentication enforcement (Phase 8 builds the screens; full gating lands
  with the backend).
- Backend business-flow test (Phase 9 note).
