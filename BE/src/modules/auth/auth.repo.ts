/**
 * Persistence for the auth module (users + verification tokens).
 *
 * Exposed as an interface + factory so the service can be unit-tested with an
 * in-memory fake, while production uses the Drizzle-backed implementation
 * (PROJECT_RULES §2). This is the only code here that touches the database.
 */
import { eq, sql } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { users, verificationTokens } from '../../db/schema';

export type UserRecord = typeof users.$inferSelect;
export type TokenRecord = typeof verificationTokens.$inferSelect;

export interface NewUser {
  email: string;
  passwordHash: string;
  displayName: string;
}

export interface AuthRepository {
  findUserByEmail(normalizedEmail: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  insertUser(input: NewUser): Promise<UserRecord>;
  /** Issue a token, atomically invalidating the user's earlier ones (§3). */
  replaceTokensForUser(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void>;
  findToken(token: string): Promise<TokenRecord | null>;
  /** Mark the token used and flip the user to verified, atomically (§3). */
  verifyUserWithToken(tokenId: string, userId: string): Promise<void>;
}

export function createAuthRepository(db: Database): AuthRepository {
  return {
    async findUserByEmail(normalizedEmail) {
      const rows = await db
        .select()
        .from(users)
        .where(sql`lower(${users.email}) = ${normalizedEmail}`)
        .limit(1);
      return rows[0] ?? null;
    },

    async findUserById(id) {
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return rows[0] ?? null;
    },

    async insertUser(input) {
      const rows = await db
        .insert(users)
        .values({
          email: input.email,
          passwordHash: input.passwordHash,
          displayName: input.displayName,
        })
        .returning();
      return rows[0];
    },

    async replaceTokensForUser(userId, token, expiresAt) {
      await db.transaction(async (tx) => {
        await tx
          .delete(verificationTokens)
          .where(eq(verificationTokens.userId, userId));
        await tx.insert(verificationTokens).values({ userId, token, expiresAt });
      });
    },

    async findToken(token) {
      const rows = await db
        .select()
        .from(verificationTokens)
        .where(eq(verificationTokens.token, token))
        .limit(1);
      return rows[0] ?? null;
    },

    async verifyUserWithToken(tokenId, userId) {
      await db.transaction(async (tx) => {
        await tx
          .update(verificationTokens)
          .set({ usedAt: new Date() })
          .where(eq(verificationTokens.id, tokenId));
        await tx
          .update(users)
          .set({ emailVerified: true, updatedAt: new Date() })
          .where(eq(users.id, userId));
      });
    },
  };
}
