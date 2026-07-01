/**
 * Auth HTTP routes (REQUIREMENTS §3, §10). All public — mounted before the
 * `requireAuth` gate. Handlers stay thin: validate the body, call the service,
 * shape the response. Thrown errors propagate to the terminal error handler
 * (Express 5 forwards rejected async handlers automatically).
 *
 * Endpoints (matching the FE's HTTP adapter):
 *   POST /signup  → 201 User      POST /verify  → 204
 *   POST /login   → 200 User      POST /resend  → 204
 *   POST /logout  → 204           GET  /me      → 200 User | null
 */
import { Router } from 'express';
import {
  destroySession,
  regenerateSession,
  saveSession,
} from '../../http/session';
import { parseBody } from '../../lib/validate';
import { toPublicUser } from './auth.helpers';
import type { AuthRepository } from './auth.repo';
import { loginSchema, resendSchema, signupSchema, verifySchema } from './auth.schema';
import type { AuthService } from './auth.service';

export function createAuthRouter(
  service: AuthService,
  repo: AuthRepository,
): Router {
  const router = Router();

  router.post('/signup', async (request, response) => {
    const user = await service.signUp(parseBody(signupSchema, request.body));
    response.status(201).json(user);
  });

  router.post('/login', async (request, response) => {
    const user = await service.authenticate(parseBody(loginSchema, request.body));
    // New session id on privilege change (fixation defence), then persist.
    await regenerateSession(request);
    request.session.userId = user.id;
    await saveSession(request);
    response.status(200).json(user);
  });

  router.post('/logout', async (request, response) => {
    await destroySession(request);
    response.clearCookie('sid');
    response.status(204).end();
  });

  // Public and must return 200 with `null` (not 401) when signed out — the FE
  // reads the body to decide session state.
  router.get('/me', async (request, response) => {
    const { userId } = request.session;
    if (!userId) {
      response.status(200).json(null);
      return;
    }
    const user = await repo.findUserById(userId);
    response.status(200).json(user ? toPublicUser(user) : null);
  });

  router.post('/verify', async (request, response) => {
    const { token } = parseBody(verifySchema, request.body);
    await service.verifyEmail(token);
    response.status(204).end();
  });

  router.post('/resend', async (request, response) => {
    const { email } = parseBody(resendSchema, request.body);
    await service.resendVerification(email);
    response.status(204).end();
  });

  return router;
}
