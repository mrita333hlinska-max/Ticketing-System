/**
 * Team HTTP routes (REQUIREMENTS §4). Mounted behind `requireAuth`, so every
 * handler runs for an authenticated session. Handlers stay thin: validate,
 * delegate to the service, shape the response.
 *
 *   GET    /teams        → 200 Team[]
 *   POST   /teams        → 201 Team      (409 on duplicate name)
 *   PATCH  /teams/:id     → 200 Team      (409 on duplicate name)
 *   DELETE /teams/:id     → 204           (409 if it has epics/tickets)
 */
import { Router } from 'express';
import { parseBody } from '../../lib/validate';
import { createTeamSchema, updateTeamSchema } from './teams.schema';
import type { TeamService } from './teams.service';

export function createTeamsRouter(service: TeamService): Router {
  const router = Router();

  router.get('/', async (_request, response) => {
    response.json(await service.list());
  });

  router.post('/', async (request, response) => {
    const { name } = parseBody(createTeamSchema, request.body);
    response.status(201).json(await service.create(name));
  });

  router.patch('/:id', async (request, response) => {
    const { name } = parseBody(updateTeamSchema, request.body);
    response.json(await service.rename(request.params.id, name));
  });

  router.delete('/:id', async (request, response) => {
    await service.remove(request.params.id);
    response.status(204).end();
  });

  return router;
}
