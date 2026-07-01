/**
 * Auth business logic (REQUIREMENTS §3). Behaviour mirrors the FE's stub
 * adapter one-to-one (validation rules, conflict/forbidden cases, and the exact
 * user-facing messages) so the real backend is a drop-in for the contract the
 * UI was built against.
 *
 * Built as a factory taking its dependencies (repo, mailer) and returning
 * closures — no classes, no `this` (PROJECT_RULES §2). Sessions are HTTP-scoped
 * and handled in the routes; the service only decides *who* the user is.
 */
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../lib/errors';
import type { Mailer } from '../../lib/mailer';
import { hashPassword, verifyPassword } from '../../lib/password';
import { generateVerificationToken, VERIFICATION_TTL_MS } from '../../lib/tokens';
import {
  displayNameFromEmail,
  EMAIL_PATTERN,
  normalizeEmail,
  toPublicUser,
  type PublicUser,
} from './auth.helpers';
import type { AuthRepository } from './auth.repo';
import type { LoginInput, SignupInput } from './auth.schema';

export interface AuthService {
  signUp(input: SignupInput): Promise<PublicUser>;
  authenticate(input: LoginInput): Promise<PublicUser>;
  verifyEmail(token: string): Promise<void>;
  resendVerification(email: string): Promise<void>;
}

export function createAuthService(dependencies: {
  repo: AuthRepository;
  mailer: Mailer;
}): AuthService {
  const { repo, mailer } = dependencies;

  async function issueAndSend(userId: string, email: string): Promise<void> {
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
    await repo.replaceTokensForUser(userId, token, expiresAt);
    await mailer.sendVerificationEmail(email, token);
  }

  return {
    async signUp({ email, password }) {
      const normalized = normalizeEmail(email);
      if (!EMAIL_PATTERN.test(normalized)) {
        throw new ValidationError('Enter a valid email address.');
      }
      if (password.length < 8) {
        throw new ValidationError('Password must be at least 8 characters.');
      }
      if (await repo.findUserByEmail(normalized)) {
        throw new ConflictError('An account with that email already exists.');
      }

      const passwordHash = await hashPassword(password);
      const user = await repo.insertUser({
        email: normalized,
        passwordHash,
        displayName: displayNameFromEmail(normalized),
      });
      await issueAndSend(user.id, user.email);
      return toPublicUser(user);
    },

    async authenticate({ email, password }) {
      const normalized = normalizeEmail(email);
      const user = await repo.findUserByEmail(normalized);
      if (!user || !(await verifyPassword(user.passwordHash, password))) {
        throw new UnauthorizedError('Invalid email or password.');
      }
      if (!user.emailVerified) {
        throw new ForbiddenError('Please verify your email before logging in.');
      }
      return toPublicUser(user);
    },

    async verifyEmail(token) {
      const record = await repo.findToken(token);
      if (
        !record ||
        record.usedAt ||
        record.expiresAt.getTime() <= Date.now()
      ) {
        throw new ValidationError(
          'This verification link is invalid or expired.',
        );
      }
      await repo.verifyUserWithToken(record.id, record.userId);
    },

    async resendVerification(email) {
      const normalized = normalizeEmail(email);
      const user = await repo.findUserByEmail(normalized);
      if (!user) {
        throw new NotFoundError('No account found for that email.');
      }
      if (user.emailVerified) {
        throw new ValidationError('This email is already verified.');
      }
      await issueAndSend(user.id, user.email);
    },
  };
}
