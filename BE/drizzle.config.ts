/**
 * drizzle-kit configuration.
 *
 * `generate` (producing SQL migration files from the schema) needs no live
 * database, so we read DATABASE_URL directly from the environment with a local
 * fallback rather than through the strict `env` validator — that keeps
 * `npm run db:generate` runnable offline. `migrate`/`studio` do connect and
 * expect a real DATABASE_URL.
 */
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgres://postgres:postgres@localhost:5432/ticketing',
  },
  strict: true,
  verbose: true,
});
