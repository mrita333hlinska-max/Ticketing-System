import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/shared/api';
import { useTeams } from './useTeams';

async function loginUser() {
  await api.signUp({ email: 'ana@example.com', password: 'password123' });
  const token = api.getVerificationTokenFor('ana@example.com');
  await api.verifyEmail(token!);
  await api.login({ email: 'ana@example.com', password: 'password123' });
}

beforeEach(() => api.reset());

describe('useTeams', () => {
  it('reports a conflict when creating a duplicate name (§4)', async () => {
    await loginUser();
    await api.createTeam({ name: 'Payments' });

    const { result } = renderHook(() => useTeams());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    let succeeded: boolean | undefined;
    await act(async () => {
      succeeded = await result.current.createTeam('payments');
    });

    expect(succeeded).toBe(false);
    expect(result.current.actionError).toMatch(/already exists/i);
  });

  it('blocks deleting a team that still has tickets (§4)', async () => {
    await loginUser();
    const team = await api.createTeam({ name: 'Payments' });
    await api.createTicket({
      teamId: team.id,
      type: 'bug',
      title: 'Payment fails',
      body: 'Steps…',
      epicId: null,
    });

    const { result } = renderHook(() => useTeams());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.countsFor(team.id).tickets).toBe(1);

    await act(async () => {
      await result.current.deleteTeam(team.id);
    });

    expect(result.current.actionError).toMatch(/cannot delete/i);
    expect(result.current.teams).toHaveLength(1);
  });
});
