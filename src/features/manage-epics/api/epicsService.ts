/**
 * Service layer for the Epics screen (PROJECT_RULES §2): wraps the TicketApi
 * and returns `Result`s so the hook holds no try/catch.
 */
import type { CreateEpicInput, UpdateEpicInput } from '@/entities/epic';
import { api, runRequest } from '@/shared/api';

/** Teams (for the selector) + all epics + all tickets (for counts), in one call. */
export function loadEpicsOverview() {
  return runRequest(async () => {
    const [teams, epics, tickets] = await Promise.all([
      api.getTeams(),
      api.getEpics(),
      api.getTickets(),
    ]);
    return { teams, epics, tickets };
  });
}

export const createEpic = (input: CreateEpicInput) =>
  runRequest(() => api.createEpic(input));

export const updateEpic = (id: string, input: UpdateEpicInput) =>
  runRequest(() => api.updateEpic(id, input));

export const deleteEpic = (id: string) => runRequest(() => api.deleteEpic(id));
