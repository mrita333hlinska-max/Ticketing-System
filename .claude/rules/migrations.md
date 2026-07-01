---
name: migrations
description: Drizzle migration safety rules. Auto-loads when touching the schema or the drizzle/ migration folder.
paths:
  - "BE/drizzle/**"
  - "BE/src/db/**"
  - "BE/drizzle.config.ts"
---

# Migration rules

The database is defined by an **ordered, append-only** set of Drizzle migrations in
`BE/drizzle/`. Getting this wrong corrupts every environment that already ran them.

## Workflow

1. Edit the schema in `BE/src/db/schema.ts`.
2. Run `cd BE && npm run db:generate` — Drizzle emits a **new** timestamped file in
   `drizzle/` plus a snapshot in `drizzle/meta/`. Review it.
3. Apply with `npm run db:migrate`.

## Hard rules

- **Never edit a committed migration file** in `BE/drizzle/`. Once a `*.sql` file and
  its `meta/*_snapshot.json` are committed, they are frozen — other environments have
  already applied them. A fix is always a **new** migration. (The migration-guard hook
  blocks edits to existing migration files.)
- **One logical change per migration.** Don't bundle unrelated schema changes.
- **A fresh database loads zero seed / sample rows.** Migrations define structure, not
  data. No `INSERT` of demo content.
- Never hand-edit `drizzle/meta/_journal.json` or the snapshots — they are generated.
- Destructive changes (drop column/table, type narrowing) need an explicit call-out in
  the PR description; prefer expand-then-contract over in-place destructive edits.
