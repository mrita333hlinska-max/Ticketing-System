/**
 * Auth helpers shared by the service and routes — the public user shape plus
 * the email/display-name normalization rules (REQUIREMENTS §3).
 */

/** What the API exposes about a user — never the password hash. Mirrors the
 * FE's `User` type (`FE/src/entities/user/model/types.ts`). */
export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Emails are trimmed and compared/stored case-insensitively (§3). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** A friendly default display name derived from the email local part. */
export function displayNameFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? email;
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

export function toPublicUser(user: {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
  };
}
