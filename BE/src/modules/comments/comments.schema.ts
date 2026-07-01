/**
 * Zod schema for adding a comment (REQUIREMENTS §7). Shape only; the non-empty
 * rule lives in the service so its message matches the FE.
 */
import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.string(),
});
