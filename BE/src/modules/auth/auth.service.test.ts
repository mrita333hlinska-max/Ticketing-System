/**
 * Auth service unit tests (Phase 3). Business rules only — no DB, no network:
 * the repository is an in-memory fake and the mailer captures issued tokens.
 * Password hashing uses the real Argon2id (fast enough), so authenticate() is
 * exercised end-to-end against a stored hash.
 */
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../lib/errors';
import type { Mailer } from '../../lib/mailer';
import { createAuthService } from './auth.service';
import type {
  AuthRepository,
  NewUser,
  TokenRecord,
  UserRecord,
} from './auth.repo';

function createFakeRepo(): AuthRepository {
  const state: { users: UserRecord[]; tokens: TokenRecord[] } = {
    users: [],
    tokens: [],
  };

  return {
    async findUserByEmail(email) {
      return state.users.find((user) => user.email === email) ?? null;
    },
    async findUserById(id) {
      return state.users.find((user) => user.id === id) ?? null;
    },
    async insertUser(input: NewUser) {
      const user: UserRecord = {
        id: `user-${state.users.length + 1}`,
        email: input.email,
        passwordHash: input.passwordHash,
        displayName: input.displayName,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      state.users.push(user);
      return user;
    },
    async replaceTokensForUser(userId, token, expiresAt) {
      state.tokens = state.tokens.filter((entry) => entry.userId !== userId);
      state.tokens.push({
        id: `token-${state.tokens.length + 1}`,
        userId,
        token,
        usedAt: null,
        expiresAt,
        createdAt: new Date(),
      });
    },
    async findToken(token) {
      return state.tokens.find((entry) => entry.token === token) ?? null;
    },
    async verifyUserWithToken(tokenId, userId) {
      const token = state.tokens.find((entry) => entry.id === tokenId);
      if (token) token.usedAt = new Date();
      const user = state.users.find((entry) => entry.id === userId);
      if (user) user.emailVerified = true;
    },
  };
}

function createCapturingMailer(): Mailer & { lastToken(): string } {
  const sent: string[] = [];
  return {
    async sendVerificationEmail(_to, token) {
      sent.push(token);
    },
    lastToken() {
      const token = sent.at(-1);
      if (!token) throw new Error('No verification email was sent.');
      return token;
    },
  };
}

function createSubject() {
  const repo = createFakeRepo();
  const mailer = createCapturingMailer();
  return { service: createAuthService({ repo, mailer }), mailer };
}

/** Assert an awaited promise rejects with a given ApiError status + message. */
async function expectApiError(
  operation: Promise<unknown>,
  status: number,
  message?: string,
): Promise<void> {
  await expect(operation).rejects.toSatisfy((error: unknown) => {
    if (!(error instanceof ApiError)) return false;
    if (error.status !== status) return false;
    return message === undefined || error.message === message;
  });
}

describe('auth service', () => {
  it('signs up an unverified user and sends a verification email', async () => {
    const { service, mailer } = createSubject();
    const user = await service.signUp({
      email: '  Alex@Example.COM ',
      password: 'password123',
    });
    expect(user.email).toBe('alex@example.com'); // trimmed + lowercased
    expect(user.emailVerified).toBe(false);
    expect(mailer.lastToken()).toBeTruthy();
  });

  it('rejects a short password and an invalid email (400)', async () => {
    const { service } = createSubject();
    await expectApiError(
      service.signUp({ email: 'a@b.com', password: 'short' }),
      400,
      'Password must be at least 8 characters.',
    );
    await expectApiError(
      service.signUp({ email: 'not-an-email', password: 'password123' }),
      400,
      'Enter a valid email address.',
    );
  });

  it('rejects a duplicate email case-insensitively (409)', async () => {
    const { service } = createSubject();
    await service.signUp({ email: 'dup@example.com', password: 'password123' });
    await expectApiError(
      service.signUp({ email: 'DUP@example.com', password: 'password123' }),
      409,
    );
  });

  it('blocks login until the email is verified, then allows it', async () => {
    const { service, mailer } = createSubject();
    await service.signUp({ email: 'x@example.com', password: 'password123' });

    await expectApiError(
      service.authenticate({ email: 'x@example.com', password: 'password123' }),
      403,
    );

    await service.verifyEmail(mailer.lastToken());
    const user = await service.authenticate({
      email: 'x@example.com',
      password: 'password123',
    });
    expect(user.emailVerified).toBe(true);
  });

  it('rejects wrong credentials with 401', async () => {
    const { service } = createSubject();
    await service.signUp({ email: 'y@example.com', password: 'password123' });
    await expectApiError(
      service.authenticate({ email: 'y@example.com', password: 'wrongpass1' }),
      401,
    );
    await expectApiError(
      service.authenticate({ email: 'nobody@example.com', password: 'whatever1' }),
      401,
    );
  });

  it('makes a verification token single-use (second use → 400)', async () => {
    const { service, mailer } = createSubject();
    await service.signUp({ email: 'z@example.com', password: 'password123' });
    const token = mailer.lastToken();
    await service.verifyEmail(token);
    await expectApiError(service.verifyEmail(token), 400);
  });

  it('invalidates earlier tokens when a new one is issued (resend)', async () => {
    const { service, mailer } = createSubject();
    await service.signUp({ email: 'r@example.com', password: 'password123' });
    const firstToken = mailer.lastToken();

    await service.resendVerification('r@example.com');
    const secondToken = mailer.lastToken();
    expect(secondToken).not.toBe(firstToken);

    // The superseded token no longer works...
    await expectApiError(service.verifyEmail(firstToken), 400);
    // ...but the freshly issued one does.
    await service.verifyEmail(secondToken);
  });

  it('resend rejects unknown (404) and already-verified (400) emails', async () => {
    const { service, mailer } = createSubject();
    await expectApiError(
      service.resendVerification('ghost@example.com'),
      404,
    );

    await service.signUp({ email: 'v@example.com', password: 'password123' });
    await service.verifyEmail(mailer.lastToken());
    await expectApiError(service.resendVerification('v@example.com'), 400);
  });
});
