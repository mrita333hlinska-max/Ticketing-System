/**
 * Ticket domain types — REQUIREMENTS §6.
 *
 * Pure types only; no React, storage, or sibling-entity imports. Cross-entity
 * references are held as plain string ids (teamId, epicId, createdBy).
 */

/** Classification label only — no workflow difference between values (§6). */
export type TicketType = 'bug' | 'feature' | 'fix';

/** Canonical API state values (§6). UI renders human-readable labels. */
export type TicketStatus =
  | 'new'
  | 'ready_for_implementation'
  | 'in_progress'
  | 'ready_for_acceptance'
  | 'done';

export interface Ticket {
  id: string;
  /** Owning team. Determines which board the ticket appears on. */
  teamId: string;
  type: TicketType;
  status: TicketStatus;
  /** Optional epic; when set, must belong to the same team (§5). */
  epicId: string | null;
  title: string;
  body: string;
  /** User id of the creator, set by the server from the authenticated user. */
  createdBy: string;
  /** ISO-8601, UTC, server-set (§6, §9). */
  createdAt: string;
  /** ISO-8601, UTC; advances only on real field/state change (§6). */
  updatedAt: string;
}

/** Fields supplied when creating a ticket. Status starts at `new` (server). */
export interface CreateTicketInput {
  teamId: string;
  type: TicketType;
  title: string;
  body: string;
  epicId: string | null;
}

/** Fields that may be patched on an existing ticket (§6 edit operations). */
export type UpdateTicketInput = Partial<{
  teamId: string;
  type: TicketType;
  status: TicketStatus;
  epicId: string | null;
  title: string;
  body: string;
}>;
