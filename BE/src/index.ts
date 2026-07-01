/**
 * Server entrypoint.
 *
 * Startup order: apply pending migrations (so the schema is ready before we
 * serve traffic), then start the HTTP server. SIGTERM/SIGINT trigger a graceful
 * shutdown that stops accepting connections and closes the DB pool.
 */
import type { Server } from 'node:http';
import { env } from './config/env';
import { pool } from './db/client';
import { runMigrations } from './db/migrate';
import { createApp } from './http/app';

async function main(): Promise<void> {
  await runMigrations();

  const app = createApp();
  const server: Server = app.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT} (env=${env.NODE_ENV}).`);
  });

  const shutdown = (signal: string): void => {
    console.log(`${signal} received — shutting down.`);
    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  console.error('Startup failed:', error);
  process.exitCode = 1;
});
