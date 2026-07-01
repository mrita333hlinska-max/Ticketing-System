/**
 * Zod schemas + canonical enums for ticket request bodies (REQUIREMENTS §6).
 *
 * Enum values are the canonical API values shared with the FE
 * (`FE/src/entities/ticket/model/*`). Bad enum values are rejected here with the
 * same messages the stub used, so backend validation is authoritative (§6, §9).
 *
 * On update, every field is optional; `epicId: null` clears the epic, while an
 * omitted `epicId` leaves it unchanged — the service relies on that distinction.
 */
import { z } from 'zod';

export const TICKET_TYPES = ['bug', 'feature', 'fix'] as const;
export const TICKET_STATUSES = [
  'new',
  'ready_for_implementation',
  'in_progress',
  'ready_for_acceptance',
  'done',
] as const;

export type TicketType = (typeof TICKET_TYPES)[number];
export type TicketStatus = (typeof TICKET_STATUSES)[number];

/** Every new ticket starts here (§6). */
export const INITIAL_STATUS: TicketStatus = 'new';

const typeField = z.enum(TICKET_TYPES, {
  errorMap: () => ({ message: 'Invalid ticket type.' }),
});
const statusField = z.enum(TICKET_STATUSES, {
  errorMap: () => ({ message: 'Invalid ticket status.' }),
});

export const createTicketSchema = z.object({
  teamId: z.string(),
  type: typeField,
  title: z.string(),
  body: z.string(),
  epicId: z.string().nullable().optional(),
});

export const updateTicketSchema = z.object({
  teamId: z.string().optional(),
  type: typeField.optional(),
  status: statusField.optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  epicId: z.string().nullable().optional(),
});
