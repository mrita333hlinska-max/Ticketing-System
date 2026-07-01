/**
 * Public API of the data layer. Import from `@/shared/api`.
 *
 * `api` is the single app-wide instance, backed by the real HTTP backend — in
 * production behind the nginx `/api` proxy, and in local dev behind the Vite
 * dev-server proxy (see `vite.config.ts`). The app always talks to the backend.
 *
 * Under Vitest (`import.meta.env.MODE === 'test'`) `api` is instead an in-memory
 * fake so unit tests run without a server. That branch is dead code in every
 * real build and is tree-shaken out — the shipped bundle contains no fake.
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

const isTest = import.meta.env.MODE === 'test';

// Typed as StubApi so the test suite can use its reset()/getVerificationTokenFor
// helpers. In real builds `api` is the HTTP adapter (those helpers are never
// called outside tests), and the fake branch above is eliminated at build time.
export const api: StubApi = isTest
  ? createStubApi()
  : (createHttpAdapter() as unknown as StubApi);
