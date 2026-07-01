/**
 * Epic service unit tests (Phase 5). Business rules only — in-memory fakes for
 * the epic repo and the team lookup. Covers team-existence on create, title
 * trim/required, description normalization, the updatedAt-only-on-change rule
 * (including clearing the description), and the delete-while-referenced 409.
 */
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../lib/errors';
import type { TeamRepository } from '../teams/teams.repo';
import { createEpicService } from './epics.service';
import type { EpicRecord, EpicRepository } from './epics.repo';

function createFakeEpicRepo(
  options: { referenced?: Set<string> } = {},
): EpicRepository {
  const referenced = options.referenced ?? new Set<string>();
  const rows: EpicRecord[] = [];
  let sequence = 0;

  return {
    async list(teamId) {
      return rows.filter((epic) => !teamId || epic.teamId === teamId);
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

// Only findById is used by the epic service (interface segregation).
function createFakeTeams(existingIds: string[]): Pick<TeamRepository, 'findById'> {
  return {
    async findById(id) {
      if (!existingIds.includes(id)) return null;
      const now = new Date(2026, 0, 1);
      return { id, name: `Team ${id}`, createdAt: now, updatedAt: now };
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
  it('creates an epic under an existing team, trimming/normalizing fields', async () => {
    const service = createEpicService({
      repo: createFakeEpicRepo(),
      teams: createFakeTeams(['team-1']),
    });
    const epic = await service.create({
      teamId: 'team-1',
      title: '  Checkout  ',
      description: '   ',
    });
    expect(epic.title).toBe('Checkout');
    expect(epic.description).toBeNull(); // whitespace → null
    expect(epic.teamId).toBe('team-1');
  });

  it('rejects create for a missing team (404)', async () => {
    const service = createEpicService({
      repo: createFakeEpicRepo(),
      teams: createFakeTeams([]),
    });
    await expectStatus(
      service.create({ teamId: 'ghost', title: 'X', description: null }),
      404,
    );
  });

  it('rejects an empty title on create and update (400)', async () => {
    const service = createEpicService({
      repo: createFakeEpicRepo(),
      teams: createFakeTeams(['team-1']),
    });
    await expectStatus(
      service.create({ teamId: 'team-1', title: '   ', description: null }),
      400,
    );
    const epic = await service.create({
      teamId: 'team-1',
      title: 'Real',
      description: null,
    });
    await expectStatus(service.update(epic.id, { title: '  ' }), 400);
  });

  it('does not advance updatedAt when nothing changes', async () => {
    const service = createEpicService({
      repo: createFakeEpicRepo(),
      teams: createFakeTeams(['team-1']),
    });
    const epic = await service.create({
      teamId: 'team-1',
      title: 'Checkout',
      description: 'Flow',
    });
    const same = await service.update(epic.id, {
      title: 'Checkout',
      description: 'Flow',
    });
    expect(same.updatedAt).toBe(epic.updatedAt);
  });

  it('advances updatedAt when the description is cleared', async () => {
    const service = createEpicService({
      repo: createFakeEpicRepo(),
      teams: createFakeTeams(['team-1']),
    });
    const epic = await service.create({
      teamId: 'team-1',
      title: 'Checkout',
      description: 'Flow',
    });
    const updated = await service.update(epic.id, { description: null });
    expect(updated.description).toBeNull();
    expect(updated.updatedAt).not.toBe(epic.updatedAt);
  });

  it('filters list by team', async () => {
    const service = createEpicService({
      repo: createFakeEpicRepo(),
      teams: createFakeTeams(['team-1', 'team-2']),
    });
    await service.create({ teamId: 'team-1', title: 'A', description: null });
    await service.create({ teamId: 'team-2', title: 'B', description: null });
    expect(await service.list('team-1')).toHaveLength(1);
    expect(await service.list()).toHaveLength(2);
  });

  it('blocks deleting an epic referenced by tickets (409)', async () => {
    const referenced = new Set<string>();
    const service = createEpicService({
      repo: createFakeEpicRepo({ referenced }),
      teams: createFakeTeams(['team-1']),
    });
    const epic = await service.create({
      teamId: 'team-1',
      title: 'Checkout',
      description: null,
    });
    referenced.add(epic.id);
    await expectStatus(service.remove(epic.id), 409);
  });
});
