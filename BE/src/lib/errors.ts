/**
 * API error model — the backend half of the shared error contract.
 *
 * These mirror the frontend's `FE/src/shared/api/errors.ts` one-to-one: same
 * status codes, same `code` strings. Handlers/services throw one of these; the
 * error-handling middleware turns it into `res.status(status).json({ message })`
 * (REQUIREMENTS §9), which is exactly what the FE's HTTP adapter expects.
 *
 * Subclassing `Error` is the one sanctioned use of `class` (PROJECT_RULES §2) —
 * it is needed for `instanceof` checks in the error handler.
 */
export type ApiErrorCode =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'unknown';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;

  constructor(message: string, status: number, code: ApiErrorCode) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** 400 — invalid input (empty/whitespace title, bad enum, etc.). */
export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400, 'validation');
    this.name = 'ValidationError';
  }
}

/** 401 — no authenticated session. */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required.') {
    super(message, 401, 'unauthorized');
    this.name = 'UnauthorizedError';
  }
}

/** 403 — authenticated but not allowed (e.g. email not verified). */
export class ForbiddenError extends ApiError {
  constructor(message: string) {
    super(message, 403, 'forbidden');
    this.name = 'ForbiddenError';
  }
}

/** 404 — entity does not exist. */
export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message, 404, 'not_found');
    this.name = 'NotFoundError';
  }
}

/**
 * 409 — request conflicts with current state: duplicate team name, deleting a
 * team that still has tickets/epics, or an epic still referenced by tickets.
 */
export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, 'conflict');
    this.name = 'ConflictError';
  }
}
