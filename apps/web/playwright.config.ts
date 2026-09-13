import { defineConfig } from 'playwright/test';

/**
 * On machines where Playwright cannot download its bundled Chromium (e.g.
 * Linux Mint 20.x / Ubuntu 20.04 base, which Playwright >= 1.62 no longer
 * targets), point `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` at any local
 * Chromium-family binary (e.g. `/usr/bin/brave-browser`). CI does not set it,
 * so the downloaded browser is used there.
 */
const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    ...(chromiumExecutablePath
      ? { launchOptions: { executablePath: chromiumExecutablePath } }
      : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  // Two servers: the zero-dep stub API (build-time catalog source, serves the
  // e2e fixture on port 3001) and the Astro build+preview of the site itself,
  // built against the stub with REQUIRE_API=true so the build fails if the
  // catalog ever comes back empty (silent-empty regression guard).
  webServer: [
    {
      command: 'node e2e/support/api-stub.mjs',
      url: 'http://localhost:3001/health',
      timeout: 15_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run e2e:build',
      url: 'http://localhost:4321',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
