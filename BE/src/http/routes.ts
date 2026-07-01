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
import { createEpicRepository } from '../modules/epics/epics.repo';
import { createEpicsRouter } from '../modules/epics/epics.routes';
import { createEpicService } from '../modules/epics/epics.service';
import { createTeamRepository } from '../modules/teams/teams.repo';
import { createTeamsRouter } from '../modules/teams/teams.routes';
import { createTeamService } from '../modules/teams/teams.service';
import { createTicketRepository } from '../modules/tickets/tickets.repo';
import { createTicketsRouter } from '../modules/tickets/tickets.routes';
import { createTicketService } from '../modules/tickets/tickets.service';
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
  const teamRepo = createTeamRepository(db);
  const epicRepo = createEpicRepository(db);
  const ticketRepo = createTicketRepository(db);

  api.use('/teams', createTeamsRouter(createTeamService({ repo: teamRepo })));
  api.use(
    '/epics',
    createEpicsRouter(createEpicService({ repo: epicRepo, teams: teamRepo })),
  );
  api.use(
    '/tickets',
    createTicketsRouter(
      createTicketService({ repo: ticketRepo, teams: teamRepo, epics: epicRepo }),
    ),
  );
  // api.use('/users', createUsersRouter());        // Phase 7

  return api;
}
