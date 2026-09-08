import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

/**
 * Contract test for the root `.env.example` (SC-env-06): the template must
 * stay synchronized with the variables the code actually consumes. Guards
 * against audit finding E1 regressing (env drift between the template and
 * `lib/api/*`, `astro.config.mjs` and the webhook notifier).
 */
const envExamplePath = fileURLToPath(new URL('../../../../../.env.example', import.meta.url));

describe('SC-env-06 — .env.example stays synchronized with the code contract', () => {
  const content = readFileSync(envExamplePath, 'utf8');

  it('declares NESTJS_API_URL with the /api/v1 suffix contract', () => {
    expect(content).toMatch(/^NESTJS_API_URL=http:\/\/localhost:3000\/api\/v1$/m);
  });

  it('declares SITE_URL for canonical/sitemap builds', () => {
    expect(content).toMatch(/^SITE_URL=/m);
  });

  it('declares REQUIRE_API for the production fail-fast gate', () => {
    expect(content).toMatch(/^REQUIRE_API=/m);
  });

  it('declares CATEGORIES_WEBHOOK_URL for the Astro rebuild webhook', () => {
    expect(content).toMatch(/^CATEGORIES_WEBHOOK_URL=/m);
  });

  it('does not declare variables with no consumers (LOG_LEVEL, LOG_FORMAT)', () => {
    expect(content).not.toMatch(/^LOG_LEVEL=/m);
    expect(content).not.toMatch(/^LOG_FORMAT=/m);
  });
});
