/**
 * Public API of the data layer. Import from `@/shared/api`.
 *
 * `api` is the single app-wide instance. Today it is the stub (localStorage-
 * backed when available, in-memory otherwise). Switching to the real backend is
 * a one-line change here — construct `HttpAdapter` instead — with no UI edits.
 */
import { createStubApi } from './stubAdapter';

export type { TicketApi } from './ticketApi';
export { runRequest, type Result } from './result';
export { API_BASE_URL } from './config';
export {
  ApiError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  type ApiErrorCode,
} from './errors';
export { createStubApi, type StubApi } from './stubAdapter';
export { createHttpAdapter } from './httpAdapter';

const browserStorage =
  typeof window !== 'undefined' ? window.localStorage : undefined;

export const api = createStubApi(browserStorage);
