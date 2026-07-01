---
name: backend
description: Pointers for editing the Express + Drizzle API. Auto-loads when touching files under BE/.
paths:
  - "BE/**"
---

# Backend (BE/) — pointers

The authoritative BE rules live in [PROJECT_RULES.md](../../PROJECT_RULES.md) §2 —
especially the **non-negotiable security section** (passwords, server-side zod
validation, auth-gating, no tokens in URLs, UTC/ISO-8601 timestamps). Read it before
changing BE code — this file only points at what's easy to miss; it does **not**
restate the rules.

- **Module pattern & new endpoints:** see "Creating new code" in
  [CLAUDE.md](../../CLAUDE.md) and run the `/api-module` skill.
- **Router wiring:** `BE/src/http/routes.ts` — public routes above `requireAuth`,
  protected below. **Env / secrets:** `BE/src/config/env.ts`, never hardcoded.
- **Migrations:** see the migrations rule (and the migration-guard hook).

Testing conventions live in the testing rule.
