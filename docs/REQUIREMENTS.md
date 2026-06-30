# Requirements Specification

Authoritative **functional and non-functional requirements** for the Ticketing
System. Section numbers mirror the source brief (§3–§11) for traceability.

- **What to build** → this file.
- **How to build it** (standards, anti-patterns, architecture) → [PROJECT_RULES.md](../PROJECT_RULES.md).
- **What screens look like** → [docs/design/](design/).

> Note on current code: the existing `localStorageAdapter` / `seed.ts` were an
> early frontend-only stand-in. Per §9 and §11 they are **not** the target: the
> system of record is a backend RDBMS reached over an API, and a fresh database
> must load **no** seed data. See [Reconciliation](#reconciliation-with-current-code).

---

## 3. User Accounts & Authentication

- Sign up with **email + password**. Emails are **trimmed**, compared
  **case-insensitively**, and must be **unique**.
- Log in / log out with **local credentials**. SSO / external IdPs are **not**
  required.
- Passwords: **≥ 8 characters**, **never stored in plain text**, hashed with an
  established algorithm such as **Argon2id**.
- After sign-up, send an **email-verification** message via a **configurable
  SMTP** service. Implementation must support **`relay1.dataart.com`**.
- A newly registered account **cannot use the main app until its email is
  verified**.
- Verification tokens/links **expire after 24 hours** and are **single-use**. A
  successful verification routes the user to the **login screen** (auto-login not
  required).
- An unverified user can **request a new verification email** from the login or
  verification-result screen. **Issuing a new token invalidates earlier unused
  tokens.**
- **All business screens and API endpoints require authentication**, except:
  sign-up, login, email verification, and verification-email resend. Static
  frontend assets and optional health/readiness endpoints may be public.

## 4. Teams

- Tickets are **grouped by team**.
- Authenticated users can **view, create, rename, and delete** teams.
- A team has at least: **identifier, name, created timestamp, modified
  timestamp**.
- Team names: **non-empty after trimming**, **unique case-insensitively**.
- A team **cannot be deleted while it contains tickets or epics**. The UI must
  show a **clear validation message**; **cascading deletion is not allowed**.
- Team ownership/membership is **out of scope**. **All verified users can view
  and manage all teams.**

## 5. Epics

- Each epic belongs to **exactly one team**, chosen at creation and
  **immutable** thereafter (moving epics between teams is out of scope).
- Provide a **separate screen** for epic CRUD: create, list, edit, delete.
- An epic has at least: **identifier, team reference, title, optional
  description, created timestamp, modified timestamp**.
- Epic **titles non-empty after trimming**.
- A ticket may **optionally reference one epic**, selected from a drop-down.
- A ticket may reference **only an epic from the same team** as the ticket; the
  **backend must enforce** this.
- An epic **cannot be deleted while tickets reference it**; the UI must show a
  clear validation message.

## 6. Tickets

### Fields

| Field | Required | Allowed values / type | Notes |
| --- | --- | --- | --- |
| **ID** | Yes | System-generated identifier | Stable and unique. |
| **Team** | Yes | Reference to a team | Determines the board. Must reference an existing team. |
| **Type** | Yes | `bug` \| `feature` \| `fix` | Exactly these three. Classification labels only — no workflow difference between them. |
| **State** | Yes | `new` \| `ready_for_implementation` \| `in_progress` \| `ready_for_acceptance` \| `done` | Canonical API values. UI shows human-readable labels with spaces. Workflow is fixed; no custom states. |
| **Epic** | No | Reference to an epic | From the ticket's team. Must be null or an epic of that same team. |
| **Title** | Yes | Text | Non-empty after trimming. Short display text; no mandatory max length. |
| **Body** | Yes | Long text | Non-empty. Plain text or Markdown; rich-text not required. No mandatory max length. |
| **Created at** | Yes | Timestamp | Set by server in **UTC** at creation. |
| **Modified at** | Yes | Timestamp | Set by server in **UTC** whenever ticket fields or state change. **Adding a comment does not change it.** |
| **Created by** | Yes | Reference to user | Set automatically from the authenticated user. |

### Operations

- **Create** a ticket.
- **Open / view** all fields, including created by, created at, modified at.
- **Edit** type, team, epic, title, body, and state.
- **Modified at** reflects the latest *actual* field/state change — **saving
  unchanged values must not advance it**.
- When a ticket's **team changes**, the UI must **clear or replace** any selected
  epic; the backend must **reject** a ticket whose epic belongs to a different
  team.
- **Delete** a ticket after **explicit confirmation**. Deleting a ticket also
  **deletes its comments**.
- State changes via **drag-and-drop persist immediately** in the database.
- The **backend must validate all enum values and references** — client-side
  validation alone is insufficient.

## 7. Comments

- Authenticated users can **add comments** to a ticket.
- A comment contains: **identifier, ticket reference, author, body, created
  timestamp**.
- Bodies must be **non-empty**.
- Displayed **chronologically, oldest first**.
- Adding a comment **does not update the ticket's modified timestamp** and so
  does not change board ordering.
- Comments are **immutable** after creation (mandatory scope). Edit/delete are
  optional stretch features.

## 8. Kanban Board

- Primary screen: a Kanban board for **one selected team**.
- Exactly **five columns**, one per ticket state, in **workflow order**.
- Each ticket is a **card** showing at least **title and type** (epic
  recommended).
- **Drag a card** between columns → changes its state and **persists via the
  backend API**.
- If a drag-drop update **fails**, the card **returns to its previous column**
  and the UI shows an **error**.
- Cards may move **directly between any two states** — sequential transitions are
  **not** enforced.
- Within a column, cards are ordered **most recently modified first**. Persisting
  a custom manual order is not required.
- Provide clear ways to **create** a ticket and **open** an existing one.
- Provide at minimum: filter by **type** and **epic**, plus **case-insensitive
  substring search** over title. Active filters combine with **AND**; client- or
  server-side is acceptable.
- Must remain usable with **≥ 100 tickets** on one team board.

## 9. API & Persistence Expectations

> Build only the **frontend** parts needed for now; document the contract so the
> backend can follow.

- All **create/update/delete** go through the **backend API** and persist in the
  **RDBMS**.
- The app **must not** rely on **browser local storage as the system of record**.
- Use **DB constraints and/or server-side validation** for referential
  integrity.
- Return **meaningful HTTP status codes** for validation, auth, missing-record,
  and conflict cases. Deleting a team with tickets/epics, or an epic referenced
  by tickets, returns **HTTP 409 Conflict**.
- IDs may be **UUIDs or DB-generated numerics**. API timestamps use **ISO-8601 in
  UTC**.
- **Cookie sessions or bearer tokens** both acceptable. **Session IDs / access
  tokens / bearer tokens must never appear in URLs.** A **single-use
  email-verification token may be in the verification URL**.
- **No concurrent-edit conflict detection** required — last successful write
  wins.
- DB schema creation is **automated via migrations** or an equivalent repeatable
  init mechanism.
- After migrations, a **fresh database contains no** users, teams, epics,
  tickets, or comments (migration metadata allowed). **Default startup must not
  load sample/seed data** — QA creates test data via the UI or API.

## 10. Minimum Screens

1. Sign-up screen.
2. Email-verification result screen.
3. Verification-email **resend** action (unverified / expired-token cases).
4. Login screen.
5. Kanban board with **team selector**.
6. Ticket **create / edit / details** view.
7. **Team management** screen.
8. **Epic management** screen.

## 11. Non-Functional Requirements

- **Security:** protect authenticated endpoints; hash passwords; validate input;
  never expose credentials or SMTP secrets in source control.
- **Reliability:** a browser refresh or app restart **must not lose persisted
  data**.
- **Usability:** display **loading, empty, success, and error** states where
  applicable.
- **Compatibility:** support a current desktop version of **Chrome, Edge, or
  Firefox**. Desktop-only — responsive/mobile layouts are not required. (Safari,
  Opera, and older browser versions are out of scope.)
- **Maintainability:** include a **README** with prerequisites, configuration,
  and startup commands.
- **Testing:** automated tests covering at least **one backend business flow**
  and **one frontend or API flow**.

---

## Reconciliation with current code

Deltas between this spec and what currently exists in the repo, to resolve when
building:

| Area | Current code | Required by spec |
| --- | --- | --- |
| **System of record** | `localStorageAdapter` is the store | Backend API + RDBMS; localStorage must **not** be the source of record (§9) |
| **Seed data** | `seed.ts` auto-loads sample tickets | Fresh DB must be **empty**; no default seed (§9) |
| **Ticket states** | `backlog/todo/in_progress/in_review/done` | `new/ready_for_implementation/in_progress/ready_for_acceptance/done` (§6) |
| **Workflow moves** | `canTransition` enforces single-step moves | Any-to-any moves allowed; no sequential enforcement (§8) |
| **Ticket fields** | no `type`, `epic`, `body`, `createdBy` | add `type` (bug/feature/fix), optional `epic`, `body`, `createdBy` (§6) |
| **Auth** | none | full sign-up / login / email-verification flow (§3) |
| **Entities** | Team, User, Ticket | add **Epic** and **Comment** (§5, §7) |

The `TicketApi` interface remains the right seam: keep it, and back it with an
**HTTP adapter** to the backend rather than localStorage.
