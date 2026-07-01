/**
 * Request-body validation helper. Parses `body` against a Zod schema and throws
 * a {@link ValidationError} (→ HTTP 400) on failure, so route handlers stay a
 * single line and never hold `try/catch`. Backend validation is authoritative
 * (REQUIREMENTS §6, §9).
 */
import type { ZodType } from 'zod';
import { ValidationError } from './errors';

export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.join('.');
    const message = issue
      ? path
        ? `${path}: ${issue.message}`
        : issue.message
      : 'Invalid request body.';
    throw new ValidationError(message);
  }
  return result.data;
}
