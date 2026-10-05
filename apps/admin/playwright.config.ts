import { defineConfig } from '@playwright/test';

/**
 * Admin panel E2E. The dev-server port is configurable via `E2E_PORT` so the
 * worktree can run E2E in parallel with another `ng serve` on the default
 * port (e.g. `E2E_PORT=4201 npm run test:smoke`).
 */
const port = process.env['E2E_PORT'] ?? '4200';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: `ng serve --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env['CI'],
  },
});