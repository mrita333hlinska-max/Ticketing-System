/**
 * Persistence for comments (REQUIREMENTS §7). Interface + Drizzle factory so the
 * service can be unit-tested with an in-memory fake (PROJECT_RULES §2).
 */
import { asc, eq } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { comments } from '../../db/schema';

export type CommentRecord = typeof comments.$inferSelect;

export interface NewComment {
  ticketId: string;
  authorId: string;
  body: string;
}

export interface CommentRepository {
  /** Comments for a ticket, oldest first (§7). */
  listByTicket(ticketId: string): Promise<CommentRecord[]>;
  insert(input: NewComment): Promise<CommentRecord>;
}

export function createCommentRepository(db: Database): CommentRepository {
  return {
    async listByTicket(ticketId) {
      return db
        .select()
        .from(comments)
        .where(eq(comments.ticketId, ticketId))
        .orderBy(asc(comments.createdAt));
    },

    async insert(input) {
      const rows = await db.insert(comments).values(input).returning();
      return rows[0];
    },
  };
}
