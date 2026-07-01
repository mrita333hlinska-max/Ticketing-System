/**
 * Cookie-based session middleware (REQUIREMENTS §3, §9).
 *
 * Sessions are stored server-side in PostgreSQL (via connect-pg-simple) and
 * referenced by an httpOnly, SameSite=Lax cookie — the session id never appears
 * in a URL. The FE's HTTP adapter sends `credentials: 'include'`, so the browser
 * carries this cookie automatically.
 *
 * `express-session` and its store are library classes we must instantiate; that
 * is fine (PROJECT_RULES §2 targets our own service code, not library types).
 */
import connectPgSimple from 'connect-pg-simple';
import session from 'express-session';
import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { pool } from '../db/client';

// The only thing we keep in the session: which user is signed in.
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function createSessionMiddleware(): RequestHandler {
  const PgStore = connectPgSimple(session);

  return session({
    name: 'sid',
    secret: env.SESSION_SECRET,
    store: new PgStore({
      pool,
      // Auto-create the session table on first use — a repeatable init that
      // holds no application data (§9). Application tables come from migrations.
      createTableIfMissing: true,
    }),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.COOKIE_SECURE,
      maxAge: SEVEN_DAYS_MS,
    },
  });
}
