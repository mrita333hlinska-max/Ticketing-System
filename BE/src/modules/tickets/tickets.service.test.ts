/**
 * Ticket service unit tests (Phase 6). Business rules only — in-memory fakes
 * for the ticket repo and the team/epic lookups. Covers team/epic existence,
 * the same-team epic rule, title/body validation, the updatedAt-only-on-change
 * rule (incl. drag-and-drop status moves), and delete/not-found.
 */
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../lib/errors';
import type { EpicRepository, EpicRecord } from '../epics/epics.repo';
import type { TeamRepository } from '../teams/teams.repo';
import { createTicketService } from './tickets.service';
import type { TicketRecord, TicketRepository } from './tickets.repo';

function createFakeTicketRepo(): TicketRepository {
  const rows: TicketRecord[] = [];
  let sequence = 0;

  return {
    async list(teamId) {
      return rows.filter((ticket) => !teamId || ticket.teamId === teamId);
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

function createFakeTeams(ids: string[]): Pick<TeamRepository, 'findById'> {
  return {
    async findById(id) {
      if (!ids.includes(id)) return null;
      const now = new Date(2026, 0, 1);
      return { id, name: `Team ${id}`, createdAt: now, updatedAt: now };
    },
  };
}

// epicId -> teamId map for the fake epic lookup.
function createFakeEpics(
  epicsByTeam: Record<string, string>,
): Pick<EpicRepository, 'findById'> {
  return {
    async findById(id) {
      const teamId = epicsByTeam[id];
      if (!teamId) return null;
      const now = new Date(2026, 0, 1);
      const epic: EpicRecord = {
        id,
        teamId,
        title: `Epic ${id}`,
        description: null,
        createdAt: now,
        updatedAt: now,
      };
      return epic;
    },
  };
}

function createSubject(options: {
  teams?: string[];
  epics?: Record<string, string>;
} = {}) {
  return createTicketService({
    repo: createFakeTicketRepo(),
    teams: createFakeTeams(options.teams ?? ['team-1', 'team-2']),
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
        body: '  Steps to reproduce  ',
        epicId: null,
      },
      'user-1',
    );
    expect(ticket.status).toBe('new');
    expect(ticket.createdBy).toBe('user-1');
    expect(ticket.title).toBe('Broken login'); // trimmed
    expect(ticket.body).toBe('  Steps to reproduce  '); // stored as sent
  });

  it('rejects create for a missing team (404) and empty title/body (400)', async () => {
    const service = createSubject();
    await expectStatus(
      service.create(
        { teamId: 'ghost', type: 'bug', title: 'X', body: 'Y' },
        'u',
      ),
      404,
    );
    await expectStatus(
      service.create(
        { teamId: 'team-1', type: 'bug', title: '   ', body: 'Y' },
        'u',
      ),
      400,
    );
    await expectStatus(
      service.create(
        { teamId: 'team-1', type: 'bug', title: 'X', body: '   ' },
        'u',
      ),
      400,
    );
  });

  it('rejects an epic that belongs to another team (400)', async () => {
    const service = createSubject({ epics: { 'epic-A': 'team-2' } });
    await expectStatus(
      service.create(
        {
          teamId: 'team-1',
          type: 'feature',
          title: 'X',
          body: 'Y',
          epicId: 'epic-A',
        },
        'u',
      ),
      400,
    );
  });

  it('accepts an epic from the same team', async () => {
    const service = createSubject({ epics: { 'epic-A': 'team-1' } });
    const ticket = await service.create(
      {
        teamId: 'team-1',
        type: 'feature',
        title: 'X',
        body: 'Y',
        epicId: 'epic-A',
      },
      'u',
    );
    expect(ticket.epicId).toBe('epic-A');
  });

  it('drag-and-drop to the same status does not advance updatedAt', async () => {
    const service = createSubject();
    const ticket = await service.create(
      { teamId: 'team-1', type: 'bug', title: 'X', body: 'Y' },
      'u',
    );
    const same = await service.update(ticket.id, { status: 'new' });
    expect(same.updatedAt).toBe(ticket.updatedAt);
  });

  it('drag-and-drop to a new status advances updatedAt', async () => {
    const service = createSubject();
    const ticket = await service.create(
      { teamId: 'team-1', type: 'bug', title: 'X', body: 'Y' },
      'u',
    );
    const moved = await service.update(ticket.id, { status: 'in_progress' });
    expect(moved.status).toBe('in_progress');
    expect(moved.updatedAt).not.toBe(ticket.updatedAt);
  });

  it('clears the epic when epicId is set to null', async () => {
    const service = createSubject({ epics: { 'epic-A': 'team-1' } });
    const ticket = await service.create(
      {
        teamId: 'team-1',
        type: 'bug',
        title: 'X',
        body: 'Y',
        epicId: 'epic-A',
      },
      'u',
    );
    const updated = await service.update(ticket.id, { epicId: null });
    expect(updated.epicId).toBeNull();
  });

  it('re-checks same-team when the ticket moves to another team', async () => {
    // Epic belongs to team-1; moving the ticket to team-2 while keeping the
    // epic must be rejected.
    const service = createSubject({ epics: { 'epic-A': 'team-1' } });
    const ticket = await service.create(
      {
        teamId: 'team-1',
        type: 'bug',
        title: 'X',
        body: 'Y',
        epicId: 'epic-A',
      },
      'u',
    );
    await expectStatus(service.update(ticket.id, { teamId: 'team-2' }), 400);
  });

  it('get and remove report 404 for a missing ticket', async () => {
    const service = createSubject();
    await expectStatus(service.get('nope'), 404);
    await expectStatus(service.remove('nope'), 404);
  });
});
