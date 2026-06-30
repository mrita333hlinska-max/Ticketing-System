/**
 * The single data-access seam for the whole app (PROJECT_RULES §1, §2).
 *
 * Every screen talks to this interface, never to a concrete storage mechanism.
 * Today it is satisfied by the in-memory stub; later by an HTTP adapter against
 * the real backend — with no UI changes. All methods are async to match that
 * future network contract.
 *
 * Despite the name (kept per the docs), it covers every entity, not just
 * tickets.
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

export interface TicketApi {
  // --- Auth (§3) ---
  /** Register an account (unverified) and trigger a verification email. */
  signUp(input: SignUpInput): Promise<User>;
  /** Authenticate with local credentials; rejects unverified accounts. */
  login(input: LoginInput): Promise<User>;
  logout(): Promise<void>;
  /** The current session user, or null when signed out. */
  getCurrentUser(): Promise<User | null>;
  /** Consume a single-use verification token (expires after 24h). */
  verifyEmail(token: string): Promise<void>;
  /** Re-issue a verification email; invalidates earlier unused tokens. */
  resendVerification(email: string): Promise<void>;

  // --- Users (read-only directory) ---
  /** All users, for resolving `createdBy` / comment author display names. */
  getUsers(): Promise<User[]>;

  // --- Teams (§4) ---
  getTeams(): Promise<Team[]>;
  createTeam(input: CreateTeamInput): Promise<Team>;
  updateTeam(id: string, input: UpdateTeamInput): Promise<Team>;
  /** Rejects (409) if the team still has tickets or epics. */
  deleteTeam(id: string): Promise<void>;

  // --- Epics (§5) ---
  /** All epics, or only those of `teamId` when provided. */
  getEpics(teamId?: string): Promise<Epic[]>;
  createEpic(input: CreateEpicInput): Promise<Epic>;
  updateEpic(id: string, input: UpdateEpicInput): Promise<Epic>;
  /** Rejects (409) if any ticket still references the epic. */
  deleteEpic(id: string): Promise<void>;

  // --- Tickets (§6) ---
  /** All tickets, or only those of `teamId` (the board is per team). */
  getTickets(teamId?: string): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket>;
  createTicket(input: CreateTicketInput): Promise<Ticket>;
  updateTicket(id: string, patch: UpdateTicketInput): Promise<Ticket>;
  /** Sugar for a status-only change (drag-and-drop on the board, §8). */
  moveTicket(id: string, to: TicketStatus): Promise<Ticket>;
  /** Deletes the ticket and its comments (§6). */
  deleteTicket(id: string): Promise<void>;

  // --- Comments (§7) ---
  /** Comments for a ticket, oldest-first. */
  getComments(ticketId: string): Promise<TicketComment[]>;
  addComment(input: CreateCommentInput): Promise<TicketComment>;
}
