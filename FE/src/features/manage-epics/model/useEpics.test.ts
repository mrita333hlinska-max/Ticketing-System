import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/shared/api';
import { useEpics } from './useEpics';

async function loginUser() {
  await api.signUp({ email: 'ana@example.com', password: 'password123' });
  const token = api.getVerificationTokenFor('ana@example.com');
  await api.verifyEmail(token!);
  await api.login({ email: 'ana@example.com', password: 'password123' });
}

beforeEach(() => api.reset());

describe('useEpics', () => {
  it('creates an epic for the selected team', async () => {
    await loginUser();
    await api.createTeam({ name: 'Payments' });

    const { result } = renderHook(() => useEpics());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    let succeeded: boolean | undefined;
    await act(async () => {
      succeeded = await result.current.createEpic(
        'Checkout',
        'Improve checkout',
      );
    });

    expect(succeeded).toBe(true);
    expect(result.current.visibleEpics.map((epic) => epic.title)).toEqual([
      'Checkout',
    ]);
  });

  it('blocks deleting an epic that tickets reference (§5)', async () => {
    await loginUser();
    const team = await api.createTeam({ name: 'Payments' });
    const epic = await api.createEpic({
      teamId: team.id,
      title: 'Checkout',
      description: null,
    });
    await api.createTicket({
      teamId: team.id,
      type: 'bug',
      title: 'Payment fails',
      body: 'Steps',
      epicId: epic.id,
    });

    const { result } = renderHook(() => useEpics());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.ticketCountFor(epic.id)).toBe(1);

    await act(async () => {
      await result.current.deleteEpic(epic.id);
    });

    expect(result.current.actionError).toMatch(/cannot delete/i);
    expect(result.current.visibleEpics).toHaveLength(1);
  });
});
