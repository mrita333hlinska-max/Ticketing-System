/**
 * In-memory stub implementation of {@link TicketApi}.
 *
 * Stands in for the backend until it exists (PROJECT_RULES §1). It enforces the
 * same validation/conflict rules a server would (REQUIREMENTS §3–§9) so the UI
 * is built against realistic behaviour, and surfaces failures as the same
 * {@link ApiError} types the HTTP adapter will. It starts EMPTY — no seed data
 * (§9); QA/dev create everything through the app.
 *
 * Built as a factory returning closures (no `this`, no class — PROJECT_RULES
 * §2). Optional `Storage` persistence is a dev convenience only; localStorage
 * is NOT the system of record (it is replaced wholesale by the HTTP adapter).
 */
import type { CreateCommentInput, TicketComment } from '@/entities/comment';
import type { CreateEpicInput, Epic, UpdateEpicInput } from '@/entities/epic';
import type { CreateTeamInput, Team, UpdateTeamInput } from '@/entities/team';
import {
  INITIAL_STATUS,
  isTicketStatus,
  isTicketType,
  type CreateTicketInput,
  type Ticket,
  type UpdateTicketInput,
} from '@/entities/ticket';
import type { User } from '@/entities/user';
import { generateId } from '@/shared/lib';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './errors';
import type { TicketApi } from './ticketApi';

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h (§3)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STORAGE_KEY = 'ticketing-system:stub:v1';

interface StoredUser extends User {
  /** Non-reversible stand-in. The real backend hashes with Argon2id (§3). */
  passwordHash: string;
}

interface VerificationToken {
  token: string;
  userId: string;
  expiresAt: number;
}

/** The stub's complete in-memory state — NOT a database (see file header). */
interface StubState {
  users: StoredUser[];
  teams: Team[];
  epics: Epic[];
  tickets: Ticket[];
  comments: TicketComment[];
  tokens: VerificationToken[];
  sessionUserId: string | null;
}

function emptyState(): StubState {
  return {
    users: [],
    teams: [],
    epics: [],
    tickets: [],
    comments: [],
    tokens: [],
    sessionUserId: null,
  };
}

const nowIso = (): string => new Date().toISOString();
const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/** Dev-only password hash (djb2). Real hashing is backend-side, never here. */
function hashPassword(password: string): string {
  const hash = Array.from(password).reduce(
    (acc, ch) => ((acc << 5) + acc + ch.charCodeAt(0)) | 0,
    5381,
  );
  return `h${hash >>> 0}`;
}

function displayNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function toPublicUser(user: StoredUser): User {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
  };
}

function normalizeDescription(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Extends the public contract with dev/test-only affordances. */
export interface StubApi extends TicketApi {
  /** Wipe all data and the session. */
  reset(): void;
  /**
   * DEV/TEST ONLY — the pending verification token for an email. The real
   * backend NEVER exposes tokens; this exists only because the stub "sends" no
   * real email (used by tests and, in dev, to surface the verification link).
   */
  getVerificationTokenFor(email: string): string | null;
}

/**
 * Create a stub API. Pass a `Storage` (e.g. `localStorage`) to persist across
 * reloads in dev; omit it for an isolated in-memory instance (tests).
 */
export function createStubApi(storage?: Storage): StubApi {
  let state = load();

  function load(): StubState {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    try {
      return { ...emptyState(), ...(JSON.parse(raw) as Partial<StubState>) };
    } catch {
      return emptyState();
    }
  }

  function save(): void {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // --- guards / lookups ---

  function requireSession(): string {
    const { sessionUserId } = state;
    if (!sessionUserId || !state.users.some((u) => u.id === sessionUserId)) {
      throw new UnauthorizedError();
    }
    return sessionUserId;
  }

  function getTeamOrThrow(id: string): Team {
    const team = state.teams.find((t) => t.id === id);
    if (!team) throw new NotFoundError('Team not found.');
    return team;
  }

  function getEpicOrThrow(id: string): Epic {
    const epic = state.epics.find((e) => e.id === id);
    if (!epic) throw new NotFoundError('Epic not found.');
    return epic;
  }

  function getTicketOrThrow(id: string): Ticket {
    const ticket = state.tickets.find((t) => t.id === id);
    if (!ticket) throw new NotFoundError('Ticket not found.');
    return ticket;
  }

  /** An epic referenced by a ticket must belong to the ticket's team (§5). */
  function assertEpicInTeam(epicId: string, teamId: string): void {
    const epic = getEpicOrThrow(epicId);
    if (epic.teamId !== teamId) {
      throw new ValidationError("Epic must belong to the ticket's team.");
    }
  }

  function teamNameTaken(name: string, exceptId?: string): boolean {
    const lower = name.toLowerCase();
    return state.teams.some(
      (t) => t.id !== exceptId && t.name.toLowerCase() === lower,
    );
  }

  function issueToken(userId: string): void {
    // Invalidate earlier unused tokens for this user (§3).
    state.tokens = state.tokens.filter((t) => t.userId !== userId);
    state.tokens.push({
      token: generateId(),
      userId,
      expiresAt: Date.now() + VERIFICATION_TTL_MS,
    });
  }

  return {
    reset() {
      state = emptyState();
      save();
    },

    getVerificationTokenFor(email) {
      const user = state.users.find((u) => u.email === normalizeEmail(email));
      const record = user && state.tokens.find((t) => t.userId === user.id);
      return record ? record.token : null;
    },

    // --- Auth (§3) ---

    async signUp({ email, password }) {
      const normalized = normalizeEmail(email);
      if (!EMAIL_RE.test(normalized)) {
        throw new ValidationError('Enter a valid email address.');
      }
      if (password.length < 8) {
        throw new ValidationError('Password must be at least 8 characters.');
      }
      if (state.users.some((u) => u.email === normalized)) {
        throw new ConflictError('An account with that email already exists.');
      }

      const user: StoredUser = {
        id: generateId(),
        email: normalized,
        displayName: displayNameFromEmail(normalized),
        emailVerified: false,
        passwordHash: hashPassword(password),
      };
      state.users.push(user);
      issueToken(user.id); // "sends" a verification email
      save();
      return toPublicUser(user);
    },

    async login({ email, password }) {
      const normalized = normalizeEmail(email);
      const user = state.users.find((u) => u.email === normalized);
      if (!user || user.passwordHash !== hashPassword(password)) {
        throw new UnauthorizedError('Invalid email or password.');
      }
      if (!user.emailVerified) {
        throw new ForbiddenError('Please verify your email before logging in.');
      }
      state.sessionUserId = user.id;
      save();
      return toPublicUser(user);
    },

    async logout() {
      state.sessionUserId = null;
      save();
    },

    async getCurrentUser() {
      const user = state.users.find((u) => u.id === state.sessionUserId);
      return user ? toPublicUser(user) : null;
    },

    async verifyEmail(token) {
      const record = state.tokens.find((t) => t.token === token);
      if (!record || record.expiresAt < Date.now()) {
        if (record) state.tokens = state.tokens.filter((t) => t !== record);
        save();
        throw new ValidationError(
          'This verification link is invalid or expired.',
        );
      }
      const user = state.users.find((u) => u.id === record.userId);
      if (user) user.emailVerified = true;
      // Single-use: drop every token for this user.
      state.tokens = state.tokens.filter((t) => t.userId !== record.userId);
      save();
    },

    async resendVerification(email) {
      const normalized = normalizeEmail(email);
      const user = state.users.find((u) => u.email === normalized);
      if (!user) throw new NotFoundError('No account found for that email.');
      if (user.emailVerified) {
        throw new ValidationError('This email is already verified.');
      }
      issueToken(user.id);
      save();
    },

    // --- Teams (§4) ---

    async getTeams() {
      requireSession();
      return [...state.teams];
    },

    async createTeam({ name }: CreateTeamInput) {
      requireSession();
      const trimmed = name.trim();
      if (!trimmed) throw new ValidationError('Team name is required.');
      if (teamNameTaken(trimmed)) {
        throw new ConflictError('A team with that name already exists.');
      }
      const team: Team = {
        id: generateId(),
        name: trimmed,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      state.teams.push(team);
      save();
      return team;
    },

    async updateTeam(id, { name }: UpdateTeamInput) {
      requireSession();
      const team = getTeamOrThrow(id);
      const trimmed = name.trim();
      if (!trimmed) throw new ValidationError('Team name is required.');
      if (teamNameTaken(trimmed, id)) {
        throw new ConflictError('A team with that name already exists.');
      }
      if (trimmed !== team.name) {
        team.name = trimmed;
        team.updatedAt = nowIso();
        save();
      }
      return team;
    },

    async deleteTeam(id) {
      requireSession();
      getTeamOrThrow(id);
      const hasTickets = state.tickets.some((t) => t.teamId === id);
      const hasEpics = state.epics.some((e) => e.teamId === id);
      if (hasTickets || hasEpics) {
        throw new ConflictError(
          'Cannot delete a team that still has tickets or epics.',
        );
      }
      state.teams = state.teams.filter((t) => t.id !== id);
      save();
    },

    // --- Epics (§5) ---

    async getEpics(teamId) {
      requireSession();
      return state.epics.filter((e) => !teamId || e.teamId === teamId);
    },

    async createEpic({ teamId, title, description }: CreateEpicInput) {
      requireSession();
      getTeamOrThrow(teamId);
      const trimmed = title.trim();
      if (!trimmed) throw new ValidationError('Epic title is required.');
      const epic: Epic = {
        id: generateId(),
        teamId,
        title: trimmed,
        description: normalizeDescription(description),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      state.epics.push(epic);
      save();
      return epic;
    },

    async updateEpic(id, input: UpdateEpicInput) {
      requireSession();
      const epic = getEpicOrThrow(id);
      let changed = false;

      if (input.title !== undefined) {
        const trimmed = input.title.trim();
        if (!trimmed) throw new ValidationError('Epic title is required.');
        if (trimmed !== epic.title) {
          epic.title = trimmed;
          changed = true;
        }
      }
      if (input.description !== undefined) {
        const next = normalizeDescription(input.description);
        if (next !== epic.description) {
          epic.description = next;
          changed = true;
        }
      }
      if (changed) {
        epic.updatedAt = nowIso();
        save();
      }
      return epic;
    },

    async deleteEpic(id) {
      requireSession();
      getEpicOrThrow(id);
      if (state.tickets.some((t) => t.epicId === id)) {
        throw new ConflictError(
          'Cannot delete an epic that is still referenced by tickets.',
        );
      }
      state.epics = state.epics.filter((e) => e.id !== id);
      save();
    },

    // --- Tickets (§6) ---

    async getTickets(teamId) {
      requireSession();
      return state.tickets.filter((t) => !teamId || t.teamId === teamId);
    },

    async getTicket(id) {
      requireSession();
      return getTicketOrThrow(id);
    },

    async createTicket(input: CreateTicketInput) {
      const userId = requireSession();
      getTeamOrThrow(input.teamId);
      if (!isTicketType(input.type)) {
        throw new ValidationError('Invalid ticket type.');
      }
      const title = input.title.trim();
      if (!title) throw new ValidationError('Title is required.');
      if (!input.body.trim()) throw new ValidationError('Body is required.');
      if (input.epicId) assertEpicInTeam(input.epicId, input.teamId);

      const ticket: Ticket = {
        id: generateId(),
        teamId: input.teamId,
        type: input.type,
        status: INITIAL_STATUS,
        epicId: input.epicId,
        title,
        body: input.body,
        createdBy: userId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      state.tickets.push(ticket);
      save();
      return ticket;
    },

    async updateTicket(id, patch: UpdateTicketInput) {
      requireSession();
      const ticket = getTicketOrThrow(id);

      const nextTeamId = patch.teamId ?? ticket.teamId;
      if (patch.teamId !== undefined) getTeamOrThrow(patch.teamId);

      // Resolve the resulting epic and enforce same-team (§6).
      const nextEpicId =
        patch.epicId !== undefined ? patch.epicId : ticket.epicId;
      if (nextEpicId) assertEpicInTeam(nextEpicId, nextTeamId);

      if (patch.type !== undefined && !isTicketType(patch.type)) {
        throw new ValidationError('Invalid ticket type.');
      }
      if (patch.status !== undefined && !isTicketStatus(patch.status)) {
        throw new ValidationError('Invalid ticket status.');
      }
      const nextTitle =
        patch.title !== undefined ? patch.title.trim() : ticket.title;
      if (patch.title !== undefined && !nextTitle) {
        throw new ValidationError('Title is required.');
      }
      if (patch.body !== undefined && !patch.body.trim()) {
        throw new ValidationError('Body is required.');
      }

      const next: Ticket = {
        ...ticket,
        teamId: nextTeamId,
        epicId: nextEpicId,
        type: patch.type ?? ticket.type,
        status: patch.status ?? ticket.status,
        title: nextTitle,
        body: patch.body ?? ticket.body,
      };

      // Bump updatedAt only on a real change (§6).
      const changed = (Object.keys(next) as Array<keyof Ticket>).some(
        (key) => next[key] !== ticket[key],
      );
      if (!changed) return ticket;

      next.updatedAt = nowIso();
      state.tickets = state.tickets.map((t) => (t.id === id ? next : t));
      save();
      return next;
    },

    async moveTicket(id, to) {
      requireSession();
      const ticket = getTicketOrThrow(id);
      if (!isTicketStatus(to)) {
        throw new ValidationError('Invalid ticket status.');
      }
      if (ticket.status === to) return ticket; // no-op, no timestamp bump
      ticket.status = to;
      ticket.updatedAt = nowIso();
      save();
      return ticket;
    },

    async deleteTicket(id) {
      requireSession();
      getTicketOrThrow(id);
      state.tickets = state.tickets.filter((t) => t.id !== id);
      // Deleting a ticket deletes its comments (§6).
      state.comments = state.comments.filter((c) => c.ticketId !== id);
      save();
    },

    // --- Comments (§7) ---

    async getComments(ticketId) {
      requireSession();
      getTicketOrThrow(ticketId);
      return state.comments
        .filter((c) => c.ticketId === ticketId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)); // oldest first
    },

    async addComment({ ticketId, body }: CreateCommentInput) {
      const userId = requireSession();
      getTicketOrThrow(ticketId);
      if (!body.trim()) throw new ValidationError('Comment cannot be empty.');
      const comment: TicketComment = {
        id: generateId(),
        ticketId,
        authorId: userId,
        body,
        createdAt: nowIso(),
      };
      state.comments.push(comment);
      // NOTE: deliberately does NOT touch the ticket's updatedAt (§7).
      save();
      return comment;
    },
  };
}
