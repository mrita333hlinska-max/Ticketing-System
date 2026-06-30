import { useCallback, useEffect, useState } from 'react';
import type { Epic } from '@/entities/epic';
import type { Team } from '@/entities/team';
import type {
  CreateTicketInput,
  Ticket,
  TicketStatus,
} from '@/entities/ticket';
import { api } from '@/shared/api';

type BoardStatus = 'loading' | 'ready' | 'error';

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

/**
 * Orchestrates the board: loads teams, then the selected team's epics and
 * tickets, and exposes the actions the UI needs. Moves are optimistic and
 * revert on failure (REQUIREMENTS §8).
 */
export function useBoard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState<BoardStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  // Load teams once; pick the first as the active board.
  useEffect(() => {
    let active = true;
    api
      .getTeams()
      .then((loadedTeams) => {
        if (!active) return;
        setTeams(loadedTeams);
        if (loadedTeams.length > 0) {
          setSelectedTeamId(loadedTeams[0].id);
        } else {
          setStatus('ready'); // no teams yet — nothing more to load
        }
      })
      .catch((loadError) => {
        if (!active) return;
        setStatus('error');
        setError(toMessage(loadError));
      });
    return () => {
      active = false;
    };
  }, []);

  // Load the selected team's epics + tickets whenever it changes.
  useEffect(() => {
    if (!selectedTeamId) return;
    let active = true;
    setStatus('loading');
    Promise.all([api.getEpics(selectedTeamId), api.getTickets(selectedTeamId)])
      .then(([loadedEpics, loadedTickets]) => {
        if (!active) return;
        setEpics(loadedEpics);
        setTickets(loadedTickets);
        setStatus('ready');
      })
      .catch((loadError) => {
        if (!active) return;
        setStatus('error');
        setError(toMessage(loadError));
      });
    return () => {
      active = false;
    };
  }, [selectedTeamId]);

  const moveTicket = useCallback(
    async (ticketId: string, to: TicketStatus) => {
      const snapshot = tickets;
      const target = tickets.find((ticket) => ticket.id === ticketId);
      if (!target || target.status === to) return;

      // Optimistic: reflect the move immediately.
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: to, updatedAt: new Date().toISOString() }
            : ticket,
        ),
      );
      try {
        const moved = await api.moveTicket(ticketId, to);
        setTickets((current) =>
          current.map((ticket) => (ticket.id === ticketId ? moved : ticket)),
        );
      } catch (moveError) {
        setTickets(snapshot); // revert on failure
        setError(`Could not move ticket. ${toMessage(moveError)}`);
      }
    },
    [tickets],
  );

  const createTicket = useCallback(async (input: CreateTicketInput) => {
    const created = await api.createTicket(input);
    setTickets((current) => [...current, created]);
  }, []);

  return {
    status,
    error,
    teams,
    selectedTeamId,
    epics,
    tickets,
    selectTeam: setSelectedTeamId,
    moveTicket,
    createTicket,
    dismissError: useCallback(() => setError(null), []),
  };
}
