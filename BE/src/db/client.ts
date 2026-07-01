/**
 * The database connection — a single pooled Drizzle client for the whole app
 * (persistence tier). Repositories import `db`; nothing else opens connections.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '../config/env';
import * as schema from './schema';

// `pg` is CommonJS; destructure the default export under ESM.
const { Pool } = pg;

export const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool, { schema });

export type Database = typeof db;
