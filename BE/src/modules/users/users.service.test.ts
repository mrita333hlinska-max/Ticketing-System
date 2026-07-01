/**
 * User directory service test (Phase 7): the listing exposes the public user
 * shape and never leaks the password hash.
 */
import { describe, expect, it } from 'vitest';
import { createUserService } from './users.service';
import type { UserRecord, UserRepository } from './users.repo';

function createFakeRepo(rows: UserRecord[]): UserRepository {
  return {
    async list() {
      return rows;
    },
  };
}

describe('user service', () => {
  it('maps stored users to the public shape (no password hash)', async () => {
    const now = new Date(2026, 0, 1);
    const service = createUserService({
      repo: createFakeRepo([
        {
          id: 'user-1',
          email: 'alex@example.com',
          passwordHash: 'argon2-secret-hash',
          displayName: 'Alex',
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
      ]),
    });

    const users = await service.list();
    expect(users).toEqual([
      {
        id: 'user-1',
        email: 'alex@example.com',
        displayName: 'Alex',
        emailVerified: true,
      },
    ]);
    expect(JSON.stringify(users)).not.toContain('argon2-secret-hash');
  });
});
