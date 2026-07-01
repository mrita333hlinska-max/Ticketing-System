/**
 * Persistence for tickets (REQUIREMENTS §6). Interface + Drizzle factory so the
 * service can be unit-tested with an in-memory fake (PROJECT_RULES §2).
 *
 * Deleting a ticket relies on the `comments.ticket_id` ON DELETE CASCADE FK, so
 * `remove` needs no explicit comment cleanup (§6).
 */
import { and, desc, eq, sql } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { tickets } from '../../db/schema';
import type { TicketStatus, TicketType } from './tickets.schema';

export type TicketRecord = typeof tickets.$inferSelect;

export interface NewTicket {
  teamId: string;
  type: TicketType;
  status: TicketStatus;
  epicId: string | null;
  title: string;
  body: string;
  createdBy: string;
}

export interface TicketUpdate {
  teamId: string;
  type: TicketType;
  status: TicketStatus;
  epicId: string | null;
  title: string;
  body: string;
}

export interface TicketRepository {
  /** Tickets owned by `ownerId`, optionally filtered to one team's board. */
  list(ownerId: string, teamId?: string): Promise<TicketRecord[]>;
  findById(id: string): Promise<TicketRecord | null>;
  insert(input: NewTicket): Promise<TicketRecord>;
  update(id: string, values: TicketUpdate): Promise<TicketRecord>;
  remove(id: string): Promise<void>;
}

export function createTicketRepository(db: Database): TicketRepository {
  return {
    async list(ownerId, teamId) {
      const predicate = teamId
        ? and(eq(tickets.createdBy, ownerId), eq(tickets.teamId, teamId))
        : eq(tickets.createdBy, ownerId);
      return db
        .select()
        .from(tickets)
        .where(predicate)
        .orderBy(desc(tickets.updatedAt));
    },

    async findById(id) {
      const rows = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, id))
        .limit(1);
      return rows[0] ?? null;
    },

    async insert(input) {
      const rows = await db.insert(tickets).values(input).returning();
      return rows[0];
    },

    async update(id, values) {
      const rows = await db
        .update(tickets)
        // DB clock (matches createdAt's defaultNow), so updatedAt is never
        // skewed against createdAt across process/DB clock differences.
        .set({ ...values, updatedAt: sql`now()` })
        .where(eq(tickets.id, id))
        .returning();
      return rows[0];
    },

    async remove(id) {
      await db.delete(tickets).where(eq(tickets.id, id));
    },
  };
}
