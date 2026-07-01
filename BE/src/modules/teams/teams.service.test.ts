/**
 * Team service unit tests (Phase 4). Business rules only — the repository is an
 * in-memory fake. Covers trim/required, case-insensitive uniqueness, the
 * no-op-rename-doesn't-bump-updatedAt rule, and the delete-while-referenced
 * (409) guard.
 */
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../lib/errors';
import { createTeamService } from './teams.service';
import type { TeamRecord, TeamRepository } from './teams.repo';

function createFakeRepo(options: { referenced?: Set<string> } = {}): TeamRepository {
  const referenced = options.referenced ?? new Set<string>();
  const rows: TeamRecord[] = [];
  let sequence = 0;

  return {
    async list() {
      return [...rows];
    },
    async findById(id) {
      return rows.find((team) => team.id === id) ?? null;
    },
    async findByNameInsensitive(name, exceptId) {
      const lower = name.toLowerCase();
      return (
        rows.find(
          (team) =>
            team.name.toLowerCase() === lower && team.id !== exceptId,
        ) ?? null
      );
    },
    async insert(name) {
      sequence += 1;
      const now = new Date(2026, 0, 1, 0, 0, sequence);
      const team: TeamRecord = {
        id: `team-${sequence}`,
        name,
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
  it('creates a team, trimming the name', async () => {
    const service = createTeamService({ repo: createFakeRepo() });
    const team = await service.create('  Payments Team  ');
    expect(team.name).toBe('Payments Team');
    expect(typeof team.createdAt).toBe('string'); // ISO-8601 serialization
  });

  it('rejects an empty/whitespace name (400)', async () => {
    const service = createTeamService({ repo: createFakeRepo() });
    await expectStatus(service.create('   '), 400);
  });

  it('rejects a duplicate name case-insensitively (409)', async () => {
    const service = createTeamService({ repo: createFakeRepo() });
    await service.create('Payments');
    await expectStatus(service.create('  payments '), 409);
  });

  it('rename to the same value does not advance updatedAt', async () => {
    const service = createTeamService({ repo: createFakeRepo() });
    const created = await service.create('Payments');
    const renamed = await service.rename(created.id, ' Payments ');
    expect(renamed.updatedAt).toBe(created.updatedAt); // no bump
  });

  it('rename to a new value advances updatedAt', async () => {
    const service = createTeamService({ repo: createFakeRepo() });
    const created = await service.create('Payments');
    const renamed = await service.rename(created.id, 'Billing');
    expect(renamed.name).toBe('Billing');
    expect(renamed.updatedAt).not.toBe(created.updatedAt);
  });

  it('rename to another existing name is a 409', async () => {
    const service = createTeamService({ repo: createFakeRepo() });
    await service.create('Payments');
    const billing = await service.create('Billing');
    await expectStatus(service.rename(billing.id, 'payments'), 409);
  });

  it('rename of a missing team is a 404', async () => {
    const service = createTeamService({ repo: createFakeRepo() });
    await expectStatus(service.rename('nope', 'Whatever'), 404);
  });

  it('blocks deleting a team that has epics or tickets (409)', async () => {
    const referenced = new Set<string>();
    const repo = createFakeRepo({ referenced });
    const service = createTeamService({ repo });
    const team = await service.create('Payments');
    referenced.add(team.id);
    await expectStatus(service.remove(team.id), 409);
  });

  it('deletes a team with no references', async () => {
    const service = createTeamService({ repo: createFakeRepo() });
    const team = await service.create('Payments');
    await service.remove(team.id);
    expect(await service.list()).toHaveLength(0);
  });
});
