import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/shared/api';
import { TicketPage } from './TicketPage';

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
    body: 'Steps to reproduce',
    epicId: null,
  });
}

beforeEach(() => api.reset());

function renderTicket(ticketId: string) {
  render(
    <MemoryRouter
      initialEntries={[`/tickets/${ticketId}`]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/tickets/:ticketId" element={<TicketPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TicketPage', () => {
  it('posts a comment and saves a title edit', async () => {
    const user = userEvent.setup();
    const ticket = await setupTicket();
    renderTicket(ticket.id);

    // loads
    await screen.findByRole('heading', { name: 'Payment fails' });

    // post a comment
    await user.type(screen.getByLabelText('Add comment'), 'Reproduced.');
    await user.click(screen.getByRole('button', { name: 'Post comment' }));
    expect(await screen.findByText('Reproduced.')).toBeInTheDocument();

    // edit the title and save
    const titleInput = screen.getByLabelText('Title');
    await user.clear(titleInput);
    await user.type(titleInput, 'Payment fails for expired card');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
