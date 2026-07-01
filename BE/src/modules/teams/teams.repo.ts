/**
 * Persistence for teams (REQUIREMENTS §4). Interface + Drizzle factory so the
 * service can be unit-tested with an in-memory fake (PROJECT_RULES §2).
 */
import { and, eq, ne, sql } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { epics, teams, tickets } from '../../db/schema';

export type TeamRecord = typeof teams.$inferSelect;

export interface TeamRepository {
  /** Teams owned by `ownerId` (per-user isolation). */
  list(ownerId: string): Promise<TeamRecord[]>;
  findById(id: string): Promise<TeamRecord | null>;
  /** Case-insensitive name lookup within one owner's teams (names are unique
   * per owner), optionally excluding one id (for rename). */
  findByNameInsensitive(
    ownerId: string,
    name: string,
    exceptId?: string,
  ): Promise<TeamRecord | null>;
  insert(name: string, ownerId: string): Promise<TeamRecord>;
  updateName(id: string, name: string): Promise<TeamRecord>;
  remove(id: string): Promise<void>;
  /** True if any epic or ticket still references the team (§4 delete guard). */
  hasReferences(id: string): Promise<boolean>;
}

export function createTeamRepository(db: Database): TeamRepository {
  return {
    async list(ownerId) {
      return db
        .select()
        .from(teams)
        .where(eq(teams.createdBy, ownerId))
        .orderBy(teams.createdAt);
    },

    async findById(id) {
      const rows = await db
        .select()
        .from(teams)
        .where(eq(teams.id, id))
        .limit(1);
      return rows[0] ?? null;
    },

    async findByNameInsensitive(ownerId, name, exceptId) {
      const sameName = and(
        eq(teams.createdBy, ownerId),
        sql`lower(${teams.name}) = ${name.toLowerCase()}`,
      );
      const predicate = exceptId ? and(sameName, ne(teams.id, exceptId)) : sameName;
      const rows = await db.select().from(teams).where(predicate).limit(1);
      return rows[0] ?? null;
    },

    async insert(name, ownerId) {
      const rows = await db
        .insert(teams)
        .values({ name, createdBy: ownerId })
        .returning();
      return rows[0];
    },

    async updateName(id, name) {
      const rows = await db
        .update(teams)
        .set({ name, updatedAt: sql`now()` })
        .where(eq(teams.id, id))
        .returning();
      return rows[0];
    },

    async remove(id) {
      await db.delete(teams).where(eq(teams.id, id));
    },

    async hasReferences(id) {
      const epicRows = await db
        .select({ id: epics.id })
        .from(epics)
        .where(eq(epics.teamId, id))
        .limit(1);
      if (epicRows.length > 0) return true;
      const ticketRows = await db
        .select({ id: tickets.id })
        .from(tickets)
        .where(eq(tickets.teamId, id))
        .limit(1);
      return ticketRows.length > 0;
    },
  };
}
