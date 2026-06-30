/**
 * Comment domain types — REQUIREMENTS §7.
 *
 * Comments are immutable after creation (no update type). Adding one does NOT
 * change the parent ticket's updatedAt. Bodies are non-empty.
 */
/** Named `TicketComment` (not `Comment`) to avoid shadowing the DOM global. */
export interface TicketComment {
  id: string;
  ticketId: string;
  /** User id of the author, set by the server from the authenticated user. */
  authorId: string;
  body: string;
  /** ISO-8601, UTC, server-set. Comments display oldest-first by this. */
  createdAt: string;
}

export interface CreateCommentInput {
  ticketId: string;
  body: string;
}
