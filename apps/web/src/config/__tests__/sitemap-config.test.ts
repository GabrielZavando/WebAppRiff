import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Contract tests for the `add-sitemap` change (SC-206): automates the
 * acceptance criteria that the sitemap integration is declared and wired,
 * and that the canonical `site` is derived from `SITE_URL` (never a hardcoded
 * production `localhost`). Source of truth:
 * openspec/changes/add-sitemap/specs/add-sitemap/spec.md.
 *
 * We read the source files from disk (not import) because
 * `apps/web/astro.config.mjs` imports `astro/config`, which is not resolvable
 * in the vitest isolate — same pattern as `astro-config.test.ts`.
 */
function readJson(filePath: string): Record<string, unknown> {
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as Record<string, unknown>;
}

function readPackageJson(): Record<string, unknown> {
  return readJson(
    fileURLToPath(new URL('../../../package.json', import.meta.url)),
  );
}

function readAstroConfig(): string {
  return readFileSync(
    fileURLToPath(new URL('../../../astro.config.mjs', import.meta.url)),
    'utf-8',
  );
}

describe('apps/web/package.json — @astrojs/sitemap declared (SC-206)', () => {
  it('[SC-206] declares "@astrojs/sitemap" in dependencies', () => {
    const pkg = readPackageJson();
    const dependencies = pkg.dependencies as Record<string, string> | undefined;
    expect(
      dependencies?.['@astrojs/sitemap'],
      'Expected "@astrojs/sitemap" in apps/web/package.json dependencies',
    ).toBeTruthy();
  });
});

describe('apps/web/astro.config.mjs — sitemap() wired (SC-206)', () => {
  it('[SC-206] imports the "sitemap" integration', () => {
    const source = readAstroConfig();
    expect(
      source,
      'Expected an import of `@astrojs/sitemap` in astro.config.mjs',
    ).toMatch(/from\s+['"]@astrojs\/sitemap['"]/);
  });

  it('[SC-206] calls sitemap() in the integrations array', () => {
    const source = readAstroConfig();
    expect(
      source,
      'Expected `sitemap()` to be invoked in astro.config.mjs integrations',
    ).toMatch(/sitemap\s*\(\)/);
  });
});

describe('apps/web/astro.config.mjs — canonical site derived from SITE_URL (SC-203/SC-206)', () => {
  it('[SC-203]/[SC-206] derives `site` from process.env.SITE_URL instead of hardcoding production localhost', () => {
    const source = readAstroConfig();
    expect(
      source,
      'Expected `site` to come from process.env.SITE_URL (with localhost only as dev fallback)',
    ).toMatch(/site:\s*process\.env\.SITE_URL\s*\|\|/);
    expect(
      source,
      'The production site must not be pinned to a hardcoded http://localhost URL',
    ).not.toMatch(/site:\s*['"]http:\/\/localhost/);
  });
});