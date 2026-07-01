/**
 * Required backend business-flow test (REQUIREMENTS §11) — end-to-end against a
 * real (disposable) Postgres, exercising the whole stack: HTTP → services →
 * Drizzle → DB.
 *
 * Flow: sign up → (read the emailed token from the DB) → verify → log in →
 * create team → create epic → create ticket → move it → comment → and assert
 * everything persisted, including the rule that adding a comment does NOT bump
 * the ticket's updatedAt (§7).
 */
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { pool } from '../../src/db/client';
import { createApp } from '../../src/http/app';

const app = createApp();

async function truncateAll(): Promise<void> {
  await pool.query(
    'TRUNCATE comments, tickets, epics, teams, verification_tokens, users CASCADE',
  );
}

async function latestVerificationToken(): Promise<string> {
  const result = await pool.query<{ token: string }>(
    'SELECT token FROM verification_tokens ORDER BY created_at DESC LIMIT 1',
  );
  const token = result.rows[0]?.token;
  if (!token) throw new Error('No verification token found in the database.');
  return token;
}

/** Sign up, verify (via the stored token), and log in — returns a ready agent. */
async function signUpVerifyLogin(email: string) {
  const agent = request.agent(app);
  const credentials = { email, password: 'password123' };
  await agent.post('/api/auth/signup').send(credentials);
  await agent.post('/api/auth/verify').send({ token: await latestVerificationToken() });
  await agent.post('/api/auth/login').send(credentials);
  return agent;
}

beforeEach(truncateAll);
afterAll(async () => {
  await pool.end();
});

describe('business flow: signup → verify → login → team → epic → ticket → comment', () => {
  it('runs the whole flow and persists every step', async () => {
    const agent = request.agent(app);
    const credentials = { email: 'qa@example.com', password: 'password123' };

    // 1. Sign up — account created, unverified.
    const signup = await agent.post('/api/auth/signup').send(credentials);
    expect(signup.status).toBe(201);
    expect(signup.body.emailVerified).toBe(false);

    // 2. Login is blocked until verification.
    const blocked = await agent.post('/api/auth/login').send(credentials);
    expect(blocked.status).toBe(403);

    // 3. Verify using the token the backend stored (stands in for the email link).
    const token = await latestVerificationToken();
    const verify = await agent.post('/api/auth/verify').send({ token });
    expect(verify.status).toBe(204);

    // 4. Log in — session cookie is now set on the agent.
    const login = await agent.post('/api/auth/login').send(credentials);
    expect(login.status).toBe(200);
    expect(login.body.emailVerified).toBe(true);

    // 5. /me reflects the session.
    const me = await agent.get('/api/auth/me');
    expect(me.body.email).toBe('qa@example.com');

    // 6. Create a team.
    const team = await agent.post('/api/teams').send({ name: 'Payments' });
    expect(team.status).toBe(201);
    const teamId = team.body.id;

    // 7. Create an epic in that team.
    const epic = await agent
      .post('/api/epics')
      .send({ teamId, title: 'Checkout', description: null });
    expect(epic.status).toBe(201);
    const epicId = epic.body.id;

    // 8. Create a ticket referencing the epic — starts in `new`, created_by set.
    const created = await agent.post('/api/tickets').send({
      teamId,
      type: 'bug',
      title: 'Broken login',
      body: 'Steps to reproduce',
      epicId,
    });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('new');
    expect(created.body.createdBy).toBe(login.body.id);
    const ticketId = created.body.id;

    // 9. Move it (drag-and-drop) — updatedAt must advance.
    const moved = await agent
      .patch(`/api/tickets/${ticketId}`)
      .send({ status: 'in_progress' });
    expect(moved.status).toBe(200);
    expect(moved.body.status).toBe('in_progress');
    expect(new Date(moved.body.updatedAt).getTime()).toBeGreaterThan(
      new Date(created.body.updatedAt).getTime(),
    );
    const updatedAtAfterMove = moved.body.updatedAt;

    // 10. Add a comment — must NOT bump the ticket's updatedAt (§7).
    const comment = await agent
      .post(`/api/tickets/${ticketId}/comments`)
      .send({ body: 'Looking into this' });
    expect(comment.status).toBe(201);
    expect(comment.body.authorId).toBe(login.body.id);

    const afterComment = await agent.get(`/api/tickets/${ticketId}`);
    expect(afterComment.body.updatedAt).toBe(updatedAtAfterMove);

    // 11. Comments list oldest-first and are readable.
    const comments = await agent.get(`/api/tickets/${ticketId}/comments`);
    expect(comments.body).toHaveLength(1);
    expect(comments.body[0].body).toBe('Looking into this');

    // 12. Everything actually persisted (fresh read through a NEW agent/session).
    const verifyAgent = request.agent(app);
    await verifyAgent.post('/api/auth/login').send(credentials);
    const boardTickets = await verifyAgent.get(`/api/tickets?teamId=${teamId}`);
    expect(boardTickets.body).toHaveLength(1);
    expect(boardTickets.body[0].id).toBe(ticketId);
    expect(boardTickets.body[0].epicId).toBe(epicId);
  });

  it('enforces referential guards across the stack (409/400)', async () => {
    const agent = request.agent(app);
    const credentials = { email: 'guard@example.com', password: 'password123' };
    await agent.post('/api/auth/signup').send(credentials);
    await agent.post('/api/auth/verify').send({ token: await latestVerificationToken() });
    await agent.post('/api/auth/login').send(credentials);

    const teamA = (await agent.post('/api/teams').send({ name: 'Team A' })).body;
    const teamB = (await agent.post('/api/teams').send({ name: 'Team B' })).body;
    const epicA = (
      await agent
        .post('/api/epics')
        .send({ teamId: teamA.id, title: 'A epic', description: null })
    ).body;

    // Epic from another team is rejected (400).
    const crossTeam = await agent.post('/api/tickets').send({
      teamId: teamB.id,
      type: 'feature',
      title: 'X',
      body: 'Y',
      epicId: epicA.id,
    });
    expect(crossTeam.status).toBe(400);

    // A ticket referencing the epic blocks both epic and team deletion (409).
    await agent.post('/api/tickets').send({
      teamId: teamA.id,
      type: 'bug',
      title: 'Real',
      body: 'Body',
      epicId: epicA.id,
    });
    expect((await agent.delete(`/api/epics/${epicA.id}`)).status).toBe(409);
    expect((await agent.delete(`/api/teams/${teamA.id}`)).status).toBe(409);
  });

  it('isolates data per user: a new user sees nothing of another user\'s workspace', async () => {
    // User A builds a workspace.
    const alice = await signUpVerifyLogin('alice@example.com');
    const team = (await alice.post('/api/teams').send({ name: 'Alice Team' })).body;
    const ticket = (
      await alice.post('/api/tickets').send({
        teamId: team.id,
        type: 'bug',
        title: 'Alice ticket',
        body: 'Body',
        epicId: null,
      })
    ).body;

    // A brand-new user B sees an empty workspace...
    const bob = await signUpVerifyLogin('bob@example.com');
    expect((await bob.get('/api/teams')).body).toEqual([]);
    expect((await bob.get('/api/tickets')).body).toEqual([]);

    // ...and cannot reach A's team or ticket by id (404, not 403 — hides existence).
    expect((await bob.get(`/api/tickets/${ticket.id}`)).status).toBe(404);
    expect(
      (await bob.patch(`/api/tickets/${ticket.id}`).send({ status: 'done' })).status,
    ).toBe(404);
    expect((await bob.delete(`/api/teams/${team.id}`)).status).toBe(404);

    // B can reuse the same team name (uniqueness is per-owner).
    expect((await bob.post('/api/teams').send({ name: 'Alice Team' })).status).toBe(201);

    // A still sees their own data intact.
    expect((await alice.get('/api/teams')).body).toHaveLength(1);
  });
});
