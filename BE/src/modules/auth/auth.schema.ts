/**
 * Zod schemas for auth request bodies. These validate the request *shape*
 * (fields present and typed); the semantic rules with user-facing messages
 * (email format, password length, uniqueness) live in the service so their
 * wording matches the FE exactly.
 */
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const verifySchema = z.object({
  token: z.string().min(1, 'A verification token is required.'),
});

export const resendSchema = z.object({
  email: z.string(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
