/**
 * Public API of the data layer. Import from `@/shared/api`.
 *
 * `api` is the single app-wide instance. It is the real HTTP adapter when built
 * with `VITE_USE_HTTP_API=true` (the containerized production build behind the
 * nginx `/api` proxy), and the localStorage/in-memory stub otherwise — so `npm
 * run dev`, Vitest, and Playwright keep running fully client-side with no
 * backend. Switching is a build-time flag; no UI code changes.
 */
import { createHttpAdapter } from './httpAdapter';
import { createStubApi, type StubApi } from './stubAdapter';

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

const useHttpApi = import.meta.env.VITE_USE_HTTP_API === 'true';

// Typed as StubApi so tests can use its reset()/getVerificationTokenFor()
// helpers. In production (VITE_USE_HTTP_API) the real HTTP adapter is used and
// those stub-only methods are never called, so the cast is safe. App code only
// ever uses the shared TicketApi surface.
export const api: StubApi = useHttpApi
  ? (createHttpAdapter() as unknown as StubApi)
  : createStubApi(browserStorage);
