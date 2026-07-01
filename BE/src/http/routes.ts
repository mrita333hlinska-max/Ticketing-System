/**
 * The `/api` router — the application/API tier's routing table.
 *
 * Order matters: public auth routes mount first, then {@link requireAuth} gates
 * everything below it, then the protected module routers mount (REQUIREMENTS
 * §3). Module routers are added in later phases:
 *   Phase 3 — /auth (public)          Phase 6 — /tickets
 *   Phase 4 — /teams                  Phase 7 — /tickets/:id/comments, /users
 *   Phase 5 — /epics
 */
import { Router } from 'express';
import { requireAuth } from './middleware/requireAuth';

export function createApiRouter(): Router {
  const api = Router();

  // --- Public routes (no session required, §3) ---
  // api.use('/auth', createAuthRouter());   // Phase 3

  // --- Everything below requires an authenticated session ---
  api.use(requireAuth);

  // --- Protected module routers (added in later phases) ---
  // api.use('/teams', createTeamsRouter());
  // api.use('/epics', createEpicsRouter());
  // api.use('/tickets', createTicketsRouter());
  // api.use('/users', createUsersRouter());

  return api;
}
