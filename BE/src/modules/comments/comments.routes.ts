/**
 * Comment HTTP routes (REQUIREMENTS §7). Mounted at
 * `/tickets/:ticketId/comments` behind `requireAuth`; `mergeParams` exposes the
 * parent `:ticketId`.
 *
 *   GET  /tickets/:ticketId/comments  → 200 TicketComment[]  (oldest-first)
 *   POST /tickets/:ticketId/comments  → 201 TicketComment     (author from session)
 */
import { Router } from 'express';
import { getUserId } from '../../http/middleware/requireAuth';
import { parseBody } from '../../lib/validate';
import { createCommentSchema } from './comments.schema';
import type { CommentService } from './comments.service';

/** Params merged in from the parent mount `/tickets/:ticketId/comments`. */
type CommentParams = { ticketId: string };

export function createCommentsRouter(service: CommentService): Router {
  const router = Router({ mergeParams: true });

  router.get('/', async (request, response) => {
    const { ticketId } = request.params as CommentParams;
    response.json(await service.list(ticketId));
  });

  router.post('/', async (request, response) => {
    const { ticketId } = request.params as CommentParams;
    const { body } = parseBody(createCommentSchema, request.body);
    response.status(201).json(await service.add(ticketId, body, getUserId(request)));
  });

  return router;
}
