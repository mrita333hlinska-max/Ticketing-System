/**
 * Provides the current session (authenticated user) to the app.
 *
 * DEV BOOTSTRAP: real auth screens arrive in Phase 8. Until then, in dev builds
 * only, this signs in a throwaway local account so the auth-gated API (every
 * business endpoint, per REQUIREMENTS §3) is usable. This block is removed once
 * the real login flow + HTTP adapter land — it is dev-only scaffolding.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LoginInput, SignUpInput, User } from '@/entities/user';
import { api, type StubApi, type TicketApi } from '@/shared/api';
import {
  SessionContext,
  type SessionContextValue,
  type SessionStatus,
} from './SessionContext';

const DEV_EMAIL = 'dev@local.test';
const DEV_PASSWORD = 'dev-password';

/** Dev-only: read a pending verification token if the adapter exposes one. */
function devVerificationToken(client: TicketApi, email: string): string | null {
  return 'getVerificationTokenFor' in client
    ? (client as StubApi).getVerificationTokenFor(email)
    : null;
}

/** Dev-only: ensure a verified local account exists, then sign in. */
async function devSignIn(): Promise<User> {
  try {
    await api.signUp({ email: DEV_EMAIL, password: DEV_PASSWORD });
  } catch {
    // Account already exists — fine.
  }
  const token = devVerificationToken(api, DEV_EMAIL);
  if (token) await api.verifyEmail(token);
  return api.login({ email: DEV_EMAIL, password: DEV_PASSWORD });
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  const applyUser = useCallback((next: User | null) => {
    setUser(next);
    setStatus(next ? 'authenticated' : 'unauthenticated');
  }, []);

  const reload = useCallback(async () => {
    const current = await api.getCurrentUser();
    applyUser(current);
  }, [applyUser]);

  useEffect(() => {
    let active = true;
    (async () => {
      let current = await api.getCurrentUser();
      if (!current && import.meta.env.DEV) {
        current = await devSignIn();
      }
      if (active) applyUser(current);
    })().catch(() => active && applyUser(null));
    return () => {
      active = false;
    };
  }, [applyUser]);

  const login = useCallback(
    async (input: LoginInput) => {
      const next = await api.login(input);
      applyUser(next);
    },
    [applyUser],
  );

  const logout = useCallback(async () => {
    await api.logout();
    applyUser(null);
  }, [applyUser]);

  const signUp = useCallback((input: SignUpInput) => api.signUp(input), []);
  const verifyEmail = useCallback(
    (token: string) => api.verifyEmail(token),
    [],
  );
  const resendVerification = useCallback(
    (email: string) => api.resendVerification(email),
    [],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      status,
      login,
      logout,
      signUp,
      verifyEmail,
      resendVerification,
      reload,
    }),
    [
      user,
      status,
      login,
      logout,
      signUp,
      verifyEmail,
      resendVerification,
      reload,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
