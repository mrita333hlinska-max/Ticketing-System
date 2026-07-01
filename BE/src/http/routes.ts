/**
 * The `/api` router — the application/API tier's routing table.
 *
 * Order matters: public auth routes mount first, then {@link requireAuth} gates
 * everything below it, then the protected module routers mount (REQUIREMENTS
 * §3). Remaining module routers are added in later phases:
 *   Phase 4 — /teams    Phase 5 — /epics    Phase 6 — /tickets
 *   Phase 7 — /tickets/:id/comments, /users
 */
import { Router } from 'express';
import { db } from '../db/client';
import { createMailer } from '../lib/mailer';
import { createAuthRepository } from '../modules/auth/auth.repo';
import { createAuthRouter } from '../modules/auth/auth.routes';
import { createAuthService } from '../modules/auth/auth.service';
import { createTeamRepository } from '../modules/teams/teams.repo';
import { createTeamsRouter } from '../modules/teams/teams.routes';
import { createTeamService } from '../modules/teams/teams.service';
import { requireAuth } from './middleware/requireAuth';

export function createApiRouter(): Router {
  const api = Router();

  // --- Public routes (no session required, §3) ---
  const authRepo = createAuthRepository(db);
  const authService = createAuthService({ repo: authRepo, mailer: createMailer() });
  api.use('/auth', createAuthRouter(authService, authRepo));

  // --- Everything below requires an authenticated session ---
  api.use(requireAuth);

  // --- Protected module routers ---
  api.use('/teams', createTeamsRouter(createTeamService({ repo: createTeamRepository(db) })));
  // api.use('/epics', createEpicsRouter());       // Phase 5
  // api.use('/tickets', createTicketsRouter());    // Phase 6
  // api.use('/users', createUsersRouter());        // Phase 7

  return api;
}
