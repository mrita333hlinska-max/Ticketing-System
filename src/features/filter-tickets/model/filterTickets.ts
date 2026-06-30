import type { Ticket, TicketType } from '@/entities/ticket';

/** "all" means the filter is inactive for that dimension. */
export interface TicketFilters {
  /** Case-insensitive substring matched against the ticket title. */
  search: string;
  type: TicketType | 'all';
  epicId: string | 'all';
}

export const EMPTY_FILTERS: TicketFilters = {
  search: '',
  type: 'all',
  epicId: 'all',
};

/** True when any filter would narrow the list (used to enable "Clear"). */
export function hasActiveFilters(filters: TicketFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.type !== 'all' ||
    filters.epicId !== 'all'
  );
}

/**
 * Apply all active filters with AND logic (REQUIREMENTS §8): type, epic, and a
 * case-insensitive title substring search.
 */
export function filterTickets(
  tickets: Ticket[],
  filters: TicketFilters,
): Ticket[] {
  const search = filters.search.trim().toLowerCase();
  return tickets.filter((ticket) => {
    if (filters.type !== 'all' && ticket.type !== filters.type) return false;
    if (filters.epicId !== 'all' && ticket.epicId !== filters.epicId) {
      return false;
    }
    if (search && !ticket.title.toLowerCase().includes(search)) return false;
    return true;
  });
}
