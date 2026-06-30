import type { Epic } from '@/entities/epic';
import { TICKET_TYPES, TYPE_LABELS, type TicketType } from '@/entities/ticket';
import { Button, Select, TextInput, type SelectOption } from '@/shared/ui';
import type { TicketFilters } from '../model/filterTickets';
import styles from './FilterBar.module.css';

interface FilterBarProps {
  filters: TicketFilters;
  epics: Epic[];
  /** Number of tickets currently shown (after filtering). */
  count: number;
  isActive: boolean;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: TicketType | 'all') => void;
  onEpicChange: (value: string) => void;
  onClear: () => void;
}

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All types' },
  ...TICKET_TYPES.map((type) => ({ value: type, label: TYPE_LABELS[type] })),
];

export function FilterBar({
  filters,
  epics,
  count,
  isActive,
  onSearchChange,
  onTypeChange,
  onEpicChange,
  onClear,
}: FilterBarProps) {
  const epicOptions: SelectOption[] = [
    { value: 'all', label: 'All epics' },
    ...epics.map((epic) => ({ value: epic.id, label: epic.title })),
  ];

  return (
    <div className={styles.bar}>
      <TextInput
        label="Search"
        placeholder="Search title…"
        value={filters.search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <Select
        label="Type"
        options={TYPE_OPTIONS}
        value={filters.type}
        onChange={(event) =>
          onTypeChange(event.target.value as TicketType | 'all')
        }
      />
      <Select
        label="Epic"
        options={epicOptions}
        value={filters.epicId}
        onChange={(event) => onEpicChange(event.target.value)}
      />
      <Button
        variant="secondary"
        onClick={onClear}
        disabled={!isActive}
        className={styles.clear}
      >
        Clear
      </Button>
      <span className={styles.count}>
        {count} {count === 1 ? 'ticket' : 'tickets'}
      </span>
    </div>
  );
}
