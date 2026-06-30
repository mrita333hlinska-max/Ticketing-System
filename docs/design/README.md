# Design Reference

Screen-by-screen specs for the Ticketing System UI, transcribed from the
provided mockups. Build markup to match these visually (not pixel-perfect) per
the styling rules in [PROJECT_RULES.md](../../PROJECT_RULES.md) §3.

> This file changes whenever the design changes. Keep durable engineering rules
> out of here — those live in PROJECT_RULES.md.

## Shell (all authenticated screens)

- Top nav: brand **TICKET TRACKER** (left), section tabs **Board · Teams ·
  Epics** (active tab highlighted), user email menu `alex@example.com ▾` (right).

## Board

- **Team** selector (e.g. "Payments Team") top-left; **+ New ticket** (dark
  button) top-right.
- Filter bar: **Search title…** input, **Type** select (All types / Bug /
  Feature…), **Epic** select (All epics…), **Clear** button, and a `N tickets`
  count on the right.
- Five fixed Kanban columns, each with a header label + count badge:
  **NEW**, **READY FOR IMPLEMENTATION**, **IN PROGRESS**, **READY FOR
  ACCEPTANCE**, **DONE**.
- **Ticket card:** type badge (`BUG` / `FEATURE`), title, `Epic: <name>`, and a
  relative time (`2h ago`, `1d ago`).

## Ticket detail

- Breadcrumb `← Back to <Team>`; meta line `TCK-#### • Created by … • Created … •
  Modified …`; large title; **Delete** + **Save** actions (top-right).
- Left panel form: **Team**, **Type**, **State** selects; **Epic** select;
  **Title** input; **Body** textarea.
- Right panel: **Comments** (count, list of author/time/text, add-comment box +
  **Post comment**).

## Teams

- Heading + caption "All verified users can view and manage all teams."; **+
  Create team** button.
- Table: **Name | Tickets | Epics | Modified | Actions (Edit / Delete)**.
- **Delete disabled** while a team has tickets or epics.
- Create-team panel: **Team name** input + **Create**.

## Epics

- **Team** selector; **+ Create epic** button.
- Table: **Title | Tickets | Modified | Actions (Edit / ✕)**.
- **Delete (✕) disabled** while tickets reference the epic.
- Edit-epic panel: **Title** input, **Description (optional)** textarea, **Cancel
  / Save**.

## Authentication flow

- **Log in:** Email, Password, **Log in**, "Account not verified? **Resend
  email**", "Create an account →".
- **Create account:** Email, Password (placeholder "Minimum 8 characters"),
  Confirm password, **Sign up**, "Already registered? Log in →". Email
  verification required.
- **Email verification:** verified success state → **Continue to login**; plus an
  expired/invalid-link error state with a resend action.
