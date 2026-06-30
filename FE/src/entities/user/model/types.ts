/**
 * User domain types — REQUIREMENTS §3.
 *
 * Emails are unique and compared case-insensitively (enforced server-side).
 * Passwords are never represented on the client. `emailVerified` gates access
 * to the main application.
 */
export interface User {
  id: string;
  email: string;
  /** Display name shown in the nav menu and as comment author. */
  displayName: string;
  emailVerified: boolean;
}

export interface SignUpInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
