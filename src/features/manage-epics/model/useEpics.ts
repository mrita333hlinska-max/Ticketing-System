import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Epic } from '@/entities/epic';
import type { Team } from '@/entities/team';
import type { Ticket } from '@/entities/ticket';
import * as epicsService from '../api/epicsService';

type Status = 'loading' | 'ready' | 'error';

/**
 * Epics screen state: loads teams (for the selector) and the selected team's
 * epics with referencing-ticket counts (used to gate deletion — §5). Epics are
 * team-scoped; the team is fixed at creation. Requests go through `epicsService`.
 */
export function useEpics() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    epicsService.loadEpicsOverview().then((result) => {
      if (!active) return;
      if (!result.ok) {
        setStatus('error');
        setLoadError(result.error);
        return;
      }
      setTeams(result.value.teams);
      setEpics(result.value.epics);
      setTickets(result.value.tickets);
      setSelectedTeamId(result.value.teams[0]?.id ?? null);
      setStatus('ready');
    });
    return () => {
      active = false;
    };
  }, []);

  const ticketCounts = useMemo(() => {
    const byEpic = new Map<string, number>();
    tickets.forEach((ticket) => {
      if (ticket.epicId) {
        byEpic.set(ticket.epicId, (byEpic.get(ticket.epicId) ?? 0) + 1);
      }
    });
    return byEpic;
  }, [tickets]);

  const ticketCountFor = useCallback(
    (epicId: string): number => ticketCounts.get(epicId) ?? 0,
    [ticketCounts],
  );

  const visibleEpics = useMemo(
    () => epics.filter((epic) => epic.teamId === selectedTeamId),
    [epics, selectedTeamId],
  );

  const createEpic = useCallback(
    async (title: string, description: string): Promise<boolean> => {
      if (!selectedTeamId) {
        setActionError('Select a team first.');
        return false;
      }
      const result = await epicsService.createEpic({
        teamId: selectedTeamId,
        title,
        description,
      });
      if (!result.ok) {
        setActionError(result.error);
        return false;
      }
      setEpics((current) => [...current, result.value]);
      setActionError(null);
      return true;
    },
    [selectedTeamId],
  );

  const updateEpic = useCallback(
    async (
      id: string,
      title: string,
      description: string,
    ): Promise<boolean> => {
      const result = await epicsService.updateEpic(id, { title, description });
      if (!result.ok) {
        setActionError(result.error);
        return false;
      }
      setEpics((current) =>
        current.map((epic) => (epic.id === id ? result.value : epic)),
      );
      setActionError(null);
      return true;
    },
    [],
  );

  const deleteEpic = useCallback(async (id: string): Promise<void> => {
    const result = await epicsService.deleteEpic(id);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    setEpics((current) => current.filter((epic) => epic.id !== id));
    setActionError(null);
  }, []);

  return {
    status,
    loadError,
    actionError,
    teams,
    selectedTeamId,
    visibleEpics,
    selectTeam: setSelectedTeamId,
    ticketCountFor,
    createEpic,
    updateEpic,
    deleteEpic,
    clearActionError: useCallback(() => setActionError(null), []),
  };
}
