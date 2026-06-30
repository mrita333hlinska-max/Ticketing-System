import { api, type StubApi } from '@/shared/api';

/**
 * DEV ONLY: the pending verification token for an email. The stub "sends" no
 * real email, so screens surface a clickable verify link in development. The
 * real backend emails the link and never exposes tokens to the client (§3).
 */
export function getDevVerificationToken(email: string): string | null {
  if (!import.meta.env.DEV) return null;
  return 'getVerificationTokenFor' in api
    ? (api as StubApi).getVerificationTokenFor(email)
    : null;
}

export function buildVerifyPath(token: string): string {
  return `/verify?token=${encodeURIComponent(token)}`;
}
