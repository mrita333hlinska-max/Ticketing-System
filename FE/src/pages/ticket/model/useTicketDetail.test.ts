import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/shared/api';
import { useTicketDetail } from './useTicketDetail';

async function setupTicket() {
  await api.signUp({ email: 'ana@example.com', password: 'password123' });
  const token = api.getVerificationTokenFor('ana@example.com');
  await api.verifyEmail(token!);
  await api.login({ email: 'ana@example.com', password: 'password123' });
  const team = await api.createTeam({ name: 'Payments' });
  return api.createTicket({
    teamId: team.id,
    type: 'bug',
    title: 'Payment fails',
    body: 'Steps…',
    epicId: null,
  });
}

beforeEach(() => api.reset());

describe('useTicketDetail', () => {
  it('appends a comment without bumping the ticket updatedAt (§7)', async () => {
    const ticket = await setupTicket();
    const { result } = renderHook(() => useTicketDetail(ticket.id));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    const updatedBefore = result.current.data!.ticket.updatedAt;

    let succeeded: boolean | undefined;
    await act(async () => {
      succeeded = await result.current.postComment('Reproduced in Chrome.');
    });

    expect(succeeded).toBe(true);
    expect(result.current.data!.comments).toHaveLength(1);
    expect(result.current.data!.ticket.updatedAt).toBe(updatedBefore);
  });
});
