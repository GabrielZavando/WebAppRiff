import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Verifies that `apps/admin/package.json` declares Tailwind v4 deps.
 * Source of truth: openspec/changes/design-system-revision/tasks.md (1.5) and
 * design.md (Decision D4: migrar apps/admin Tailwind v3 → v4).
 */
type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function readPackageJson(): PackageJson {
  // apps/admin/src/config/__tests__/package.test.ts -> apps/admin/package.json
  const packageJsonPath = fileURLToPath(
    new URL('../../../package.json', import.meta.url),
  );
  const raw = readFileSync(packageJsonPath, 'utf-8');
  return JSON.parse(raw) as PackageJson;
}

function getDep(pkg: PackageJson, name: string): string | undefined {
  return (
    (pkg.dependencies && pkg.dependencies[name]) ||
    (pkg.devDependencies && pkg.devDependencies[name])
  );
}

describe('apps/admin/package.json — Tailwind v4 (task 1.5)', () => {
  it('declares tailwindcss with version ^4.x (not ^3.x)', () => {
    const pkg = readPackageJson();
    const version = getDep(pkg, 'tailwindcss');
    expect(version, 'Expected "tailwindcss" declared').toBeTruthy();
    expect(version!).toMatch(/^\^4\./);
    expect(
      version!,
      'tailwindcss must NOT be on v3 anymore',
    ).not.toMatch(/^\^3\./);
  });

  it('declares @tailwindcss/postcss', () => {
    const pkg = readPackageJson();
    const version = getDep(pkg, '@tailwindcss/postcss');
    expect(
      version,
      'Expected "@tailwindcss/postcss" in apps/admin/package.json',
    ).toBeTruthy();
  });
});
