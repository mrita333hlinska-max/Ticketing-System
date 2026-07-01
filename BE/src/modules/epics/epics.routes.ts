/**
 * Epic HTTP routes (REQUIREMENTS §5). Mounted behind `requireAuth`.
 *
 *   GET    /epics?teamId=  → 200 Epic[]   (all, or filtered to one team)
 *   POST   /epics          → 201 Epic     (404 if the team doesn't exist)
 *   PATCH  /epics/:id       → 200 Epic     (team not changeable)
 *   DELETE /epics/:id       → 204          (409 if referenced by tickets)
 */
import { Router } from 'express';
import { parseBody } from '../../lib/validate';
import { createEpicSchema, updateEpicSchema } from './epics.schema';
import type { EpicService } from './epics.service';

export function createEpicsRouter(service: EpicService): Router {
  const router = Router();

  router.get('/', async (request, response) => {
    const { teamId } = request.query;
    const filter = typeof teamId === 'string' ? teamId : undefined;
    response.json(await service.list(filter));
  });

  router.post('/', async (request, response) => {
    const input = parseBody(createEpicSchema, request.body);
    response.status(201).json(await service.create(input));
  });

  router.patch('/:id', async (request, response) => {
    const input = parseBody(updateEpicSchema, request.body);
    response.json(await service.update(request.params.id, input));
  });

  router.delete('/:id', async (request, response) => {
    await service.remove(request.params.id);
    response.status(204).end();
  });

  return router;
}
