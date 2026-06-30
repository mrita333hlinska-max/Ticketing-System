import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import {
  SessionContext,
  type SessionContextValue,
} from '@/app/providers/session/SessionContext';
import { VerifyEmailView } from './VerifyEmailView';

function renderVerify(entry: string, overrides: Partial<SessionContextValue>) {
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
      initialEntries={[entry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <SessionContext.Provider value={value}>
        <VerifyEmailView />
      </SessionContext.Provider>
    </MemoryRouter>,
  );
  return value;
}

describe('VerifyEmailView', () => {
  it('consumes the token and shows success', async () => {
    const verifyEmail = vi.fn().mockResolvedValue(undefined);
    renderVerify('/verify?token=good-token', { verifyEmail });

    expect(await screen.findByText(/Continue to login/)).toBeInTheDocument();
    expect(verifyEmail).toHaveBeenCalledWith('good-token');
  });

  it('shows an error and a resend action for an invalid token', async () => {
    const verifyEmail = vi
      .fn()
      .mockRejectedValue(
        new Error('This verification link is invalid or expired.'),
      );
    renderVerify('/verify?token=expired', { verifyEmail });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'invalid or expired',
    );
    expect(
      screen.getByRole('button', { name: 'Resend email' }),
    ).toBeInTheDocument();
  });
});
