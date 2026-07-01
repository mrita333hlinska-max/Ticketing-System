/**
 * Read-only user directory (REQUIREMENTS §3 support): lets the FE resolve
 * `createdBy` and comment `authorId` to display names. Interface + Drizzle
 * factory for testability (PROJECT_RULES §2).
 */
import { asc } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { users } from '../../db/schema';

export type UserRecord = typeof users.$inferSelect;

export interface UserRepository {
  list(): Promise<UserRecord[]>;
}

export function createUserRepository(db: Database): UserRepository {
  return {
    async list() {
      return db.select().from(users).orderBy(asc(users.createdAt));
    },
  };
}
