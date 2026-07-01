/**
 * Vitest global setup: (re)create the disposable test database once before the
 * suite runs, then apply all migrations — so tests always start against the
 * current schema with no data (mirrors the production init path, §9).
 *
 * The database is dropped and recreated each run so schema changes (new
 * NOT NULL columns, etc.) always apply cleanly regardless of prior state.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { ADMIN_DATABASE_URL, TEST_DATABASE_URL, TEST_DB_NAME } from './testDb';

const { Pool } = pg;

export default async function setup(): Promise<void> {
  const admin = new Pool({ connectionString: ADMIN_DATABASE_URL });
  try {
    // Drop any lingering connections, then recreate the database from scratch.
    await admin.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
       WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [TEST_DB_NAME],
    );
    await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
    await admin.query(`CREATE DATABASE ${TEST_DB_NAME}`);
  } finally {
    await admin.end();
  }

  const pool = new Pool({ connectionString: TEST_DATABASE_URL });
  try {
    await migrate(drizzle(pool), { migrationsFolder: './drizzle' });
  } finally {
    await pool.end();
  }
}
