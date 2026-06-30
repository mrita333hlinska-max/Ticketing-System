/**
 * The Kanban workflow — REQUIREMENTS §6 (states) and §8 (board).
 *
 * The set of states is fixed and ordered (for column layout), but moves are
 * NOT restricted: a card may go from any state directly to any other (§8 —
 * "sequential transitions are not enforced"). So this module owns the canonical
 * states, their display labels, and their order — not a transition graph.
 */
import type { TicketStatus, TicketType } from './types';

/** Ordered workflow columns, left → right (§8: exactly five, in this order). */
export const WORKFLOW_STATES: readonly TicketStatus[] = [
  'new',
  'ready_for_implementation',
  'in_progress',
  'ready_for_acceptance',
  'done',
] as const;

/** Human-readable labels with spaces (§6). UI may upper-case via CSS. */
export const STATUS_LABELS: Record<TicketStatus, string> = {
  new: 'New',
  ready_for_implementation: 'Ready for Implementation',
  in_progress: 'In Progress',
  ready_for_acceptance: 'Ready for Acceptance',
  done: 'Done',
};

/** The status every new ticket starts in. */
export const INITIAL_STATUS: TicketStatus = WORKFLOW_STATES[0];

export const TICKET_TYPES: readonly TicketType[] = [
  'bug',
  'feature',
  'fix',
] as const;

export const TYPE_LABELS: Record<TicketType, string> = {
  bug: 'Bug',
  feature: 'Feature',
  fix: 'Fix',
};

export function isTicketStatus(value: unknown): value is TicketStatus {
  return (
    typeof value === 'string' && WORKFLOW_STATES.includes(value as TicketStatus)
  );
}

export function isTicketType(value: unknown): value is TicketType {
  return (
    typeof value === 'string' && TICKET_TYPES.includes(value as TicketType)
  );
}

/** Column order index for a status (used to lay out / sort columns). */
export function getStatusOrder(status: TicketStatus): number {
  return WORKFLOW_STATES.indexOf(status);
}

/**
 * Whether a move is allowed. Any valid state is reachable from any other; the
 * only non-move is "to the same state". Target validity is still checked so
 * bad enum values are rejected (the backend remains authoritative — §6).
 */
export function canMove(from: TicketStatus, to: TicketStatus): boolean {
  return isTicketStatus(to) && from !== to;
}
