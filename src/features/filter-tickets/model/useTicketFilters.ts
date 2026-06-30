import { useCallback, useState } from 'react';
import type { TicketType } from '@/entities/ticket';
import { EMPTY_FILTERS, hasActiveFilters } from './filterTickets';

/** Holds board filter state and exposes intent-named setters. */
export function useTicketFilters() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const setSearch = useCallback((search: string) => {
    setFilters((current) => ({ ...current, search }));
  }, []);

  const setType = useCallback((type: TicketType | 'all') => {
    setFilters((current) => ({ ...current, type }));
  }, []);

  const setEpicId = useCallback((epicId: string) => {
    setFilters((current) => ({ ...current, epicId }));
  }, []);

  const clear = useCallback(() => setFilters(EMPTY_FILTERS), []);

  return {
    filters,
    setSearch,
    setType,
    setEpicId,
    clear,
    isActive: hasActiveFilters(filters),
  };
}
