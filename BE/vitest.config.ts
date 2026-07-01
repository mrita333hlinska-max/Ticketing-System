import { defineConfig } from 'vitest/config';
import { TEST_DATABASE_URL } from './tests/testDb';

/**
 * Vitest configuration.
 *
 * `test.env` is applied to workers before any module loads, so the app's config
 * (`src/config/env.ts`) and DB client pick up the TEST database — not the dev
 * one. `dotenv` (loaded inside env.ts) won't override an already-set variable,
 * so this wins. NODE_ENV=test also switches the mailer to jsonTransport (no SMTP).
 */
export default defineConfig({
  test: {
    globalSetup: ['./tests/globalSetup.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
      // Deterministic non-secret values so config validation passes in CI.
      SESSION_SECRET: 'test-session-secret',
    },
    hookTimeout: 30000,
  },
});
