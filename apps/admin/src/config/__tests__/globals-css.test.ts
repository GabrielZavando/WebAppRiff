import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Verifies that `apps/admin/src/styles/globals.css` exists and declares
 * the Tailwind v4 import + a `@theme {}` block with the primary color.
 * Source of truth: openspec/changes/design-system-revision/tasks.md (1.11).
 */
function readGlobalsCss(): string {
  const path = fileURLToPath(
    new URL('../../../src/styles/globals.css', import.meta.url),
  );
  if (!existsSync(path)) {
    throw new Error(`globals.css not found at ${path}`);
  }
  return readFileSync(path, 'utf-8');
}

describe('apps/admin/src/styles/globals.css — Tailwind v4 + @theme (task 1.11)', () => {
  it('globals.css exists', () => {
    expect(() => readGlobalsCss()).not.toThrow();
  });

  it('imports tailwindcss', () => {
    const src = readGlobalsCss();
    expect(src).toMatch(/@import\s+['"]tailwindcss['"]/);
  });

  it('declares @theme block with --color-primary: #41B3C4', () => {
    const src = readGlobalsCss();
    expect(src).toMatch(/@theme\s*\{/);
    expect(src).toMatch(/--color-primary:\s*#41B3C4/i);
  });
});
