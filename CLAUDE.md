# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Authoritative docs — read before changing code:**
> - [PROJECT_RULES.md](PROJECT_RULES.md) — engineering rules, coding standards, anti-patterns, architecture (**how to build**).
> - [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) — functional + non-functional spec (**what to build**).
> - [docs/design/](docs/design/) — screen-by-screen UI reference (**what it looks like**).
>
> The notes below are a quick orientation; the docs above win on any conflict.

## Project status

The frontend is **scaffolded** (Vite + React + TypeScript) and runs, but is being
reworked to match the full spec. The placeholder board/state code under `src/`
predates REQUIREMENTS.md — see its **Reconciliation** table for the deltas
(localStorage → backend API, new states/types, auth, Epics, Comments, no seed
data). Treat REQUIREMENTS.md as the target, not the current `src/` contents.

## What we're building

A single-page app where **verified users** organize work **tickets by team** and
move them through a **fixed 5-state Kanban workflow**, with Teams, Epics,
Comments, and an email-verified auth flow. The system of record is a **backend
RDBMS reached over an API** — not browser storage. Full detail in
[docs/REQUIREMENTS.md](docs/REQUIREMENTS.md).

## Commands

- `npm install` — install dependencies (Node ≥ 18.18; see `.nvmrc`).
- `npm run dev` — start the Vite dev server.
- `npm run build` / `npm run preview` — production build / preview.
- `npm test` — run Vitest (`npm run test:watch` to watch; `vitest run <path>` for one file).
- `npm run lint` / `npm run format` — ESLint / Prettier.
