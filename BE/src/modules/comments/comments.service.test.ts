/**
 * Comment service unit tests (Phase 7). Business rules only — in-memory fakes
 * for the comment repo and ticket lookup. Covers ticket-existence (404),
 * non-empty body (400), and oldest-first listing. (The "adding a comment does
 * not bump the ticket" rule is structural: the service is given only a ticket
 * `findById`, so it cannot mutate a ticket.)
 */
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../lib/errors';
import type { TicketRepository } from '../tickets/tickets.repo';
import { createCommentService } from './comments.service';
import type { CommentRecord, CommentRepository } from './comments.repo';

function createFakeCommentRepo(): CommentRepository {
  const rows: CommentRecord[] = [];
  let sequence = 0;
  return {
    async listByTicket(ticketId) {
      return rows
        .filter((comment) => comment.ticketId === ticketId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },
    async insert(input) {
      sequence += 1;
      const comment: CommentRecord = {
        id: `comment-${sequence}`,
        ticketId: input.ticketId,
        authorId: input.authorId,
        body: input.body,
        createdAt: new Date(2026, 0, 1, 0, 0, sequence),
      };
      rows.push(comment);
      return comment;
    },
  };
}

function createFakeTickets(existingIds: string[]): Pick<TicketRepository, 'findById'> {
  return {
    async findById(id) {
      if (!existingIds.includes(id)) return null;
      const now = new Date(2026, 0, 1);
      return {
        id,
        teamId: 'team-1',
        type: 'bug',
        status: 'new',
        epicId: null,
        title: 'T',
        body: 'B',
        createdBy: 'user-1',
        createdAt: now,
        updatedAt: now,
      };
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

describe('comment service', () => {
  it('adds a comment to an existing ticket, keeping the body as sent', async () => {
    const service = createCommentService({
      repo: createFakeCommentRepo(),
      tickets: createFakeTickets(['ticket-1']),
    });
    const comment = await service.add('ticket-1', '  looks good  ', 'user-9');
    expect(comment.ticketId).toBe('ticket-1');
    expect(comment.authorId).toBe('user-9');
    expect(comment.body).toBe('  looks good  ');
  });

  it('rejects an empty/whitespace body (400)', async () => {
    const service = createCommentService({
      repo: createFakeCommentRepo(),
      tickets: createFakeTickets(['ticket-1']),
    });
    await expectStatus(service.add('ticket-1', '   ', 'user-1'), 400);
  });

  it('rejects add/list for a missing ticket (404)', async () => {
    const service = createCommentService({
      repo: createFakeCommentRepo(),
      tickets: createFakeTickets([]),
    });
    await expectStatus(service.add('ghost', 'hi', 'user-1'), 404);
    await expectStatus(service.list('ghost'), 404);
  });

  it('lists comments oldest-first', async () => {
    const service = createCommentService({
      repo: createFakeCommentRepo(),
      tickets: createFakeTickets(['ticket-1']),
    });
    await service.add('ticket-1', 'first', 'user-1');
    await service.add('ticket-1', 'second', 'user-1');
    await service.add('ticket-1', 'third', 'user-1');
    const bodies = (await service.list('ticket-1')).map((comment) => comment.body);
    expect(bodies).toEqual(['first', 'second', 'third']);
  });
});
