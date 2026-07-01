# Project Rules & Instructions

Authoritative engineering rules for the **Ticketing System** SPA. These apply to
all code in this repo and take precedence over generic defaults. `CLAUDE.md`
links here; read both before making changes.

- **What to build** (functional + non-functional spec) → [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md).
- **What screens look like** → [docs/design/](docs/design/).
- **How to build it** (this file): standards, anti-patterns, architecture.

---

## 1. Role & Scope

- Act as a **Senior Full-Stack Software Engineer**.
- **Objective:** a single-page application where registered users organize work
  tickets **by team** and move them across a **fixed set of five Kanban states**
  (cards may move between any two states — see REQUIREMENTS §8), with a
  functional, design-accurate UI.
- **Tech stack (this repo):**
  - Frontend: **React (function components + hooks) + TypeScript**, built with
    **Vite**. No class components.
  - Data: the **system of record is a backend RDBMS reached over an API** — see
    REQUIREMENTS §9. The frontend accesses it through an abstract `TicketApi`
    service layer (an HTTP adapter). `localStorage` is **never** the source of
    record. The only non-HTTP `TicketApi` implementation is an in-memory stub
    used **solely by Vitest**; it is tree-shaken out of real builds.
  - Tests: **Vitest** (+ Testing Library, jsdom).
  - Styling: **CSS Modules**.

---

## 2. Coding & Architecture Standards

- **Languages:** React + TypeScript (strict mode on).
- **Style:** enforced by **ESLint + Prettier**. Code must pass `npm run lint`
  and `npm run format:check` with no errors.
- **Architecture:** **Feature-Sliced Design (FSD)**. Organize by layer then
  slice; dependencies point downward only (`app → pages → widgets → features →
  entities → shared`). A slice never imports from a layer above it.
- **Principles:** SOLID, KISS, DRY. Reference and follow existing patterns in the
  codebase before introducing a new architectural style.
- **Functions over classes:** prefer pure functions and **factory functions
  returning closures** to `class`-based services; **avoid `this`**. Use **React
  hooks** for component state and logic (no class components, no `this`). *Sole
  sanctioned exception:* custom `Error` subclasses (`class extends Error`), which
  need a class for `instanceof` checks.
- **Effects are a last resort.** Derive values with `useMemo`, handle user
  actions in event handlers, and reach for `useEffect` only for genuine external
  synchronization (initial data load, param-driven refetch, subscriptions,
  non-React event listeners) — never to mirror or transform props/state.
  Memoize expensive derivations with `useMemo`; stabilize callbacks passed to
  children or used as effect deps with `useCallback`.
- **API calls live in a service layer, not in hooks or components.** Each
  consuming slice has an `api/` segment of service functions that call the
  `TicketApi` and return a typed `Result` (`{ ok, value } | { ok, error }`, via
  `runRequest`). Hooks orchestrate state from the `Result`; they contain no
  `try/catch` around requests.
- **Naming:** names must say what they hold or do. **No vague names** (`Db`,
  `data`, `tmp`, `foo`, `obj`, `val`). **Do not shadow globals or reserved
  identifiers** — e.g. avoid type/variable names like `Comment`, `Event`,
  `Element`, `Document`, `Map`, `Error`; qualify them (`TicketComment`,
  `DomainEvent`). Booleans read as predicates (`isVerified`, `hasTickets`).
- **No abbreviations or cryptic short names** for things with a clear full name
  — `classNames` not `cn`, `description` not `desc`. Name array-callback params
  after the element (`team`, `ticket`), not `t`/`x`.
  **Accepted conventional short names** (use freely): `i` (loop index), `acc`
  (reduce accumulator), `err` (caught error), `ctx` (context), single-letter
  generic type params (`T`, `K`, `V`), and whole well-known acronyms (`id`,
  `url`, `api`, `http`, `iso`).
- **Complexity:** keep hot paths (loops, sorts, filters) at **O(n)** / **O(n
  log n)** / **O(1)**; no accidental nested-loop blowups.
- **Readability over cleverness:** no over-engineering, no unrequested
  abstractions, no premature optimization. Simple and understandable wins.

### Anti-patterns (do not do)

- Inline styles (use CSS Modules).
- Unhandled async errors — every `await`/Promise has an error path.
- Oversized components — split into smaller components + hooks/utilities.
- Classic `for`, `for...of`, `for...in` loops — prefer array methods
  (`map`/`filter`/`reduce`/`some`/`every`). (Performance-critical exceptions must
  be justified in a comment.)
- `this` and `class`-based services / class components — use factory functions
  and hooks instead.
- `useEffect` that only derives state from other state — use `useMemo`.
- Inline `api`/`fetch` calls with `try/catch` inside hooks or components — call
  the slice's service layer, which returns a `Result`.
- Vague names and names that shadow globals/reserved identifiers (see Naming).

### Testing

- **Vitest** for unit/integration tests on **core features** (workflow rules,
  service-layer logic, key components and flows).
- Tests live next to the code they cover (`*.test.ts(x)`).
- At minimum, cover **one backend business flow** and **one frontend/API flow**
  (REQUIREMENTS §11).

### API access

The backend exists; the frontend talks to it over the `TicketApi` HTTP seam
(REQUIREMENTS §9).

- **All data access goes through the `TicketApi` seam** (`FE/src/shared/api`).
  Components and hooks never call `fetch`/`api.*` directly.
- Keep the base URL in **one configurable place** — `API_BASE_URL` in
  `FE/src/shared/api/config.ts`, defaulting to `'/api'` and overridable at build
  time via `VITE_API_BASE_URL`. Never scatter literal URLs across the code. In
  local dev the Vite dev server proxies `/api` to the backend on `:3000`; in the
  container nginx proxies `/api` instead.
- The in-memory stub adapter behind the same interface is **test-only** (Vitest);
  it must never become a runtime code path in a real build.

### Security & data rules (non-negotiable)

Durable constraints that always apply; full detail in REQUIREMENTS §3, §9, §11.

- **Passwords** are never stored in plain text — hash with **Argon2id** (or an
  equivalent established algorithm). Minimum 8 characters.
- **Backend validation is authoritative.** Validate every enum and reference
  server-side; client-side validation is never sufficient on its own.
- **Auth-gate everything** except sign-up, login, email verification, and
  verification-email resend (plus static assets / health endpoints).
- **No secrets in source control** — SMTP credentials, tokens, keys come from
  configuration/environment, never committed.
- **Never put session IDs, access tokens, or bearer tokens in URLs.** (A
  single-use email-verification token in the verification URL is the one
  exception.)
- **Persistence & reliability** — all create/update/delete go through the API
  and persist in the RDBMS; a browser refresh or restart must not lose data.
  (localStorage is not the system of record — see §1.)
- **Timestamps** are server-set in **UTC**, serialized as **ISO-8601**.
- **Schema via migrations**; a fresh database loads **no seed/sample data**.

### Code completeness

- Never truncate code. Always provide the **full** implementation or full file.
- When presenting a complete file in chat, end the message with the literal token
  `not truncated` to confirm completeness. (This applies to chat output — do not
  append the token inside source files, as it would break them.)

---

## 3. Markup & Styling

- **Match the provided designs** in [docs/design/](docs/design/). Aim for
  visually identical markup, not pixel-perfect. Build clean, semantic markup; no
  unused styles, no needless repetition.
- **CSS Modules** only. Keep selector specificity low and intentional so styles
  render as designed without conflicts; minimize `!important` (avoid unless
  genuinely unavoidable, with a comment explaining why).
- **Target browsers:** current desktop versions of **Chrome, Edge, and Firefox**
  (REQUIREMENTS §11). Avoid bleeding-edge CSS/JS without fallbacks for those.
- **Desktop-only:** responsive/mobile layouts are not required. Build for common
  desktop/laptop widths; no mobile guarantee.

---

## 4. Design Reference

Screen-by-screen UI specs live separately in [docs/design/](docs/design/) — they
change with the design, not with these rules. Match them per §3 when building
each screen.

---

## 5. Cross-platform / QA

- Must run on a clean Windows, macOS, or Linux laptop. Commands live in
  [CLAUDE.md](CLAUDE.md#commands) (not repeated here).
- **Running the system:** `docker compose up --build` from the repo root brings
  up the full stack (db + backend API + frontend) with no host Node/Postgres
  required (REQUIREMENTS §6). For host-based frontend dev, `npm run dev` needs the
  backend reachable on `:3000` (run it via Docker or `cd BE && npm run dev`) —
  the frontend always talks to the real API, so it is **not** standalone.
- Node version pinned via `.nvmrc` and `engines` in `package.json`.
