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
  // Local dev proxies /api to the backend, so `npm run dev` talks to the real
  // API (start it with `docker compose up -d db backend mailpit`). Same-origin,
  // so session cookies work. In the container, nginx proxies /api instead.
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
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
