/**
 * Ticket business logic (REQUIREMENTS §6) — the core module. Mirrors the FE
 * stub's `createTicket`/`updateTicket` semantics exactly:
 *
 * - The team must exist; a referenced epic must exist AND belong to the ticket's
 *   team (enforced here for a friendly message, and by a composite FK in the DB).
 * - `title` is stored trimmed and must be non-empty; `body` must be non-empty
 *   after trim but is stored as sent (Markdown-friendly).
 * - New tickets start at status `new`; `createdBy` comes from the session.
 * - `updatedAt` advances ONLY on a real field/state change — an unchanged save
 *   (including a drag that lands on the same column) returns the ticket as-is.
 *   Drag-and-drop is just a PATCH with `{ status }`; the same change-detection
 *   handles it, so there is no separate "move" path.
 */
import { NotFoundError, ValidationError } from '../../lib/errors';
import type { EpicRepository } from '../epics/epics.repo';
import type { TeamRepository } from '../teams/teams.repo';
import { INITIAL_STATUS, type TicketType, type TicketStatus } from './tickets.schema';
import type { TicketRecord, TicketRepository } from './tickets.repo';

export interface TicketDto {
  id: string;
  teamId: string;
  type: TicketType;
  status: TicketStatus;
  epicId: string | null;
  title: string;
  body: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketInput {
  teamId: string;
  type: TicketType;
  title: string;
  body: string;
  epicId?: string | null;
}

export interface UpdateTicketInput {
  teamId?: string;
  type?: TicketType;
  status?: TicketStatus;
  title?: string;
  body?: string;
  epicId?: string | null;
}

function toTicketDto(ticket: TicketRecord): TicketDto {
  return {
    id: ticket.id,
    teamId: ticket.teamId,
    type: ticket.type,
    status: ticket.status,
    epicId: ticket.epicId,
    title: ticket.title,
    body: ticket.body,
    createdBy: ticket.createdBy,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

export interface TicketService {
  list(teamId?: string): Promise<TicketDto[]>;
  get(id: string): Promise<TicketDto>;
  create(input: CreateTicketInput, createdBy: string): Promise<TicketDto>;
  update(id: string, patch: UpdateTicketInput): Promise<TicketDto>;
  remove(id: string): Promise<void>;
}

export function createTicketService(dependencies: {
  repo: TicketRepository;
  teams: Pick<TeamRepository, 'findById'>;
  epics: Pick<EpicRepository, 'findById'>;
}): TicketService {
  const { repo, teams, epics } = dependencies;

  /** An epic referenced by a ticket must belong to the ticket's team (§5, §6). */
  async function assertEpicInTeam(epicId: string, teamId: string): Promise<void> {
    const epic = await epics.findById(epicId);
    if (!epic) throw new NotFoundError('Epic not found.');
    if (epic.teamId !== teamId) {
      throw new ValidationError("Epic must belong to the ticket's team.");
    }
  }

  return {
    async list(teamId) {
      const rows = await repo.list(teamId);
      return rows.map(toTicketDto);
    },

    async get(id) {
      const ticket = await repo.findById(id);
      if (!ticket) throw new NotFoundError('Ticket not found.');
      return toTicketDto(ticket);
    },

    async create(input, createdBy) {
      const team = await teams.findById(input.teamId);
      if (!team) throw new NotFoundError('Team not found.');

      const title = input.title.trim();
      if (!title) throw new ValidationError('Title is required.');
      if (!input.body.trim()) throw new ValidationError('Body is required.');

      const epicId = input.epicId ?? null;
      if (epicId) await assertEpicInTeam(epicId, input.teamId);

      const ticket = await repo.insert({
        teamId: input.teamId,
        type: input.type,
        status: INITIAL_STATUS,
        epicId,
        title,
        body: input.body,
        createdBy,
      });
      return toTicketDto(ticket);
    },

    async update(id, patch) {
      const ticket = await repo.findById(id);
      if (!ticket) throw new NotFoundError('Ticket not found.');

      const nextTeamId = patch.teamId ?? ticket.teamId;
      if (patch.teamId !== undefined) {
        const team = await teams.findById(patch.teamId);
        if (!team) throw new NotFoundError('Team not found.');
      }

      // Resolve the resulting epic and enforce same-team against the NEXT team.
      const nextEpicId =
        patch.epicId !== undefined ? patch.epicId : ticket.epicId;
      if (nextEpicId) await assertEpicInTeam(nextEpicId, nextTeamId);

      const nextType = patch.type ?? ticket.type;
      const nextStatus = patch.status ?? ticket.status;

      let nextTitle = ticket.title;
      if (patch.title !== undefined) {
        const trimmed = patch.title.trim();
        if (!trimmed) throw new ValidationError('Title is required.');
        nextTitle = trimmed;
      }

      let nextBody = ticket.body;
      if (patch.body !== undefined) {
        if (!patch.body.trim()) throw new ValidationError('Body is required.');
        nextBody = patch.body;
      }

      const changed =
        nextTeamId !== ticket.teamId ||
        nextEpicId !== ticket.epicId ||
        nextType !== ticket.type ||
        nextStatus !== ticket.status ||
        nextTitle !== ticket.title ||
        nextBody !== ticket.body;

      // Saving unchanged values must not advance updatedAt (§6).
      if (!changed) return toTicketDto(ticket);

      const updated = await repo.update(id, {
        teamId: nextTeamId,
        type: nextType,
        status: nextStatus,
        epicId: nextEpicId,
        title: nextTitle,
        body: nextBody,
      });
      return toTicketDto(updated);
    },

    async remove(id) {
      const ticket = await repo.findById(id);
      if (!ticket) throw new NotFoundError('Ticket not found.');
      await repo.remove(id); // comments cascade via the DB FK (§6)
    },
  };
}
