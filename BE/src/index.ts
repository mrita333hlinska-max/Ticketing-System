/**
 * Server entrypoint.
 *
 * Phase 0–1 scaffolding: validates configuration and confirms the database
 * connection + migrations are in place. The Express HTTP server (routes,
 * sessions, auth, error handling) is assembled here in Phase 2 — see
 * docs/ROADMAP-BE.md.
 */
import { env } from './config/env';
import { runMigrations } from './db/migrate';
import { pool } from './db/client';

async function main(): Promise<void> {
  await runMigrations();
  console.log(
    `Config OK (env=${env.NODE_ENV}). Migrations applied. ` +
      `HTTP server arrives in Phase 2 (port ${env.PORT}).`,
  );
  await pool.end();
}

main().catch((error) => {
  console.error('Startup failed:', error);
  process.exitCode = 1;
});
