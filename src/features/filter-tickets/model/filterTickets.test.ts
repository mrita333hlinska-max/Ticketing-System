import { describe, expect, it } from 'vitest';
import type { Ticket } from '@/entities/ticket';
import { EMPTY_FILTERS, filterTickets } from './filterTickets';

function makeTicket(overrides: Partial<Ticket>): Ticket {
  return {
    id: '1',
    teamId: 'team',
    type: 'bug',
    status: 'new',
    epicId: null,
    title: 'Title',
    body: 'Body',
    createdBy: 'user',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

const tickets = [
  makeTicket({ id: '1', title: 'Payment fails', type: 'bug', epicId: 'e1' }),
  makeTicket({ id: '2', title: 'Add retry', type: 'feature', epicId: 'e2' }),
  makeTicket({ id: '3', title: 'Fix logging', type: 'fix', epicId: null }),
];

describe('filterTickets', () => {
  it('returns everything with empty filters', () => {
    expect(filterTickets(tickets, EMPTY_FILTERS)).toHaveLength(3);
  });

  it('filters by type', () => {
    const result = filterTickets(tickets, {
      ...EMPTY_FILTERS,
      type: 'feature',
    });
    expect(result.map((ticket) => ticket.id)).toEqual(['2']);
  });

  it('filters by epic', () => {
    const result = filterTickets(tickets, { ...EMPTY_FILTERS, epicId: 'e1' });
    expect(result.map((ticket) => ticket.id)).toEqual(['1']);
  });

  it('searches the title case-insensitively', () => {
    const result = filterTickets(tickets, {
      ...EMPTY_FILTERS,
      search: 'PAYMENT',
    });
    expect(result.map((ticket) => ticket.id)).toEqual(['1']);
  });

  it('combines active filters with AND', () => {
    const result = filterTickets(tickets, {
      ...EMPTY_FILTERS,
      type: 'bug',
      search: 'retry',
    });
    expect(result).toHaveLength(0);
  });
});
