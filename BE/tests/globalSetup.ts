/**
 * Vitest global setup: prepare the disposable test database once before the
 * suite runs. Creates the `*_test` database if it doesn't exist, then applies
 * all migrations — so tests start against the real schema, with no seed data
 * (mirrors the production init path, REQUIREMENTS §9).
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { ADMIN_DATABASE_URL, TEST_DATABASE_URL, TEST_DB_NAME } from './testDb';

const { Pool } = pg;

const DUPLICATE_DATABASE = '42P04'; // Postgres: database already exists

export default async function setup(): Promise<void> {
  const admin = new Pool({ connectionString: ADMIN_DATABASE_URL });
  try {
    await admin.query(`CREATE DATABASE ${TEST_DB_NAME}`);
  } catch (error) {
    if ((error as { code?: string }).code !== DUPLICATE_DATABASE) throw error;
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
