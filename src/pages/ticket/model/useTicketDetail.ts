import { useCallback, useEffect, useState } from 'react';
import type { TicketComment } from '@/entities/comment';
import type { Epic } from '@/entities/epic';
import type { Team } from '@/entities/team';
import type { Ticket, UpdateTicketInput } from '@/entities/ticket';
import type { User } from '@/entities/user';
import * as ticketDetailService from '../api/ticketDetailService';

type Status = 'loading' | 'ready' | 'error';

interface DetailData {
  ticket: Ticket;
  teams: Team[];
  epics: Epic[];
  users: User[];
  comments: TicketComment[];
}

/**
 * Loads a ticket plus the reference data the detail screen needs (teams, epics,
 * users, comments) and exposes save / delete / add-comment. Requests go through
 * `ticketDetailService`; this hook only orchestrates state from the Results.
 */
export function useTicketDetail(ticketId: string) {
  const [data, setData] = useState<DetailData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    ticketDetailService.loadTicketDetail(ticketId).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setStatus('error');
        setLoadError(result.error);
        return;
      }
      setData(result.value);
      setStatus('ready');
    });
    return () => {
      active = false;
    };
  }, [ticketId]);

  const saveTicket = useCallback(
    async (patch: UpdateTicketInput): Promise<boolean> => {
      const result = await ticketDetailService.updateTicket(ticketId, patch);
      if (!result.ok) {
        setActionError(result.error);
        return false;
      }
      setData((current) =>
        current ? { ...current, ticket: result.value } : current,
      );
      setActionError(null);
      return true;
    },
    [ticketId],
  );

  const removeTicket = useCallback(async (): Promise<boolean> => {
    const result = await ticketDetailService.deleteTicket(ticketId);
    if (!result.ok) {
      setActionError(result.error);
      return false;
    }
    return true;
  }, [ticketId]);

  const postComment = useCallback(
    async (body: string): Promise<boolean> => {
      const result = await ticketDetailService.addComment({ ticketId, body });
      if (!result.ok) {
        setActionError(result.error);
        return false;
      }
      setData((current) =>
        current
          ? { ...current, comments: [...current.comments, result.value] }
          : current,
      );
      setActionError(null);
      return true;
    },
    [ticketId],
  );

  return {
    status,
    loadError,
    actionError,
    data,
    saveTicket,
    removeTicket,
    postComment,
    clearActionError: useCallback(() => setActionError(null), []),
  };
}
