/**
 * Service layer for the ticket detail screen (PROJECT_RULES §2). Returns
 * `Result`s so the hook holds no try/catch.
 */
import type { CreateCommentInput } from '@/entities/comment';
import type { UpdateTicketInput } from '@/entities/ticket';
import { api, runRequest } from '@/shared/api';

/** Everything the detail screen needs, in one call. */
export function loadTicketDetail(ticketId: string) {
  return runRequest(async () => {
    const [ticket, teams, epics, users, comments] = await Promise.all([
      api.getTicket(ticketId),
      api.getTeams(),
      api.getEpics(),
      api.getUsers(),
      api.getComments(ticketId),
    ]);
    return { ticket, teams, epics, users, comments };
  });
}

export const updateTicket = (id: string, patch: UpdateTicketInput) =>
  runRequest(() => api.updateTicket(id, patch));

export const deleteTicket = (id: string) =>
  runRequest(() => api.deleteTicket(id));

export const addComment = (input: CreateCommentInput) =>
  runRequest(() => api.addComment(input));
