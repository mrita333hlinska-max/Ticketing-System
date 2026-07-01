/**
 * Automated, repeatable schema initialization (REQUIREMENTS §9).
 *
 * Applies any pending SQL migrations from `./drizzle`. Called on server boot
 * (before serving traffic) and runnable standalone via `npm run db:migrate`.
 * A fresh database ends up with schema + migration metadata only — no seed
 * data (§9).
 */
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './client';

export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder: './drizzle' });
}

// Run directly (`tsx src/db/migrate.ts`) — but stay a no-op side-effect when
// imported by the server boot path.
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  runMigrations()
    .then(() => {
      console.log('Migrations applied.');
      return pool.end();
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exitCode = 1;
      return pool.end();
    });
}
