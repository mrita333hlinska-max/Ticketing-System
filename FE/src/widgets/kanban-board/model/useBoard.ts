import { useCallback, useEffect, useState } from 'react';
import type { Epic } from '@/entities/epic';
import type { Team } from '@/entities/team';
import type {
  CreateTicketInput,
  Ticket,
  TicketStatus,
} from '@/entities/ticket';
import * as boardService from '../api/boardService';

type BoardStatus = 'loading' | 'ready' | 'error';

/**
 * Orchestrates the board: loads teams, then the selected team's epics and
 * tickets, and exposes the actions the UI needs. Moves are optimistic and
 * revert on failure (REQUIREMENTS §8). Requests go through `boardService`.
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
    boardService.loadTeams().then((result) => {
      if (!active) return;
      if (!result.ok) {
        setStatus('error');
        setError(result.error);
        return;
      }
      setTeams(result.value);
      if (result.value.length > 0) {
        setSelectedTeamId(result.value[0].id);
      } else {
        setStatus('ready'); // no teams yet — nothing more to load
      }
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
    boardService.loadTeamData(selectedTeamId).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setStatus('error');
        setError(result.error);
        return;
      }
      setEpics(result.value.epics);
      setTickets(result.value.tickets);
      setStatus('ready');
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

      const result = await boardService.moveTicket(ticketId, to);
      if (!result.ok) {
        setTickets(snapshot); // revert on failure
        setError(`Could not move ticket. ${result.error}`);
        return;
      }
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId ? result.value : ticket,
        ),
      );
    },
    [tickets],
  );

  const createTicket = useCallback(async (input: CreateTicketInput) => {
    const result = await boardService.createTicket(input);
    if (!result.ok) throw new Error(result.error); // surfaced by the dialog
    setTickets((current) => [...current, result.value]);
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
