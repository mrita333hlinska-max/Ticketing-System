/**
 * Authentication guard (REQUIREMENTS §3).
 *
 * Rejects any request without a signed-in session as 401. Mounted on the `/api`
 * router *after* the public auth routes, so everything below it is protected
 * while sign-up / login / verify / resend / me stay open.
 */
import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../lib/errors';

export function requireAuth(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  if (!request.session.userId) {
    next(new UnauthorizedError());
    return;
  }
  next();
}

/**
 * The current user id, for handlers running behind {@link requireAuth}. Throws
 * 401 if somehow called without a session (defensive; the guard runs first).
 */
export function getUserId(request: Request): string {
  const { userId } = request.session;
  if (!userId) throw new UnauthorizedError();
  return userId;
}
