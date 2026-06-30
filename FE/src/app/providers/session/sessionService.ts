/**
 * Service layer for authentication (PROJECT_RULES §2): wraps the TicketApi auth
 * methods and returns `Result`s, so the provider holds no try/catch.
 */
import type { LoginInput, SignUpInput } from '@/entities/user';
import { api, runRequest } from '@/shared/api';

export const fetchCurrentUser = () => runRequest(() => api.getCurrentUser());
export const login = (input: LoginInput) => runRequest(() => api.login(input));
export const logout = () => runRequest(() => api.logout());
export const signUp = (input: SignUpInput) =>
  runRequest(() => api.signUp(input));
export const verifyEmail = (token: string) =>
  runRequest(() => api.verifyEmail(token));
export const resendVerification = (email: string) =>
  runRequest(() => api.resendVerification(email));
