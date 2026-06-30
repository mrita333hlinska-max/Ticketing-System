import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import {
  SessionContext,
  type SessionContextValue,
} from '@/app/providers/session/SessionContext';
import { TopNav } from './TopNav';

function renderTopNav(overrides: Partial<SessionContextValue> = {}) {
  const value: SessionContextValue = {
    user: {
      id: 'u1',
      email: 'alex@example.com',
      displayName: 'Alex',
      emailVerified: true,
    },
    status: 'authenticated',
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
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <SessionContext.Provider value={value}>
        <TopNav />
      </SessionContext.Provider>
    </MemoryRouter>,
  );
  return value;
}

describe('TopNav', () => {
  it('renders the brand, tabs, and current user email', () => {
    renderTopNav();
    expect(screen.getByText('TICKET TRACKER')).toBeInTheDocument();
    ['Board', 'Teams', 'Epics'].forEach((label) => {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    });
    expect(screen.getByText('alex@example.com')).toBeInTheDocument();
  });

  it('logs out from the user menu', async () => {
    const value = renderTopNav();
    await userEvent.click(
      screen.getByRole('button', { name: /alex@example.com/ }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Log out' }));
    expect(value.logout).toHaveBeenCalledOnce();
  });
});
