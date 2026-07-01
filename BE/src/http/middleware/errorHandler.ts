/**
 * Terminal error handling (REQUIREMENTS §9).
 *
 * Every thrown/forwarded error funnels here. Known {@link ApiError}s become
 * `{ message }` with their status code — the exact shape the FE's HTTP adapter
 * reads (`data.message`). Anything unexpected is logged and returned as a
 * generic 500, never leaking internals to the client.
 */
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../lib/errors';

export function notFoundHandler(_request: Request, response: Response): void {
  response.status(404).json({ message: 'Not found.' });
}

// Express identifies error handlers by their four-parameter signature, so
// `next` must be present even though it is unused here.
export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof ApiError) {
    response.status(error.status).json({ message: error.message });
    return;
  }

  console.error('Unhandled error:', error);
  response.status(500).json({ message: 'Internal server error.' });
}
