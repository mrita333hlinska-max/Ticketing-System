/**
 * Service layer for the Teams screen (PROJECT_RULES §2): wraps the TicketApi
 * and returns `Result`s, so the hook holds no try/catch around requests.
 */
import { api, runRequest } from '@/shared/api';

/** Teams plus all tickets/epics (used to derive per-team counts), in one call. */
export function loadTeamsOverview() {
  return runRequest(async () => {
    const [teams, tickets, epics] = await Promise.all([
      api.getTeams(),
      api.getTickets(),
      api.getEpics(),
    ]);
    return { teams, tickets, epics };
  });
}

export const createTeam = (name: string) =>
  runRequest(() => api.createTeam({ name }));

export const renameTeam = (id: string, name: string) =>
  runRequest(() => api.updateTeam(id, { name }));

export const deleteTeam = (id: string) => runRequest(() => api.deleteTeam(id));
