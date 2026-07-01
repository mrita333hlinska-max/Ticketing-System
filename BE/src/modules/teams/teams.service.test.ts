/**
 * Team service unit tests (per-user ownership). The repository is an in-memory
 * fake. Covers trim/required, per-owner case-insensitive uniqueness, the
 * no-op-rename rule, the delete-while-referenced (409) guard, and — for the
 * ownership model — that a user cannot see or touch another user's teams.
 */
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../lib/errors';
import { createTeamService } from './teams.service';
import type { TeamRecord, TeamRepository } from './teams.repo';

const OWNER = 'user-1';
const OTHER = 'user-2';

function createFakeRepo(options: { referenced?: Set<string> } = {}): TeamRepository {
  const referenced = options.referenced ?? new Set<string>();
  const rows: TeamRecord[] = [];
  let sequence = 0;

  return {
    async list(ownerId) {
      return rows.filter((team) => team.createdBy === ownerId);
    },
    async findById(id) {
      return rows.find((team) => team.id === id) ?? null;
    },
    async findByNameInsensitive(ownerId, name, exceptId) {
      const lower = name.toLowerCase();
      return (
        rows.find(
          (team) =>
            team.createdBy === ownerId &&
            team.name.toLowerCase() === lower &&
            team.id !== exceptId,
        ) ?? null
      );
    },
    async insert(name, ownerId) {
      sequence += 1;
      const now = new Date(2026, 0, 1, 0, 0, sequence);
      const team: TeamRecord = {
        id: `team-${sequence}`,
        name,
        createdBy: ownerId,
        createdAt: now,
        updatedAt: now,
      };
      rows.push(team);
      return team;
    },
    async updateName(id, name) {
      const team = rows.find((entry) => entry.id === id);
      if (!team) throw new Error('not found in fake');
      team.name = name;
      team.updatedAt = new Date(team.updatedAt.getTime() + 1000);
      return team;
    },
    async remove(id) {
      const index = rows.findIndex((team) => team.id === id);
      if (index >= 0) rows.splice(index, 1);
    },
    async hasReferences(id) {
      return referenced.has(id);
    },
  };
}

async function expectStatus(
  operation: Promise<unknown>,
  status: number,
): Promise<void> {
  await expect(operation).rejects.toSatisfy(
    (error: unknown) => error instanceof ApiError && error.status === status,
  );
}

describe('team service', () => {
  it('creates a team owned by the user, trimming the name', async () => {
    const service = createTeamService({ repo: createFakeRepo() });
    const team = await service.create('  Payments Team  ', OWNER);
    expect(team.name).toBe('Payments Team');
    expect(typeof team.createdAt).toBe('string'); // ISO-8601 serialization
  });

  it('rejects an empty/whitespace name (400)', async () => {
    const service = createTeamService({ repo: createFakeRepo() });
    await expectStatus(service.create('   ', OWNER), 400);
  });

  it('rejects a duplicate name case-insensitively within one owner (409)', async () => {
    const service = createTeamService({ repo: createFakeRepo() });
    await service.create('Payments', OWNER);
    await expectStatus(service.create('  payments ', OWNER), 409);
  });

  it('allows two different users to reuse the same team name', async () => {
    const service = createTeamService({ repo: createFakeRepo() });
    await service.create('Payments', OWNER);
    const other = await service.create('Payments', OTHER); // no clash
    expect(other.name).toBe('Payments');
  });

  it('lists only the requesting user\'s teams', async () => {
    const service = createTeamService({ repo: createFakeRepo() });
    await service.create('Mine', OWNER);
    await service.create('Theirs', OTHER);
    const mine = await service.list(OWNER);
    expect(mine).toHaveLength(1);
    expect(mine[0].name).toBe('Mine');
  });

  it('rename to the same value does not advance updatedAt', async () => {
    const service = createTeamService({ repo: createFakeRepo() });
    const created = await service.create('Payments', OWNER);
    const renamed = await service.rename(created.id, ' Payments ', OWNER);
    expect(renamed.updatedAt).toBe(created.updatedAt);
  });

  it('rename to a new value advances updatedAt', async () => {
    const service = createTeamService({ repo: createFakeRepo() });
    const created = await service.create('Payments', OWNER);
    const renamed = await service.rename(created.id, 'Billing', OWNER);
    expect(renamed.name).toBe('Billing');
    expect(renamed.updatedAt).not.toBe(created.updatedAt);
  });

  it('blocks deleting a team that has epics or tickets (409)', async () => {
    const referenced = new Set<string>();
    const service = createTeamService({ repo: createFakeRepo({ referenced }) });
    const team = await service.create('Payments', OWNER);
    referenced.add(team.id);
    await expectStatus(service.remove(team.id, OWNER), 409);
  });

  it('hides another user\'s team: get/rename/delete all 404', async () => {
    const service = createTeamService({ repo: createFakeRepo() });
    const theirs = await service.create('Secret', OTHER);
    // OWNER cannot see it in their list...
    expect(await service.list(OWNER)).toHaveLength(0);
    // ...nor rename or delete it.
    await expectStatus(service.rename(theirs.id, 'Hacked', OWNER), 404);
    await expectStatus(service.remove(theirs.id, OWNER), 404);
  });
});
