import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Verifies that the four design-system deps required by the
 * `design-system-revision` change are declared in `apps/web/package.json`.
 *
 * Source of truth: openspec/changes/design-system-revision/tasks.md (1.1) and
 * design.md (Decisions D2, D3, D7). This test is the RED step of task 1.1:
 * it MUST fail before the GREEN task 1.2 amends `package.json`.
 *
 * The test reads `package.json` from disk (not via `import`, which would be
 * affected by workspace hoisting in monorepo) and asserts each required
 * package appears either in `dependencies` or `devDependencies`.
 */
type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const REQUIRED_DEPS = [
  'astro-icon',
  '@iconify-json/material-symbols',
  '@fontsource/montserrat',
  '@fontsource/open-sans',
] as const;

function readPackageJson(): PackageJson {
  // apps/web/package.json is three levels up from this test file
  // (apps/web/src/config/__tests__/package.test.ts -> apps/web/package.json)
  const packageJsonPath = fileURLToPath(
    new URL('../../../package.json', import.meta.url),
  );
  const raw = readFileSync(packageJsonPath, 'utf-8');
  return JSON.parse(raw) as PackageJson;
}

describe('apps/web/package.json — design-system-revision deps (task 1.1)', () => {
  for (const dep of REQUIRED_DEPS) {
    it(`declares "${dep}"`, () => {
      const pkg = readPackageJson();
      const declared =
        (pkg.dependencies && pkg.dependencies[dep]) ||
        (pkg.devDependencies && pkg.devDependencies[dep]);
      expect(declared, `Expected "${dep}" in apps/web/package.json`).toBeTruthy();
    });
  }
});
