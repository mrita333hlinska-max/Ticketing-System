/**
 * HTTP implementation of {@link TicketApi} — the eventual production adapter.
 *
 * NOT WIRED YET: the backend does not exist, so nothing constructs this adapter
 * (the app uses the stub via the barrel). It is written against the REST + auth
 * contract in REQUIREMENTS §9 so that switching over later is a one-line change
 * in the barrel — no UI edits. Cookie-based sessions are assumed
 * (`credentials: 'include'`); tokens are never placed in URLs (§9).
 *
 * Built as a factory returning closures (no `this`, no class — PROJECT_RULES §2).
 */
import type { CreateCommentInput, TicketComment } from '@/entities/comment';
import type { CreateEpicInput, Epic, UpdateEpicInput } from '@/entities/epic';
import type { CreateTeamInput, Team, UpdateTeamInput } from '@/entities/team';
import type {
  CreateTicketInput,
  Ticket,
  TicketStatus,
  UpdateTicketInput,
} from '@/entities/ticket';
import type { LoginInput, SignUpInput, User } from '@/entities/user';
import { API_BASE_URL } from './config';
import {
  ApiError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './errors';
import type { TicketApi } from './ticketApi';

type Query = Record<string, string | undefined>;

function mapError(status: number, message: string): ApiError {
  const byStatus: Record<number, () => ApiError> = {
    400: () => new ValidationError(message),
    401: () => new UnauthorizedError(message),
    403: () => new ForbiddenError(message),
    404: () => new NotFoundError(message),
    409: () => new ConflictError(message),
  };
  return byStatus[status]?.() ?? new ApiError(message, status, 'unknown');
}

/** Create an HTTP-backed API client targeting `baseUrl` (defaults to config). */
export function createHttpAdapter(baseUrl: string = API_BASE_URL): TicketApi {
  async function request<T>(
    method: string,
    path: string,
    options: { body?: unknown; query?: Query } = {},
  ): Promise<T> {
    const url = new URL(`${baseUrl}${path}`, window.location.origin);
    Object.entries(options.query ?? {}).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, value);
    });

    const response = await fetch(url, {
      method,
      credentials: 'include',
      headers: options.body ? { 'Content-Type': 'application/json' } : {},
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const message = await response
        .json()
        .then((data: { message?: string }) => data.message)
        .catch(() => response.statusText);
      throw mapError(response.status, message ?? 'Request failed.');
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  return {
    // --- Auth ---
    signUp: (input: SignUpInput): Promise<User> =>
      request('POST', '/auth/signup', { body: input }),
    login: (input: LoginInput): Promise<User> =>
      request('POST', '/auth/login', { body: input }),
    logout: (): Promise<void> => request('POST', '/auth/logout'),
    getCurrentUser: (): Promise<User | null> => request('GET', '/auth/me'),
    verifyEmail: (token: string): Promise<void> =>
      request('POST', '/auth/verify', { body: { token } }),
    resendVerification: (email: string): Promise<void> =>
      request('POST', '/auth/resend', { body: { email } }),

    // --- Users ---
    getUsers: (): Promise<User[]> => request('GET', '/users'),

    // --- Teams ---
    getTeams: (): Promise<Team[]> => request('GET', '/teams'),
    createTeam: (input: CreateTeamInput): Promise<Team> =>
      request('POST', '/teams', { body: input }),
    updateTeam: (id: string, input: UpdateTeamInput): Promise<Team> =>
      request('PATCH', `/teams/${id}`, { body: input }),
    deleteTeam: (id: string): Promise<void> =>
      request('DELETE', `/teams/${id}`),

    // --- Epics ---
    getEpics: (teamId?: string): Promise<Epic[]> =>
      request('GET', '/epics', { query: { teamId } }),
    createEpic: (input: CreateEpicInput): Promise<Epic> =>
      request('POST', '/epics', { body: input }),
    updateEpic: (id: string, input: UpdateEpicInput): Promise<Epic> =>
      request('PATCH', `/epics/${id}`, { body: input }),
    deleteEpic: (id: string): Promise<void> =>
      request('DELETE', `/epics/${id}`),

    // --- Tickets ---
    getTickets: (teamId?: string): Promise<Ticket[]> =>
      request('GET', '/tickets', { query: { teamId } }),
    getTicket: (id: string): Promise<Ticket> =>
      request('GET', `/tickets/${id}`),
    createTicket: (input: CreateTicketInput): Promise<Ticket> =>
      request('POST', '/tickets', { body: input }),
    updateTicket: (id: string, patch: UpdateTicketInput): Promise<Ticket> =>
      request('PATCH', `/tickets/${id}`, { body: patch }),
    moveTicket: (id: string, to: TicketStatus): Promise<Ticket> =>
      request('PATCH', `/tickets/${id}`, { body: { status: to } }),
    deleteTicket: (id: string): Promise<void> =>
      request('DELETE', `/tickets/${id}`),

    // --- Comments ---
    getComments: (ticketId: string): Promise<TicketComment[]> =>
      request('GET', `/tickets/${ticketId}/comments`),
    addComment: ({
      ticketId,
      body,
    }: CreateCommentInput): Promise<TicketComment> =>
      request('POST', `/tickets/${ticketId}/comments`, { body: { body } }),
  };
}
