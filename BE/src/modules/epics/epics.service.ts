/**
 * Epic business logic (REQUIREMENTS §5). Mirrors the FE stub: an epic belongs
 * to one team (validated to exist on create, immutable after); the title is
 * non-empty after trim; the description trims to `null` when blank; `updatedAt`
 * advances only on a real change; and an epic cannot be deleted while any
 * ticket references it (409).
 *
 * Team existence is checked through a narrow `findById` lookup (interface
 * segregation), reusing the team repository without depending on its full API.
 */
import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors';
import type { TeamRepository } from '../teams/teams.repo';
import type { EpicRecord, EpicRepository } from './epics.repo';

export interface EpicDto {
  id: string;
  teamId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEpicInput {
  teamId: string;
  title: string;
  description?: string | null;
}

export interface UpdateEpicInput {
  title?: string;
  description?: string | null;
}

function toEpicDto(epic: EpicRecord): EpicDto {
  return {
    id: epic.id,
    teamId: epic.teamId,
    title: epic.title,
    description: epic.description,
    createdAt: epic.createdAt.toISOString(),
    updatedAt: epic.updatedAt.toISOString(),
  };
}

/** Trim; an empty/whitespace description becomes null (§5). */
function normalizeDescription(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export interface EpicService {
  list(userId: string, teamId?: string): Promise<EpicDto[]>;
  create(input: CreateEpicInput, userId: string): Promise<EpicDto>;
  update(id: string, input: UpdateEpicInput, userId: string): Promise<EpicDto>;
  remove(id: string, userId: string): Promise<void>;
}

export function createEpicService(dependencies: {
  repo: EpicRepository;
  teams: Pick<TeamRepository, 'findById'>;
}): EpicService {
  const { repo, teams } = dependencies;

  /** Fetch an epic the user owns, or 404. */
  async function ownedEpicOrThrow(id: string, userId: string) {
    const epic = await repo.findById(id);
    if (!epic || epic.createdBy !== userId) {
      throw new NotFoundError('Epic not found.');
    }
    return epic;
  }

  return {
    async list(userId, teamId) {
      const rows = await repo.list(userId, teamId);
      return rows.map(toEpicDto);
    },

    async create(input, userId) {
      // The team must exist AND belong to this user.
      const team = await teams.findById(input.teamId);
      if (!team || team.createdBy !== userId) {
        throw new NotFoundError('Team not found.');
      }

      const title = input.title.trim();
      if (!title) throw new ValidationError('Epic title is required.');

      const epic = await repo.insert({
        teamId: input.teamId,
        title,
        description: normalizeDescription(input.description),
        createdBy: userId,
      });
      return toEpicDto(epic);
    },

    async update(id, input, userId) {
      const epic = await ownedEpicOrThrow(id, userId);

      let nextTitle = epic.title;
      if (input.title !== undefined) {
        const trimmed = input.title.trim();
        if (!trimmed) throw new ValidationError('Epic title is required.');
        nextTitle = trimmed;
      }

      let nextDescription = epic.description;
      if (input.description !== undefined) {
        nextDescription = normalizeDescription(input.description);
      }

      const changed =
        nextTitle !== epic.title || nextDescription !== epic.description;
      if (!changed) return toEpicDto(epic);

      const updated = await repo.update(id, {
        title: nextTitle,
        description: nextDescription,
      });
      return toEpicDto(updated);
    },

    async remove(id, userId) {
      await ownedEpicOrThrow(id, userId);
      if (await repo.isReferencedByTickets(id)) {
        throw new ConflictError(
          'Cannot delete an epic that is still referenced by tickets.',
        );
      }
      await repo.remove(id);
    },
  };
}
