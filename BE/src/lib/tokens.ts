/**
 * Email-verification tokens (REQUIREMENTS §3): single-use, expiring 24h after
 * issue. The token is a high-entropy random string safe to place in the
 * verification URL (the one sanctioned token-in-URL case, §9). Issuing a new
 * token invalidates earlier ones — enforced by the repository, which replaces
 * a user's tokens on issue.
 */
import { randomBytes } from 'node:crypto';

export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}
