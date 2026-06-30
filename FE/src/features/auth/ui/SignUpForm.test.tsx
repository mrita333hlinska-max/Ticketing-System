import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import {
  SessionContext,
  type SessionContextValue,
} from '@/app/providers/session/SessionContext';
import { SignUpForm } from './SignUpForm';

function renderSignUp(signUp: SessionContextValue['signUp']) {
  const value: SessionContextValue = {
    user: null,
    status: 'unauthenticated',
    login: vi.fn(),
    logout: vi.fn(),
    signUp,
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    reload: vi.fn(),
  };
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <SessionContext.Provider value={value}>
        <SignUpForm />
      </SessionContext.Provider>
    </MemoryRouter>,
  );
}

describe('SignUpForm', () => {
  it('rejects mismatched passwords without calling signUp', async () => {
    const user = userEvent.setup();
    const signUp = vi.fn();
    renderSignUp(signUp);

    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'different1');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Passwords do not match',
    );
    expect(signUp).not.toHaveBeenCalled();
  });

  it('rejects a short password without calling signUp', async () => {
    const user = userEvent.setup();
    const signUp = vi.fn();
    renderSignUp(signUp);

    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.type(screen.getByLabelText('Confirm password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'at least 8 characters',
    );
    expect(signUp).not.toHaveBeenCalled();
  });

  it('submits valid input and shows the verify-your-email message', async () => {
    const user = userEvent.setup();
    const signUp = vi.fn().mockResolvedValue({
      id: 'u1',
      email: 'ana@example.com',
      displayName: 'Ana',
      emailVerified: false,
    });
    renderSignUp(signUp);

    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(signUp).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'password123',
    });
    expect(await screen.findByText(/Continue to login/)).toBeInTheDocument();
  });
});
