/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    // Unit tests (Vitest) live under src/. E2E specs under tests/ are run by
    // Playwright (`npm run test:e2e`) — keep Vitest from collecting them.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
