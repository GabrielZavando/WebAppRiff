import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Verifies that `astroIcon()` is wired into `apps/web/astro.config.mjs`.
 * Source of truth: openspec/changes/design-system-revision/tasks.md (1.3) and
 * design.md (Decision D7: astro-icon + @iconify-json SSR-only).
 *
 * We read the source file text (not import it) because astro.config.mjs
 * imports `astro/config` which is not resolvable in the vitest isolate.
 */
function readAstroConfig(): string {
  const configPath = fileURLToPath(
    new URL('../../../astro.config.mjs', import.meta.url),
  );
  return readFileSync(configPath, 'utf-8');
}

describe('apps/web/astro.config.mjs — astro-icon integration (task 1.3)', () => {
  it('imports astroIcon from "astro-icon"', () => {
    const source = readAstroConfig();
    expect(
      source,
      'Expected `import { astroIcon } from "astro-icon"` (or equivalent default import)',
    ).toMatch(/from\s+['"]astro-icon['"]/);
  });

  it('calls astroIcon() in the config', () => {
    const source = readAstroConfig();
    expect(
      source,
      'Expected `astroIcon()` to be invoked somewhere in the config',
    ).toMatch(/astroIcon\s*\(/);
  });
});
