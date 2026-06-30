import { beforeEach, describe, expect, it } from 'vitest';
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from './errors';
import { createStubApi, type StubApi } from './stubAdapter';

let api: StubApi;

/** Sign up, verify, and log in a user; returns its id. */
async function loginUser(
  email = 'ana@example.com',
  password = 'password123',
): Promise<string> {
  const user = await api.signUp({ email, password });
  const token = api.getVerificationTokenFor(email);
  await api.verifyEmail(token!);
  await api.login({ email, password });
  return user.id;
}

beforeEach(() => {
  api = createStubApi(); // in-memory, isolated per test
});

describe('auth (§3)', () => {
  it('starts empty and gates business endpoints', async () => {
    await expect(api.getTeams()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects login until the email is verified, then succeeds', async () => {
    await api.signUp({ email: 'ana@example.com', password: 'password123' });
    await expect(
      api.login({ email: 'ana@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const token = api.getVerificationTokenFor('ana@example.com');
    await api.verifyEmail(token!);
    const user = await api.login({
      email: 'ana@example.com',
      password: 'password123',
    });
    expect(user.emailVerified).toBe(true);
  });

  it('enforces unique email and minimum password length', async () => {
    await api.signUp({ email: 'ana@example.com', password: 'password123' });
    await expect(
      api.signUp({ email: 'ANA@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      api.signUp({ email: 'b@example.com', password: 'short' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('teams (§4)', () => {
  beforeEach(async () => {
    await loginUser();
  });

  it('rejects a duplicate team name (case-insensitive)', async () => {
    await api.createTeam({ name: 'Payments' });
    await expect(api.createTeam({ name: 'payments' })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('blocks deleting a team that still has epics or tickets', async () => {
    const team = await api.createTeam({ name: 'Payments' });
    await api.createEpic({
      teamId: team.id,
      title: 'Checkout',
      description: null,
    });
    await expect(api.deleteTeam(team.id)).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('tickets (§5, §6)', () => {
  beforeEach(async () => {
    await loginUser();
  });

  it('rejects an epic from a different team', async () => {
    const teamA = await api.createTeam({ name: 'A' });
    const teamB = await api.createTeam({ name: 'B' });
    const epicB = await api.createEpic({
      teamId: teamB.id,
      title: 'Other',
      description: null,
    });
    await expect(
      api.createTicket({
        teamId: teamA.id,
        type: 'bug',
        title: 'x',
        body: 'y',
        epicId: epicB.id,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('does not bump updatedAt when nothing changes (§6)', async () => {
    const team = await api.createTeam({ name: 'A' });
    const ticket = await api.createTicket({
      teamId: team.id,
      type: 'bug',
      title: 'Title',
      body: 'Body',
      epicId: null,
    });
    const same = await api.updateTicket(ticket.id, { title: 'Title' });
    expect(same.updatedAt).toBe(ticket.updatedAt);
  });

  it('deletes comments when its ticket is deleted (§6)', async () => {
    const team = await api.createTeam({ name: 'A' });
    const ticket = await api.createTicket({
      teamId: team.id,
      type: 'feature',
      title: 'T',
      body: 'B',
      epicId: null,
    });
    await api.addComment({ ticketId: ticket.id, body: 'first' });
    await api.deleteTicket(ticket.id);
    await expect(api.getComments(ticket.id)).rejects.toThrow();
  });
});

describe('comments (§7)', () => {
  beforeEach(async () => {
    await loginUser();
  });

  it('does not change the ticket updatedAt and lists oldest-first', async () => {
    const team = await api.createTeam({ name: 'A' });
    const ticket = await api.createTicket({
      teamId: team.id,
      type: 'fix',
      title: 'T',
      body: 'B',
      epicId: null,
    });
    await api.addComment({ ticketId: ticket.id, body: 'first' });
    await api.addComment({ ticketId: ticket.id, body: 'second' });

    const reloaded = await api.getTicket(ticket.id);
    expect(reloaded.updatedAt).toBe(ticket.updatedAt);

    const comments = await api.getComments(ticket.id);
    expect(comments.map((c) => c.body)).toEqual(['first', 'second']);
  });
});
