/**
 * Zod schemas for epic request bodies (REQUIREMENTS §5). Shape only; the
 * title-required and team-existence rules live in the service.
 *
 * `teamId` is present on create and intentionally ABSENT from update — an
 * epic's team is chosen once and immutable (moving epics between teams is out
 * of scope). `description` may be a string, `null` (clear it), or omitted.
 */
import { z } from 'zod';

export const createEpicSchema = z.object({
  teamId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
});

export const updateEpicSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
});
