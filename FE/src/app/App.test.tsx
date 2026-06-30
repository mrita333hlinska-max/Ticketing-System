import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/shared/api';
import App from './App';

beforeEach(() => api.reset());

describe('App — ticket comments (full path)', () => {
  it('shows a posted comment on the ticket detail screen', async () => {
    const user = userEvent.setup();
    // Seed a session + ticket, mirroring the running app's state.
    await api.signUp({ email: 'ana@example.com', password: 'password123' });
    await api.verifyEmail(api.getVerificationTokenFor('ana@example.com')!);
    await api.login({ email: 'ana@example.com', password: 'password123' });
    const team = await api.createTeam({ name: 'Payments' });
    const ticket = await api.createTicket({
      teamId: team.id,
      type: 'bug',
      title: 'Payment fails',
      body: 'Steps',
      epicId: null,
    });

    window.history.pushState({}, '', `/tickets/${ticket.id}`);
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    await screen.findByRole('heading', { name: 'Payment fails' });

    await user.type(screen.getByLabelText('Add comment'), 'Reproduced.');
    await user.click(screen.getByRole('button', { name: 'Post comment' }));

    expect(await screen.findByText('Reproduced.')).toBeInTheDocument();
  });
});
