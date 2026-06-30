/**
 * Service layer for the Kanban board (PROJECT_RULES §2): wraps the TicketApi
 * and returns `Result`s so the board hook holds no try/catch around requests.
 */
import type { CreateTicketInput, TicketStatus } from '@/entities/ticket';
import { api, runRequest } from '@/shared/api';

export const loadTeams = () => runRequest(() => api.getTeams());

/** The selected team's epics + tickets, in one call. */
export function loadTeamData(teamId: string) {
  return runRequest(async () => {
    const [epics, tickets] = await Promise.all([
      api.getEpics(teamId),
      api.getTickets(teamId),
    ]);
    return { epics, tickets };
  });
}

export const createTicket = (input: CreateTicketInput) =>
  runRequest(() => api.createTicket(input));

export const moveTicket = (id: string, to: TicketStatus) =>
  runRequest(() => api.moveTicket(id, to));
