/**
 * App-skeleton tests (Phase 2). These exercise the wiring only — health probe,
 * unmatched-route handling, and the auth gate — and do NOT need a live database
 * (no request here carries a session cookie, so the session store is never
 * queried).
 */
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';

describe('app skeleton', () => {
  const app = createApp();

  it('GET /health returns 200 with ok status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('an unknown route returns 404 with a message', async () => {
    const response = await request(app).get('/does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body.message).toBeTruthy();
  });

  it('a protected /api route returns 401 without a session', async () => {
    const response = await request(app).get('/api/teams');
    expect(response.status).toBe(401);
    expect(response.body.message).toBeTruthy();
  });
});
