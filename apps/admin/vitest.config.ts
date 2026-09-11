import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: [],
    // vitest 4 default pool serves test files via data: URLs, breaking
    // fileURLToPath(import.meta.url) in config-file tests. The 'forks'
    // pool loads files from disk so import.meta.url is a real file URL.
    pool: 'forks',
  },
});
