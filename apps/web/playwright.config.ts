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
  //
  // The site contact bar is public, env-driven content (PRIMARY_PHONE and the
  // SOCIAL_* URLs). CI has no .env file, so the e2e build injects the public
  // values here — without them the TopHeader phone/social links simply don't
  // render and the DOM-order specs fail (CI-only, works locally because of the
  // developer's .env).
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
      env: {
        NESTJS_API_URL: 'http://localhost:3001/api/v1',
        REQUIRE_API: 'true',
        PRIMARY_PHONE: '+56 2 29079067',
        SOCIAL_FACEBOOK_URL: 'https://facebook.com/riff',
        SOCIAL_X_URL: 'https://x.com/riff',
        SOCIAL_INSTAGRAM_URL: 'https://instagram.com/riff',
        SOCIAL_LINKEDIN_URL: 'https://linkedin.com/company/riff',
      },
    },
  ],
});
