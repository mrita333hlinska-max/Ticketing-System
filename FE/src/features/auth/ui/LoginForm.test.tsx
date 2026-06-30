import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import {
  SessionContext,
  type SessionContextValue,
} from '@/app/providers/session/SessionContext';
import { LoginForm } from './LoginForm';

function renderLogin(overrides: Partial<SessionContextValue>) {
  const value: SessionContextValue = {
    user: null,
    status: 'unauthenticated',
    login: vi.fn(),
    logout: vi.fn(),
    signUp: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    reload: vi.fn(),
    ...overrides,
  };
  render(
    <MemoryRouter
      initialEntries={['/login']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <SessionContext.Provider value={value}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/board" element={<div>Board screen</div>} />
        </Routes>
      </SessionContext.Provider>
    </MemoryRouter>,
  );
  return value;
}

async function fillCredentials(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Email'), 'ana@example.com');
  await user.type(screen.getByLabelText('Password'), 'password123');
}

describe('LoginForm', () => {
  it('navigates to the board on success', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue(undefined);
    renderLogin({ login });

    await fillCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(login).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'password123',
    });
    expect(await screen.findByText('Board screen')).toBeInTheDocument();
  });

  it('shows an error when credentials are rejected', async () => {
    const user = userEvent.setup();
    const login = vi
      .fn()
      .mockRejectedValue(new Error('Invalid email or password.'));
    renderLogin({ login });

    await fillCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password.',
    );
    expect(screen.queryByText('Board screen')).not.toBeInTheDocument();
  });

  it('resends verification for the entered email', async () => {
    const user = userEvent.setup();
    const resendVerification = vi.fn().mockResolvedValue(undefined);
    renderLogin({ resendVerification });

    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.click(screen.getByRole('button', { name: /Resend email/ }));

    expect(resendVerification).toHaveBeenCalledWith('ana@example.com');
    expect(
      await screen.findByText('Verification email sent.'),
    ).toBeInTheDocument();
  });
});
