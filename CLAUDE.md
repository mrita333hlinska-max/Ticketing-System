# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository is currently a greenfield project. It contains only `README.md` and `LICENSE` — there is no source code, build system, package manifest, or tests yet. The sections below describe the **intended** system so that early implementation work stays aligned with the project's goals. Update this file with concrete build/lint/test commands and architecture notes once the stack is chosen and code lands.

## What we're building

A web application for organizing work tickets (per the README):

- **Registered users** authenticate and manage tickets.
- Tickets are **organized by team**.
- Tickets move through a **fixed Kanban workflow** (a defined sequence of status columns).
- The system must demonstrate three distinct layers:
  - a functional **user interface**,
  - **server-side business logic** (e.g. workflow transition rules, authorization), and
  - **persistent relational storage**.

## Architectural intent

These constraints come from the README and should shape early decisions:

- **Relational persistence is required** — use a relational database (not a document/NoSQL store). Expect core entities along the lines of User, Team, Ticket, and Status/WorkflowState.
- **Workflow is a state machine** — the Kanban flow is *fixed*, so valid status transitions should be enforced in server-side business logic, not just the UI. Treat allowed transitions as a central, testable rule rather than scattering them across handlers.
- **Three-tier separation** — keep UI, business logic, and data access as distinct layers so each can be reasoned about and tested independently.

## When adding the stack

Once a framework/language is chosen, replace this note and document here:

- How to install dependencies, run the dev server, and build for production.
- How to run the full test suite and a single test.
- How to run linting/formatting.
- Database setup: how to run migrations and seed local data.
- The concrete module layout and where the workflow-transition rules live.
