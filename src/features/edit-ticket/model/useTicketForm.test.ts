import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Ticket } from '@/entities/ticket';
import { useTicketForm } from './useTicketForm';

const ticket: Ticket = {
  id: 't1',
  teamId: 'team-a',
  type: 'bug',
  status: 'new',
  epicId: 'epic-1',
  title: 'Title',
  body: 'Body',
  createdBy: 'user-1',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

describe('useTicketForm', () => {
  it('clears the selected epic when the team changes (§6)', () => {
    const { result } = renderHook(() => useTicketForm(ticket));
    expect(result.current.epicId).toBe('epic-1');

    act(() => result.current.changeTeam('team-b'));

    expect(result.current.teamId).toBe('team-b');
    expect(result.current.epicId).toBeNull();
  });

  it('builds an update patch from the edited fields', () => {
    const { result } = renderHook(() => useTicketForm(ticket));
    act(() => result.current.setTitle('Updated title'));
    expect(result.current.buildPatch()).toMatchObject({
      title: 'Updated title',
      teamId: 'team-a',
      type: 'bug',
      status: 'new',
    });
  });
});
