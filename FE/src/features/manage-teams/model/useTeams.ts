import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Epic } from '@/entities/epic';
import type { Team } from '@/entities/team';
import type { Ticket } from '@/entities/ticket';
import * as teamsService from '../api/teamsService';

export interface TeamCounts {
  tickets: number;
  epics: number;
}

type Status = 'loading' | 'ready' | 'error';

/**
 * Teams screen state: loads teams + per-team ticket/epic counts (used to gate
 * deletion — §4) and exposes create/rename/delete. All requests go through
 * `teamsService`; this hook only orchestrates state from the returned Results.
 */
export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    teamsService.loadTeamsOverview().then((result) => {
      if (!active) return;
      if (!result.ok) {
        setStatus('error');
        setLoadError(result.error);
        return;
      }
      setTeams(result.value.teams);
      setTickets(result.value.tickets);
      setEpics(result.value.epics);
      setStatus('ready');
    });
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => {
    const byTeam = new Map<string, TeamCounts>();
    const bump = (teamId: string, key: keyof TeamCounts) => {
      const current = byTeam.get(teamId) ?? { tickets: 0, epics: 0 };
      current[key] += 1;
      byTeam.set(teamId, current);
    };
    tickets.forEach((ticket) => bump(ticket.teamId, 'tickets'));
    epics.forEach((epic) => bump(epic.teamId, 'epics'));
    return byTeam;
  }, [tickets, epics]);

  const countsFor = useCallback(
    (teamId: string): TeamCounts =>
      counts.get(teamId) ?? { tickets: 0, epics: 0 },
    [counts],
  );

  const createTeam = useCallback(async (name: string): Promise<boolean> => {
    const result = await teamsService.createTeam(name);
    if (!result.ok) {
      setActionError(result.error);
      return false;
    }
    setTeams((current) => [...current, result.value]);
    setActionError(null);
    return true;
  }, []);

  const renameTeam = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      const result = await teamsService.renameTeam(id, name);
      if (!result.ok) {
        setActionError(result.error);
        return false;
      }
      setTeams((current) =>
        current.map((team) => (team.id === id ? result.value : team)),
      );
      setActionError(null);
      return true;
    },
    [],
  );

  const deleteTeam = useCallback(async (id: string): Promise<void> => {
    const result = await teamsService.deleteTeam(id);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    setTeams((current) => current.filter((team) => team.id !== id));
    setActionError(null);
  }, []);

  return {
    status,
    loadError,
    actionError,
    teams,
    countsFor,
    createTeam,
    renameTeam,
    deleteTeam,
    clearActionError: useCallback(() => setActionError(null), []),
  };
}
