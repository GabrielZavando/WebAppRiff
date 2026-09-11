import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Verifies that `apps/admin/src/main.ts` exists and bootstraps an Angular
 * standalone application via `bootstrapApplication(...)`.
 * Source of truth: openspec/changes/design-system-revision/tasks.md (1.9).
 */
function adminRoot(): string {
  const cwd = process.cwd();
  return existsSync(resolve(cwd, 'apps/admin/package.json')) ? resolve(cwd, 'apps/admin') : cwd;
}

function readMainTs(): string {
  const path = resolve(adminRoot(), 'src/main.ts');
  if (!existsSync(path)) {
    throw new Error(`main.ts not found at ${path}`);
  }
  return readFileSync(path, 'utf-8');
}

describe('apps/admin/src/main.ts — bootstrap (task 1.9)', () => {
  it('main.ts exists', () => {
    expect(() => readMainTs()).not.toThrow();
  });

  it('imports bootstrapApplication from @angular/platform-browser', () => {
    const src = readMainTs();
    expect(src).toMatch(/from\s+['"]@angular\/platform-browser['"]/);
    expect(src).toMatch(/bootstrapApplication/);
  });

  it('calls bootstrapApplication(...) with a component', () => {
    const src = readMainTs();
    expect(src).toMatch(/bootstrapApplication\s*\(/);
  });
});
