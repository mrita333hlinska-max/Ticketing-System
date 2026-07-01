/**
 * Ticket HTTP routes (REQUIREMENTS §6, §8). Mounted behind `requireAuth`.
 *
 *   GET    /tickets?teamId=  → 200 Ticket[]   (per-team board query)
 *   GET    /tickets/:id       → 200 Ticket
 *   POST   /tickets           → 201 Ticket     (createdBy from the session)
 *   PATCH  /tickets/:id        → 200 Ticket     (edit; also drag-and-drop { status })
 *   DELETE /tickets/:id        → 204            (comments cascade)
 */
import { Router } from 'express';
import { getUserId } from '../../http/middleware/requireAuth';
import { parseBody } from '../../lib/validate';
import { createTicketSchema, updateTicketSchema } from './tickets.schema';
import type { TicketService } from './tickets.service';

export function createTicketsRouter(service: TicketService): Router {
  const router = Router();

  router.get('/', async (request, response) => {
    const { teamId } = request.query;
    const filter = typeof teamId === 'string' ? teamId : undefined;
    response.json(await service.list(getUserId(request), filter));
  });

  router.get('/:id', async (request, response) => {
    response.json(await service.get(request.params.id, getUserId(request)));
  });

  router.post('/', async (request, response) => {
    const input = parseBody(createTicketSchema, request.body);
    response.status(201).json(await service.create(input, getUserId(request)));
  });

  router.patch('/:id', async (request, response) => {
    const patch = parseBody(updateTicketSchema, request.body);
    response.json(await service.update(request.params.id, patch, getUserId(request)));
  });

  router.delete('/:id', async (request, response) => {
    await service.remove(request.params.id, getUserId(request));
    response.status(204).end();
  });

  return router;
}
