/**
 * Zod schemas for team request bodies (REQUIREMENTS §4). Shape only; the
 * non-empty-after-trim and case-insensitive-uniqueness rules live in the
 * service so their messages match the FE.
 */
import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string(),
});

export const updateTeamSchema = z.object({
  name: z.string(),
});
