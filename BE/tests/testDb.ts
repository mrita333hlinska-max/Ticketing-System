/**
 * Test-database configuration. The integration suite runs against a dedicated
 * `*_test` database — never the dev/production data — created and migrated in
 * global setup. Override with DATABASE_URL_TEST; the default targets the
 * compose Postgres published on localhost.
 */
const DEFAULT_TEST_URL =
  'postgres://postgres:postgres@127.0.0.1:5432/ticketing_test';

export const TEST_DATABASE_URL =
  process.env.DATABASE_URL_TEST ?? DEFAULT_TEST_URL;

const parsed = new URL(TEST_DATABASE_URL);

/** The database name to create (e.g. `ticketing_test`). */
export const TEST_DB_NAME = parsed.pathname.slice(1);

/** Same server, but the `postgres` maintenance DB — used to CREATE DATABASE. */
export const ADMIN_DATABASE_URL = (() => {
  const admin = new URL(TEST_DATABASE_URL);
  admin.pathname = '/postgres';
  return admin.toString();
})();
