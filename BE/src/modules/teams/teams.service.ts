/**
 * Team business logic (REQUIREMENTS §4). Mirrors the FE stub: names are
 * non-empty after trim and unique case-insensitively (409 on clash); a rename
 * to the same value is a no-op that does NOT advance `updatedAt`; a team cannot
 * be deleted while epics or tickets reference it (409, no cascade).
 *
 * Timestamps are serialized as ISO-8601 UTC strings here, so the response
 * exactly matches the FE's `Team` DTO regardless of the DB driver's date type.
 */
import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors';
import type { TeamRecord, TeamRepository } from './teams.repo';

export interface TeamDto {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

function toTeamDto(team: TeamRecord): TeamDto {
  return {
    id: team.id,
    name: team.name,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  };
}

export interface TeamService {
  list(userId: string): Promise<TeamDto[]>;
  create(name: string, userId: string): Promise<TeamDto>;
  rename(id: string, name: string, userId: string): Promise<TeamDto>;
  remove(id: string, userId: string): Promise<void>;
}

export function createTeamService(dependencies: {
  repo: TeamRepository;
}): TeamService {
  const { repo } = dependencies;

  /** Fetch a team the user owns, or 404 (hides existence of others' data). */
  async function ownedTeamOrThrow(id: string, userId: string) {
    const team = await repo.findById(id);
    if (!team || team.createdBy !== userId) {
      throw new NotFoundError('Team not found.');
    }
    return team;
  }

  return {
    async list(userId) {
      const rows = await repo.list(userId);
      return rows.map(toTeamDto);
    },

    async create(rawName, userId) {
      const name = rawName.trim();
      if (!name) throw new ValidationError('Team name is required.');
      if (await repo.findByNameInsensitive(userId, name)) {
        throw new ConflictError('A team with that name already exists.');
      }
      return toTeamDto(await repo.insert(name, userId));
    },

    async rename(id, rawName, userId) {
      const team = await ownedTeamOrThrow(id, userId);

      const name = rawName.trim();
      if (!name) throw new ValidationError('Team name is required.');
      if (await repo.findByNameInsensitive(userId, name, id)) {
        throw new ConflictError('A team with that name already exists.');
      }

      // No real change → return unchanged; don't advance updatedAt (§4).
      if (name === team.name) return toTeamDto(team);
      return toTeamDto(await repo.updateName(id, name));
    },

    async remove(id, userId) {
      await ownedTeamOrThrow(id, userId);
      if (await repo.hasReferences(id)) {
        throw new ConflictError(
          'Cannot delete a team that still has tickets or epics.',
        );
      }
      await repo.remove(id);
    },
  };
}
