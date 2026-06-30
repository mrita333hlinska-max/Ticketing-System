/**
 * Provides the current session (authenticated user) to the app.
 *
 * DEV BOOTSTRAP: real auth screens arrive in Phase 8. Until then, in dev builds
 * only, this signs in a throwaway local account so the auth-gated API (every
 * business endpoint, per REQUIREMENTS §3) is usable. This block is removed once
 * the real login flow + HTTP adapter land — it is dev-only scaffolding.
 *
 * All API access goes through `sessionService` (PROJECT_RULES §2); this file
 * holds no try/catch around requests.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LoginInput, SignUpInput, User } from '@/entities/user';
import { api, type StubApi, type TicketApi } from '@/shared/api';
import * as sessionService from './sessionService';
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
async function devSignIn(): Promise<User | null> {
  await sessionService.signUp({ email: DEV_EMAIL, password: DEV_PASSWORD });
  const token = devVerificationToken(api, DEV_EMAIL);
  if (token) await sessionService.verifyEmail(token);
  const result = await sessionService.login({
    email: DEV_EMAIL,
    password: DEV_PASSWORD,
  });
  return result.ok ? result.value : null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  const applyUser = useCallback((next: User | null) => {
    setUser(next);
    setStatus(next ? 'authenticated' : 'unauthenticated');
  }, []);

  const reload = useCallback(async () => {
    const result = await sessionService.fetchCurrentUser();
    applyUser(result.ok ? result.value : null);
  }, [applyUser]);

  useEffect(() => {
    let active = true;
    (async () => {
      const currentResult = await sessionService.fetchCurrentUser();
      let current = currentResult.ok ? currentResult.value : null;
      if (!current && import.meta.env.DEV) {
        current = await devSignIn();
      }
      if (active) applyUser(current);
    })();
    return () => {
      active = false;
    };
  }, [applyUser]);

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await sessionService.login(input);
      if (!result.ok) throw new Error(result.error);
      applyUser(result.value);
    },
    [applyUser],
  );

  const logout = useCallback(async () => {
    await sessionService.logout();
    applyUser(null);
  }, [applyUser]);

  const signUp = useCallback(async (input: SignUpInput) => {
    const result = await sessionService.signUp(input);
    if (!result.ok) throw new Error(result.error);
    return result.value;
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    const result = await sessionService.verifyEmail(token);
    if (!result.ok) throw new Error(result.error);
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    const result = await sessionService.resendVerification(email);
    if (!result.ok) throw new Error(result.error);
  }, []);

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
