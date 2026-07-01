/**
 * Comment business logic (REQUIREMENTS §7). Mirrors the FE stub: the ticket must
 * exist (404); the body is non-empty after trim (400) but stored as sent;
 * comments list oldest-first; they are immutable.
 *
 * Crucially, adding a comment does NOT touch the ticket's `updatedAt` — this
 * service never mutates the ticket, so board ordering is unaffected (§7).
 */
import { NotFoundError, ValidationError } from '../../lib/errors';
import type { TicketRepository } from '../tickets/tickets.repo';
import type { CommentRecord, CommentRepository } from './comments.repo';

export interface CommentDto {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

function toCommentDto(comment: CommentRecord): CommentDto {
  return {
    id: comment.id,
    ticketId: comment.ticketId,
    authorId: comment.authorId,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
  };
}

export interface CommentService {
  list(ticketId: string, userId: string): Promise<CommentDto[]>;
  add(ticketId: string, body: string, userId: string): Promise<CommentDto>;
}

export function createCommentService(dependencies: {
  repo: CommentRepository;
  tickets: Pick<TicketRepository, 'findById'>;
}): CommentService {
  const { repo, tickets } = dependencies;

  /** The ticket must exist AND belong to the user (per-user isolation). */
  async function requireOwnedTicket(
    ticketId: string,
    userId: string,
  ): Promise<void> {
    const ticket = await tickets.findById(ticketId);
    if (!ticket || ticket.createdBy !== userId) {
      throw new NotFoundError('Ticket not found.');
    }
  }

  return {
    async list(ticketId, userId) {
      await requireOwnedTicket(ticketId, userId);
      const rows = await repo.listByTicket(ticketId);
      return rows.map(toCommentDto);
    },

    async add(ticketId, body, userId) {
      await requireOwnedTicket(ticketId, userId);
      if (!body.trim()) throw new ValidationError('Comment cannot be empty.');
      const comment = await repo.insert({ ticketId, authorId: userId, body });
      return toCommentDto(comment);
    },
  };
}
