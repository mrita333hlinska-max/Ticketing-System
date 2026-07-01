/**
 * Ticket service unit tests (per-user ownership). In-memory fakes for the
 * ticket repo and the team/epic lookups. Covers team/epic ownership, the
 * same-team epic rule, title/body validation, updatedAt-only-on-change
 * (incl. drag-and-drop moves), delete/not-found, and cross-user isolation.
 */
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../lib/errors';
import type { EpicRepository, EpicRecord } from '../epics/epics.repo';
import type { TeamRepository } from '../teams/teams.repo';
import { createTicketService } from './tickets.service';
import type { TicketRecord, TicketRepository } from './tickets.repo';

const OWNER = 'user-1';
const OTHER = 'user-2';

function createFakeTicketRepo(): TicketRepository {
  const rows: TicketRecord[] = [];
  let sequence = 0;

  return {
    async list(ownerId, teamId) {
      return rows.filter(
        (ticket) =>
          ticket.createdBy === ownerId && (!teamId || ticket.teamId === teamId),
      );
    },
    async findById(id) {
      return rows.find((ticket) => ticket.id === id) ?? null;
    },
    async insert(input) {
      sequence += 1;
      const now = new Date(2026, 0, 1, 0, 0, sequence);
      const ticket: TicketRecord = {
        id: `ticket-${sequence}`,
        teamId: input.teamId,
        type: input.type,
        status: input.status,
        epicId: input.epicId,
        title: input.title,
        body: input.body,
        createdBy: input.createdBy,
        createdAt: now,
        updatedAt: now,
      };
      rows.push(ticket);
      return ticket;
    },
    async update(id, values) {
      const ticket = rows.find((entry) => entry.id === id);
      if (!ticket) throw new Error('not found in fake');
      Object.assign(ticket, values);
      ticket.updatedAt = new Date(ticket.updatedAt.getTime() + 1000);
      return ticket;
    },
    async remove(id) {
      const index = rows.findIndex((ticket) => ticket.id === id);
      if (index >= 0) rows.splice(index, 1);
    },
  };
}

// teamId → owner id
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

// epicId → { teamId, createdBy }
function createFakeEpics(
  epicsById: Record<string, { teamId: string; createdBy: string }>,
): Pick<EpicRepository, 'findById'> {
  return {
    async findById(id) {
      const entry = epicsById[id];
      if (!entry) return null;
      const now = new Date(2026, 0, 1);
      const epic: EpicRecord = {
        id,
        teamId: entry.teamId,
        title: `Epic ${id}`,
        description: null,
        createdBy: entry.createdBy,
        createdAt: now,
        updatedAt: now,
      };
      return epic;
    },
  };
}

function createSubject(options: {
  teams?: Record<string, string>;
  epics?: Record<string, { teamId: string; createdBy: string }>;
} = {}) {
  return createTicketService({
    repo: createFakeTicketRepo(),
    teams: createFakeTeams(options.teams ?? { 'team-1': OWNER, 'team-2': OWNER }),
    epics: createFakeEpics(options.epics ?? {}),
  });
}

async function expectStatus(
  operation: Promise<unknown>,
  status: number,
): Promise<void> {
  await expect(operation).rejects.toSatisfy(
    (error: unknown) => error instanceof ApiError && error.status === status,
  );
}

describe('ticket service', () => {
  it('creates a ticket: status new, createdBy set, title trimmed, body kept', async () => {
    const service = createSubject();
    const ticket = await service.create(
      {
        teamId: 'team-1',
        type: 'bug',
        title: '  Broken login  ',
        body: '  Steps  ',
        epicId: null,
      },
      OWNER,
    );
    expect(ticket.status).toBe('new');
    expect(ticket.createdBy).toBe(OWNER);
    expect(ticket.title).toBe('Broken login');
    expect(ticket.body).toBe('  Steps  ');
  });

  it('rejects create for a missing/other-user team (404) and empty title/body (400)', async () => {
    const service = createSubject();
    await expectStatus(
      service.create({ teamId: 'ghost', type: 'bug', title: 'X', body: 'Y' }, OWNER),
      404,
    );
    // team-1 is owned by OWNER; OTHER cannot create there.
    await expectStatus(
      service.create({ teamId: 'team-1', type: 'bug', title: 'X', body: 'Y' }, OTHER),
      404,
    );
    await expectStatus(
      service.create({ teamId: 'team-1', type: 'bug', title: '  ', body: 'Y' }, OWNER),
      400,
    );
    await expectStatus(
      service.create({ teamId: 'team-1', type: 'bug', title: 'X', body: '  ' }, OWNER),
      400,
    );
  });

  it('rejects an epic that belongs to another team (400)', async () => {
    const service = createSubject({
      epics: { 'epic-A': { teamId: 'team-2', createdBy: OWNER } },
    });
    await expectStatus(
      service.create(
        { teamId: 'team-1', type: 'feature', title: 'X', body: 'Y', epicId: 'epic-A' },
        OWNER,
      ),
      400,
    );
  });

  it('rejects an epic owned by another user (404)', async () => {
    const service = createSubject({
      epics: { 'epic-A': { teamId: 'team-1', createdBy: OTHER } },
    });
    await expectStatus(
      service.create(
        { teamId: 'team-1', type: 'feature', title: 'X', body: 'Y', epicId: 'epic-A' },
        OWNER,
      ),
      404,
    );
  });

  it('accepts an epic from the same team owned by the user', async () => {
    const service = createSubject({
      epics: { 'epic-A': { teamId: 'team-1', createdBy: OWNER } },
    });
    const ticket = await service.create(
      { teamId: 'team-1', type: 'feature', title: 'X', body: 'Y', epicId: 'epic-A' },
      OWNER,
    );
    expect(ticket.epicId).toBe('epic-A');
  });

  it('drag to the same status does not advance updatedAt; a new status does', async () => {
    const service = createSubject();
    const ticket = await service.create(
      { teamId: 'team-1', type: 'bug', title: 'X', body: 'Y' },
      OWNER,
    );
    const same = await service.update(ticket.id, { status: 'new' }, OWNER);
    expect(same.updatedAt).toBe(ticket.updatedAt);
    const moved = await service.update(ticket.id, { status: 'in_progress' }, OWNER);
    expect(moved.status).toBe('in_progress');
    expect(moved.updatedAt).not.toBe(ticket.updatedAt);
  });

  it('clears the epic when epicId is set to null', async () => {
    const service = createSubject({
      epics: { 'epic-A': { teamId: 'team-1', createdBy: OWNER } },
    });
    const ticket = await service.create(
      { teamId: 'team-1', type: 'bug', title: 'X', body: 'Y', epicId: 'epic-A' },
      OWNER,
    );
    const updated = await service.update(ticket.id, { epicId: null }, OWNER);
    expect(updated.epicId).toBeNull();
  });

  it('re-checks same-team when the ticket moves to another team (400)', async () => {
    const service = createSubject({
      epics: { 'epic-A': { teamId: 'team-1', createdBy: OWNER } },
    });
    const ticket = await service.create(
      { teamId: 'team-1', type: 'bug', title: 'X', body: 'Y', epicId: 'epic-A' },
      OWNER,
    );
    await expectStatus(service.update(ticket.id, { teamId: 'team-2' }, OWNER), 400);
  });

  it('hides another user\'s ticket: get/update/remove 404, list excludes', async () => {
    const service = createSubject();
    const theirs = await service.create(
      { teamId: 'team-1', type: 'bug', title: 'Secret', body: 'Y' },
      OWNER,
    );
    await expectStatus(service.get(theirs.id, OTHER), 404);
    await expectStatus(service.update(theirs.id, { status: 'done' }, OTHER), 404);
    await expectStatus(service.remove(theirs.id, OTHER), 404);
    expect(await service.list(OTHER)).toHaveLength(0);
  });

  it('get and remove report 404 for a missing ticket', async () => {
    const service = createSubject();
    await expectStatus(service.get('nope', OWNER), 404);
    await expectStatus(service.remove('nope', OWNER), 404);
  });
});
