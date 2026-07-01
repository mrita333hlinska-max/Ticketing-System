/**
 * Epic service unit tests (per-user ownership). In-memory fakes for the epic
 * repo and the team lookup. Covers team ownership on create, title
 * trim/required, description normalization, updatedAt-only-on-change, the
 * delete-while-referenced 409, and cross-user isolation.
 */
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../lib/errors';
import type { TeamRepository } from '../teams/teams.repo';
import { createEpicService } from './epics.service';
import type { EpicRecord, EpicRepository } from './epics.repo';

const OWNER = 'user-1';
const OTHER = 'user-2';

function createFakeEpicRepo(
  options: { referenced?: Set<string> } = {},
): EpicRepository {
  const referenced = options.referenced ?? new Set<string>();
  const rows: EpicRecord[] = [];
  let sequence = 0;

  return {
    async list(ownerId, teamId) {
      return rows.filter(
        (epic) =>
          epic.createdBy === ownerId && (!teamId || epic.teamId === teamId),
      );
    },
    async findById(id) {
      return rows.find((epic) => epic.id === id) ?? null;
    },
    async insert(input) {
      sequence += 1;
      const now = new Date(2026, 0, 1, 0, 0, sequence);
      const epic: EpicRecord = {
        id: `epic-${sequence}`,
        teamId: input.teamId,
        title: input.title,
        description: input.description,
        createdBy: input.createdBy,
        createdAt: now,
        updatedAt: now,
      };
      rows.push(epic);
      return epic;
    },
    async update(id, values) {
      const epic = rows.find((entry) => entry.id === id);
      if (!epic) throw new Error('not found in fake');
      epic.title = values.title;
      epic.description = values.description;
      epic.updatedAt = new Date(epic.updatedAt.getTime() + 1000);
      return epic;
    },
    async remove(id) {
      const index = rows.findIndex((epic) => epic.id === id);
      if (index >= 0) rows.splice(index, 1);
    },
    async isReferencedByTickets(id) {
      return referenced.has(id);
    },
  };
}

// Maps teamId → owner id, so the fake can report each team's owner.
function createFakeTeams(
  owners: Record<string, string>,
): Pick<TeamRepository, 'findById'> {
  return {
    async findById(id) {
      const createdBy = owners[id];
      if (!createdBy) return null;
      const now = new Date(2026, 0, 1);
      return { id, name: `Team ${id}`, createdBy, createdAt: now, updatedAt: now };
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

describe('epic service', () => {
  it('creates an epic under the user\'s own team, trimming/normalizing', async () => {
    const service = createEpicService({
      repo: createFakeEpicRepo(),
      teams: createFakeTeams({ 'team-1': OWNER }),
    });
    const epic = await service.create(
      { teamId: 'team-1', title: '  Checkout  ', description: '   ' },
      OWNER,
    );
    expect(epic.title).toBe('Checkout');
    expect(epic.description).toBeNull();
    expect(epic.teamId).toBe('team-1');
  });

  it('rejects create for a missing team (404)', async () => {
    const service = createEpicService({
      repo: createFakeEpicRepo(),
      teams: createFakeTeams({}),
    });
    await expectStatus(
      service.create({ teamId: 'ghost', title: 'X', description: null }, OWNER),
      404,
    );
  });

  it('rejects create in a team owned by another user (404)', async () => {
    const service = createEpicService({
      repo: createFakeEpicRepo(),
      teams: createFakeTeams({ 'team-1': OTHER }),
    });
    await expectStatus(
      service.create({ teamId: 'team-1', title: 'X', description: null }, OWNER),
      404,
    );
  });

  it('rejects an empty title on create and update (400)', async () => {
    const service = createEpicService({
      repo: createFakeEpicRepo(),
      teams: createFakeTeams({ 'team-1': OWNER }),
    });
    await expectStatus(
      service.create({ teamId: 'team-1', title: '   ', description: null }, OWNER),
      400,
    );
    const epic = await service.create(
      { teamId: 'team-1', title: 'Real', description: null },
      OWNER,
    );
    await expectStatus(service.update(epic.id, { title: '  ' }, OWNER), 400);
  });

  it('does not advance updatedAt when nothing changes', async () => {
    const service = createEpicService({
      repo: createFakeEpicRepo(),
      teams: createFakeTeams({ 'team-1': OWNER }),
    });
    const epic = await service.create(
      { teamId: 'team-1', title: 'Checkout', description: 'Flow' },
      OWNER,
    );
    const same = await service.update(
      epic.id,
      { title: 'Checkout', description: 'Flow' },
      OWNER,
    );
    expect(same.updatedAt).toBe(epic.updatedAt);
  });

  it('advances updatedAt when the description is cleared', async () => {
    const service = createEpicService({
      repo: createFakeEpicRepo(),
      teams: createFakeTeams({ 'team-1': OWNER }),
    });
    const epic = await service.create(
      { teamId: 'team-1', title: 'Checkout', description: 'Flow' },
      OWNER,
    );
    const updated = await service.update(epic.id, { description: null }, OWNER);
    expect(updated.description).toBeNull();
    expect(updated.updatedAt).not.toBe(epic.updatedAt);
  });

  it('lists only the user\'s epics, filtered by team', async () => {
    const service = createEpicService({
      repo: createFakeEpicRepo(),
      // team-3 belongs to OTHER; team-1/2 to OWNER.
      teams: createFakeTeams({ 'team-1': OWNER, 'team-2': OWNER, 'team-3': OTHER }),
    });
    await service.create({ teamId: 'team-1', title: 'A', description: null }, OWNER);
    await service.create({ teamId: 'team-2', title: 'B', description: null }, OWNER);
    await service.create({ teamId: 'team-3', title: 'C', description: null }, OTHER);
    expect(await service.list(OWNER, 'team-1')).toHaveLength(1);
    expect(await service.list(OWNER)).toHaveLength(2); // not OTHER's epic
    expect(await service.list(OTHER)).toHaveLength(1);
  });

  it('blocks deleting an epic referenced by tickets (409)', async () => {
    const referenced = new Set<string>();
    const service = createEpicService({
      repo: createFakeEpicRepo({ referenced }),
      teams: createFakeTeams({ 'team-1': OWNER }),
    });
    const epic = await service.create(
      { teamId: 'team-1', title: 'Checkout', description: null },
      OWNER,
    );
    referenced.add(epic.id);
    await expectStatus(service.remove(epic.id, OWNER), 409);
  });

  it('hides another user\'s epic: update/delete 404', async () => {
    const service = createEpicService({
      repo: createFakeEpicRepo(),
      teams: createFakeTeams({ 'team-1': OTHER }),
    });
    const theirs = await service.create(
      { teamId: 'team-1', title: 'Secret', description: null },
      OTHER,
    );
    await expectStatus(service.update(theirs.id, { title: 'X' }, OWNER), 404);
    await expectStatus(service.remove(theirs.id, OWNER), 404);
    expect(await service.list(OWNER)).toHaveLength(0);
  });
});
