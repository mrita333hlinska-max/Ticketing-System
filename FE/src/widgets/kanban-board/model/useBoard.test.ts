import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/shared/api';
import { useBoard } from './useBoard';

async function loginUser() {
  await api.signUp({ email: 'ana@example.com', password: 'password123' });
  const token = api.getVerificationTokenFor('ana@example.com');
  await api.verifyEmail(token!);
  await api.login({ email: 'ana@example.com', password: 'password123' });
}

beforeEach(() => {
  api.reset();
  vi.restoreAllMocks();
});

describe('useBoard', () => {
  it('reverts an optimistic move when the API rejects (§8)', async () => {
    await loginUser();
    const team = await api.createTeam({ name: 'Payments' });
    const ticket = await api.createTicket({
      teamId: team.id,
      type: 'bug',
      title: 'Payment fails',
      body: 'Steps…',
      epicId: null,
    });

    const { result } = renderHook(() => useBoard());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    vi.spyOn(api, 'moveTicket').mockRejectedValueOnce(
      new Error('network down'),
    );

    await act(async () => {
      await result.current.moveTicket(ticket.id, 'done');
    });

    const reverted = result.current.tickets.find(
      (candidate) => candidate.id === ticket.id,
    );
    expect(reverted?.status).toBe('new'); // rolled back, not 'done'
    expect(result.current.error).toMatch(/Could not move/);
  });
});
