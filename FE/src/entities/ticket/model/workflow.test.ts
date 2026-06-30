import { describe, expect, it } from 'vitest';
import {
  WORKFLOW_STATES,
  STATUS_LABELS,
  INITIAL_STATUS,
  canMove,
  getStatusOrder,
  isTicketStatus,
  isTicketType,
} from './workflow';

describe('workflow', () => {
  it('has exactly five states in canonical order (§8)', () => {
    expect(WORKFLOW_STATES).toEqual([
      'new',
      'ready_for_implementation',
      'in_progress',
      'ready_for_acceptance',
      'done',
    ]);
  });

  it('starts new tickets in the first state', () => {
    expect(INITIAL_STATUS).toBe('new');
  });

  it('labels every state with a human-readable string', () => {
    for (const state of WORKFLOW_STATES) {
      expect(STATUS_LABELS[state]).toBeTruthy();
    }
  });

  it('allows any-to-any moves except to the same state (§8)', () => {
    expect(canMove('new', 'done')).toBe(true);
    expect(canMove('done', 'new')).toBe(true);
    expect(canMove('in_progress', 'in_progress')).toBe(false);
  });

  it('rejects moves to an invalid target state', () => {
    // @ts-expect-error testing a bad enum value at the boundary
    expect(canMove('new', 'archived')).toBe(false);
  });

  it('orders states for column layout', () => {
    expect(getStatusOrder('new')).toBe(0);
    expect(getStatusOrder('done')).toBe(4);
  });

  it('guards status and type values', () => {
    expect(isTicketStatus('in_progress')).toBe(true);
    expect(isTicketStatus('nope')).toBe(false);
    expect(isTicketType('bug')).toBe(true);
    expect(isTicketType('epic')).toBe(false);
  });
});
