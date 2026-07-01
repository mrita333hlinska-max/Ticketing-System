---
name: frontend
description: Pointers for editing the React + TypeScript client. Auto-loads when touching files under FE/.
paths:
  - "FE/**"
---

# Frontend (FE/) — pointers

The authoritative FE rules live in [PROJECT_RULES.md](../../PROJECT_RULES.md) §2
(architecture, service layer, React discipline, naming) and §3 (styling). Read them
before changing FE code — this file only points at what's easy to miss; it does **not**
restate the rules.

- **Data seam:** all data goes through `TicketApi` (`FE/src/shared/api`) and returns a
  typed `Result` — canonical shapes in `shared/api/result.ts` and
  `features/manage-teams/api/teamsService.ts`. Base URL only in `shared/api/config.ts`.
- **Skills:** `/react-async-state` for a data screen (loading/error/empty/success),
  `/dragdrop-rollback` for an optimistic board move.
- **Creating a new slice?** See "Creating new code" in [CLAUDE.md](../../CLAUDE.md).

Testing conventions live in the testing rule — nothing test-specific belongs here.
