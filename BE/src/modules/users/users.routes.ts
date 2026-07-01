/**
 * User directory route (REQUIREMENTS §3). Mounted behind `requireAuth`.
 *
 *   GET /users → 200 User[]   (public shape; no password hashes)
 */
import { Router } from 'express';
import type { UserService } from './users.service';

export function createUsersRouter(service: UserService): Router {
  const router = Router();

  router.get('/', async (_request, response) => {
    response.json(await service.list());
  });

  return router;
}
