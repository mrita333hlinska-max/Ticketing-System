/**
 * Persistence for epics (REQUIREMENTS §5). Interface + Drizzle factory so the
 * service can be unit-tested with an in-memory fake (PROJECT_RULES §2).
 */
import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { epics, tickets } from '../../db/schema';

export type EpicRecord = typeof epics.$inferSelect;

export interface NewEpic {
  teamId: string;
  title: string;
  description: string | null;
  createdBy: string;
}

export interface EpicUpdate {
  title: string;
  description: string | null;
}

export interface EpicRepository {
  /** Epics owned by `ownerId`, optionally filtered to one team. */
  list(ownerId: string, teamId?: string): Promise<EpicRecord[]>;
  findById(id: string): Promise<EpicRecord | null>;
  insert(input: NewEpic): Promise<EpicRecord>;
  update(id: string, values: EpicUpdate): Promise<EpicRecord>;
  remove(id: string): Promise<void>;
  /** True if any ticket still references the epic (§5 delete guard). */
  isReferencedByTickets(id: string): Promise<boolean>;
}

export function createEpicRepository(db: Database): EpicRepository {
  return {
    async list(ownerId, teamId) {
      const predicate = teamId
        ? and(eq(epics.createdBy, ownerId), eq(epics.teamId, teamId))
        : eq(epics.createdBy, ownerId);
      return db.select().from(epics).where(predicate).orderBy(epics.createdAt);
    },

    async findById(id) {
      const rows = await db
        .select()
        .from(epics)
        .where(eq(epics.id, id))
        .limit(1);
      return rows[0] ?? null;
    },

    async insert(input) {
      const rows = await db
        .insert(epics)
        .values({
          teamId: input.teamId,
          title: input.title,
          description: input.description,
          createdBy: input.createdBy,
        })
        .returning();
      return rows[0];
    },

    async update(id, values) {
      const rows = await db
        .update(epics)
        .set({
          title: values.title,
          description: values.description,
          updatedAt: sql`now()`,
        })
        .where(eq(epics.id, id))
        .returning();
      return rows[0];
    },

    async remove(id) {
      await db.delete(epics).where(eq(epics.id, id));
    },

    async isReferencedByTickets(id) {
      const rows = await db
        .select({ id: tickets.id })
        .from(tickets)
        .where(eq(tickets.epicId, id))
        .limit(1);
      return rows.length > 0;
    },
  };
}
