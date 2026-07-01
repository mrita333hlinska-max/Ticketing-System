/**
 * Comment service unit tests (per-user ownership). In-memory fakes for the
 * comment repo and ticket lookup. Covers ticket-ownership (404 for missing OR
 * another user's ticket), non-empty body (400), and oldest-first listing.
 */
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../lib/errors';
import type { TicketRepository } from '../tickets/tickets.repo';
import { createCommentService } from './comments.service';
import type { CommentRecord, CommentRepository } from './comments.repo';

const OWNER = 'user-1';
const OTHER = 'user-2';

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

// ticketId → owner id
function createFakeTickets(
  owners: Record<string, string>,
): Pick<TicketRepository, 'findById'> {
  return {
    async findById(id) {
      const createdBy = owners[id];
      if (!createdBy) return null;
      const now = new Date(2026, 0, 1);
      return {
        id,
        teamId: 'team-1',
        type: 'bug',
        status: 'new',
        epicId: null,
        title: 'T',
        body: 'B',
        createdBy,
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
  it('adds a comment to the user\'s own ticket, keeping the body as sent', async () => {
    const service = createCommentService({
      repo: createFakeCommentRepo(),
      tickets: createFakeTickets({ 'ticket-1': OWNER }),
    });
    const comment = await service.add('ticket-1', '  looks good  ', OWNER);
    expect(comment.ticketId).toBe('ticket-1');
    expect(comment.authorId).toBe(OWNER);
    expect(comment.body).toBe('  looks good  ');
  });

  it('rejects an empty/whitespace body (400)', async () => {
    const service = createCommentService({
      repo: createFakeCommentRepo(),
      tickets: createFakeTickets({ 'ticket-1': OWNER }),
    });
    await expectStatus(service.add('ticket-1', '   ', OWNER), 400);
  });

  it('rejects add/list for a missing ticket (404)', async () => {
    const service = createCommentService({
      repo: createFakeCommentRepo(),
      tickets: createFakeTickets({}),
    });
    await expectStatus(service.add('ghost', 'hi', OWNER), 404);
    await expectStatus(service.list('ghost', OWNER), 404);
  });

  it('rejects commenting on / listing another user\'s ticket (404)', async () => {
    const service = createCommentService({
      repo: createFakeCommentRepo(),
      tickets: createFakeTickets({ 'ticket-1': OWNER }),
    });
    await expectStatus(service.add('ticket-1', 'sneaky', OTHER), 404);
    await expectStatus(service.list('ticket-1', OTHER), 404);
  });

  it('lists comments oldest-first', async () => {
    const service = createCommentService({
      repo: createFakeCommentRepo(),
      tickets: createFakeTickets({ 'ticket-1': OWNER }),
    });
    await service.add('ticket-1', 'first', OWNER);
    await service.add('ticket-1', 'second', OWNER);
    await service.add('ticket-1', 'third', OWNER);
    const bodies = (await service.list('ticket-1', OWNER)).map(
      (comment) => comment.body,
    );
    expect(bodies).toEqual(['first', 'second', 'third']);
  });
});
