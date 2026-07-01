/**
 * Assembles the Express application (the application/API tier).
 *
 * Middleware order:
 *   1. JSON body parsing.
 *   2. `/health` — public readiness probe, mounted BEFORE sessions so the
 *      compose healthcheck never touches the session store.
 *   3. Session middleware (cookie ⇄ Postgres-backed store).
 *   4. `/api` router (public auth routes + guarded module routes).
 *   5. 404 for anything unmatched, then the terminal error handler.
 */
import express, { type Express } from 'express';
import { env } from '../config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { createApiRouter } from './routes';
import { createSessionMiddleware } from './session';

export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');

  // Behind nginx/TLS in production, trust the proxy so secure cookies work.
  if (env.COOKIE_SECURE) app.set('trust proxy', 1);

  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use(createSessionMiddleware());
  app.use('/api', createApiRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
