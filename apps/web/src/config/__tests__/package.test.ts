import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Verifies that the design-system icon deps required by the `ui-refactor`
 * change are declared in `apps/web/package.json` — and that the obsolete icon
 * sets (`material-symbols`, `logos`) are removed.
 *
 * Source of truth: openspec/changes/ui-refactor/design.md (Decision 1) and
 * openspec/changes/ui-refactor/specs/design-tokens/spec.md (Requirement
 * "Catálogo de iconos Lucide"). This test is the RED step of task 1.1:
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
  '@iconify-json/lucide',
  // Documented sole exception to the single-Lucide set rule (X brand logo).
  '@iconify-json/simple-icons',
  '@fontsource/montserrat',
  '@fontsource/open-sans',
] as const;

// Obsolete icon sets replaced by Lucide as the single authorized set
// (see ui-refactor/design.md Decision 1 + specs/design-tokens/spec.md).
const OBSOLETE_ICON_SETS = [
  '@iconify-json/material-symbols',
  '@iconify-json/logos',
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

describe('apps/web/package.json — obsolete icon sets removed (ui-refactor task 1.1)', () => {
  for (const dep of OBSOLETE_ICON_SETS) {
    it(`does NOT declare "${dep}" (replaced by @iconify-json/lucide)`, () => {
      const pkg = readPackageJson();
      const declared =
        (pkg.dependencies && pkg.dependencies[dep]) ||
        (pkg.devDependencies && pkg.devDependencies[dep]);
      expect(
        declared,
        `"${dep}" must be removed from apps/web/package.json — Lucide is the single authorized icon set (ui-refactor decision 1)`,
      ).toBeFalsy();
    });
  }

  it('declares only the authorized @iconify-json/* packages (lucide + simple-icons:X exception)', () => {
    const pkg = readPackageJson();
    const iconifyDecls = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ].filter((name) => name.startsWith('@iconify-json/'));
    // `simple-icons` is the sole documented exception to the single-Lucide
    // set rule: Lucide lacks the current X brand logo (see
    // docs/design/style-guide/README.md). See
    // openspec/changes/topheader-click-to-call-x-icon.
    expect(iconifyDecls).toEqual(['@iconify-json/lucide', '@iconify-json/simple-icons']);
  });
});
