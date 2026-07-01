---
name: react-async-state
description: >-
  Build a React screen/component that loads data through the service layer with the
  loading / error / empty / success contract. Use when adding a page or widget that
  fetches from the TicketApi and must render all four async states (not just the happy path).
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# React async-state contract (loading / error / empty / success)

Every data-driven screen renders **four** states explicitly. Data flows
`service (Result) → hook (state) → component (render)`. The component never calls the
API and holds no `try/catch`.

## The contract

1. **loading** — request in flight → spinner/skeleton.
2. **error** — `Result.ok === false` → the `error` message + a retry affordance.
3. **empty** — success but zero items → an empty-state message, not a blank screen.
4. **success** — success with items → the real UI.

## Steps

1. **Service (`api/` segment).** Add a function that wraps the call in `runRequest(...)`
   and returns `Result<T>`. Mirror `FE/src/features/manage-teams/api/teamsService.ts`.
   No `try/catch`, no direct `fetch`.

2. **Hook (`model/`).** Own `status: 'loading' | 'error' | 'success'`, `error`, and
   `data`. Load in a single `useEffect` (initial load / param-driven refetch is a
   sanctioned effect use). Branch on the `Result` to set state — never throw. Derive
   `isEmpty` with `useMemo`, not a separate state field or effect. Memoize handlers with
   `useCallback`.

3. **Component (`ui/`).** Render strictly by state, in order: loading → error → empty →
   success. CSS Modules only. Keep it small — split sub-views out if it grows.

4. **Test.** With Vitest + Testing Library, assert all four states: stub the service to
   resolve a `Result`. Cover at least loading→success and the error branch.

## Reference

- `Result` + `runRequest`: `FE/src/shared/api/result.ts`
- Service example: `FE/src/features/manage-teams/api/teamsService.ts`
- Optimistic mutations on the board: use the `/dragdrop-rollback` skill instead.
