import { useCallback, useState } from 'react';
import type {
  Ticket,
  TicketStatus,
  TicketType,
  UpdateTicketInput,
} from '@/entities/ticket';

/**
 * Editable form state for a ticket, seeded from the loaded ticket. Encodes the
 * §6 rule that changing the team clears the selected epic (epics are
 * team-scoped). `buildPatch` produces the update payload for saving.
 */
export function useTicketForm(ticket: Ticket) {
  const [teamId, setTeamId] = useState(ticket.teamId);
  const [type, setType] = useState<TicketType>(ticket.type);
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [epicId, setEpicId] = useState<string | null>(ticket.epicId);
  const [title, setTitle] = useState(ticket.title);
  const [body, setBody] = useState(ticket.body);

  // Changing team must clear the epic (§6) — an epic belongs to one team.
  const changeTeam = useCallback((nextTeamId: string) => {
    setTeamId(nextTeamId);
    setEpicId(null);
  }, []);

  const buildPatch = useCallback(
    (): UpdateTicketInput => ({ teamId, type, status, epicId, title, body }),
    [teamId, type, status, epicId, title, body],
  );

  return {
    teamId,
    type,
    status,
    epicId,
    title,
    body,
    changeTeam,
    setType,
    setStatus,
    setEpicId,
    setTitle,
    setBody,
    buildPatch,
    isValid: title.trim() !== '' && body.trim() !== '',
  };
}

export type TicketFormState = ReturnType<typeof useTicketForm>;
