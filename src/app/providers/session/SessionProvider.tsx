/**
 * Provides the current session (authenticated user) to the app. On mount it
 * restores any existing session; the real auth screens (Phase 8) establish one.
 *
 * All API access goes through `sessionService` (PROJECT_RULES §2); this file
 * holds no try/catch around requests.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LoginInput, SignUpInput, User } from '@/entities/user';
import * as sessionService from './sessionService';
import {
  SessionContext,
  type SessionContextValue,
  type SessionStatus,
} from './SessionContext';

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

  // Restore an existing session on load.
  useEffect(() => {
    let active = true;
    sessionService.fetchCurrentUser().then((result) => {
      if (active) applyUser(result.ok ? result.value : null);
    });
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
