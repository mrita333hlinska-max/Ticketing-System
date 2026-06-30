import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WORKFLOW_STATES } from '@/entities/ticket';
import { CreateTicketDialog } from '@/features/create-ticket';
import {
  FilterBar,
  filterTickets,
  useTicketFilters,
} from '@/features/filter-tickets';
import { useBoardDnd } from '@/features/move-ticket';
import { Button, Select, Spinner, type SelectOption } from '@/shared/ui';
import { useBoard } from '../model/useBoard';
import { BoardColumn } from './BoardColumn';
import styles from './KanbanBoard.module.css';

export function KanbanBoard() {
  const board = useBoard();
  const navigate = useNavigate();
  const { filters, setSearch, setType, setEpicId, clear, isActive } =
    useTicketFilters();
  const dnd = useBoardDnd(board.moveTicket);
  const [isCreating, setCreating] = useState(false);

  const epicNameById = useMemo(
    () => new Map(board.epics.map((epic) => [epic.id, epic.title])),
    [board.epics],
  );

  const visibleTickets = useMemo(
    () => filterTickets(board.tickets, filters),
    [board.tickets, filters],
  );

  // Each column holds its status's tickets, most recently modified first (§8).
  const columns = useMemo(
    () =>
      WORKFLOW_STATES.map((status) => ({
        status,
        tickets: visibleTickets
          .filter((ticket) => ticket.status === status)
          .sort((first, second) =>
            second.updatedAt.localeCompare(first.updatedAt),
          ),
      })),
    [visibleTickets],
  );

  if (board.status === 'loading') {
    return <Spinner fullPage label="Loading board…" />;
  }

  if (board.status === 'error') {
    return (
      <div className={styles.message} role="alert">
        <h1>Board</h1>
        <p>Could not load the board. {board.error}</p>
      </div>
    );
  }

  if (board.teams.length === 0) {
    return (
      <div className={styles.message}>
        <h1>Board</h1>
        <p>
          No teams yet — create one on the Teams page to start adding tickets.
        </p>
      </div>
    );
  }

  const teamOptions: SelectOption[] = board.teams.map((team) => ({
    value: team.id,
    label: team.name,
  }));

  return (
    <div className={styles.board}>
      <div className={styles.toolbar}>
        <Select
          label="Team"
          options={teamOptions}
          value={board.selectedTeamId ?? ''}
          onChange={(event) => board.selectTeam(event.target.value)}
        />
        <Button onClick={() => setCreating(true)}>+ New ticket</Button>
      </div>

      <FilterBar
        filters={filters}
        epics={board.epics}
        count={visibleTickets.length}
        isActive={isActive}
        onSearchChange={setSearch}
        onTypeChange={setType}
        onEpicChange={setEpicId}
        onClear={clear}
      />

      {board.error && (
        <div className={styles.banner} role="alert">
          <span>{board.error}</span>
          <button
            type="button"
            className={styles.dismiss}
            aria-label="Dismiss"
            onClick={board.dismissError}
          >
            ×
          </button>
        </div>
      )}

      {visibleTickets.length === 0 && (
        <p className={styles.emptyHint}>
          {board.tickets.length === 0
            ? 'No tickets yet — create one with “+ New ticket”.'
            : 'No tickets match your filters.'}
        </p>
      )}

      <div className={styles.columns}>
        {columns.map((column) => (
          <BoardColumn
            key={column.status}
            status={column.status}
            tickets={column.tickets}
            epicNameById={epicNameById}
            isDropTarget={dnd.dropTarget === column.status}
            columnHandlers={dnd.columnHandlers(column.status)}
            cardHandlers={dnd.cardHandlers}
            onOpenTicket={(ticketId) => navigate(`/tickets/${ticketId}`)}
          />
        ))}
      </div>

      {isCreating && board.selectedTeamId && (
        <CreateTicketDialog
          teamId={board.selectedTeamId}
          epics={board.epics}
          onSubmit={board.createTicket}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}
