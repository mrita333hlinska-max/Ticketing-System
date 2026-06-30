/**
 * Session context shape. Kept separate from the provider component (no JSX) so
 * the provider file exports only a component (React Fast Refresh friendly).
 */
import { createContext } from 'react';
import type { LoginInput, SignUpInput, User } from '@/entities/user';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface SessionContextValue {
  /** The signed-in user, or null when unauthenticated. */
  user: User | null;
  status: SessionStatus;

  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (input: SignUpInput) => Promise<User>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  /** Re-read the current user from the API. */
  reload: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextValue | null>(null);
