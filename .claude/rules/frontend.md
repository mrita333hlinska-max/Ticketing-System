---
name: frontend
description: Always-on rules for the React + TypeScript client. Auto-loads when touching files under FE/.
paths:
  - "FE/**"
---

# Frontend rules

Supplement the root [PROJECT_RULES.md](../../PROJECT_RULES.md) and
[docs/REQUIREMENTS.md](../../docs/REQUIREMENTS.md); on conflict, those win.

## Architecture — Feature-Sliced Design

- Layers, top→bottom: `app → pages → widgets → features → entities → shared`.
  **Dependencies point downward only.** A slice never imports from a layer above it.
- Slice segments: `ui/`, `model/` (hooks/state), `api/` (services), `lib/`.
- Cross-slice imports go through the slice's public `index.ts` barrel using the `@/`
  alias — never deep-import another slice's internals.

## Data access — the service-layer seam (non-negotiable)

- All data goes through the `TicketApi` seam in `FE/src/shared/api`. Components and
  hooks **never** call `fetch`/`api.*` directly and hold **no `try/catch`** around
  requests.
- Each consuming slice has an `api/` segment whose functions wrap calls in
  `runRequest(...)` and return a typed `Result<T>` (`{ ok, value } | { ok, error }`).
  Canonical shape: `FE/src/shared/api/result.ts` and
  `FE/src/features/manage-teams/api/teamsService.ts`.
- Hooks branch on the `Result` to set state. Base URL lives only in
  `FE/src/shared/api/config.ts` — never hardcode URLs.
- Building a data screen? Invoke the `/react-async-state` skill. Optimistic board
  move? Invoke `/dragdrop-rollback`.

## React discipline

- Function components + hooks only. No class components, no `this`.
- **`useEffect` is a last resort** — only for genuine external sync (initial load,
  param-driven refetch, subscriptions, non-React listeners). Derive with `useMemo`,
  stabilize callbacks with `useCallback`. Never mirror/transform props or state in an
  effect.
- Styling is **CSS Modules** only — no inline styles. Match `docs/design`.
- No classic `for`/`for...of`/`for...in` — use array methods. Desktop-only (Chrome,
  Edge, Firefox).

## Naming

No vague names (`data`, `tmp`, `obj`). Don't shadow globals/reserved words — qualify
(`TicketComment`, not `Comment`). Booleans read as predicates (`isVerified`). Name
callback params after the element (`ticket`, not `t`).

## Tests

Vitest + Testing Library, jsdom; `*.test.ts(x)` next to code. `cd FE && npm test`.
Must pass `npm run lint` and `npm run format:check`.
