import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Verifies that `apps/admin/src/styles/globals.css` declares the same set
 * of `@theme {}` tokens (name → value) as `apps/web/src/styles/globals.css`.
 *
 * Source of truth: openspec/changes/design-system-revision/tasks.md (3.1) and
 * design.md (Decision D1: dos globals.css sincronizados manualmente).
 */
type Token = { name: string; value: string };

function readCss(filePath: string): string {
  return readFileSync(filePath, 'utf-8');
}

function readWebCss(): string {
  return readCss(
    fileURLToPath(new URL('../../../../web/src/styles/globals.css', import.meta.url)),
  );
}

function readAdminCss(): string {
  return readCss(
    fileURLToPath(new URL('../globals.css', import.meta.url)),
  );
}

function extractThemeBlock(css: string): string {
  const startMatch = css.match(/@theme\s*\{/);
  if (!startMatch || startMatch.index === undefined) return '';
  const start = startMatch.index + startMatch[0].length;
  let depth = 1;
  let i = start;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }
  return css.slice(start, i - 1);
}

function parseTokens(themeBlock: string): Token[] {
  const tokens: Token[] = [];
  const lineRegex = /^\s*(--[\w-]+)\s*:\s*([^;]+);/gm;
  let m: RegExpExecArray | null;
  while ((m = lineRegex.exec(themeBlock)) !== null) {
    tokens.push({ name: m[1]!, value: m[2]!.trim() });
  }
  return tokens;
}

function getWebTokens(): Token[] {
  return parseTokens(extractThemeBlock(readWebCss()));
}
function getAdminTokens(): Token[] {
  return parseTokens(extractThemeBlock(readAdminCss()));
}

describe('admin ↔ web token sync (task 3.1)', () => {
  it('admin @theme declares the same set of (name → value) pairs as web', () => {
    const web = getWebTokens();
    const admin = getAdminTokens();
    const webMap = new Map(web.map((t) => [t.name, t.value]));
    const adminMap = new Map(admin.map((t) => [t.name, t.value]));
    const allNames = new Set<string>([...webMap.keys(), ...adminMap.keys()]);
    const diffs: string[] = [];
    for (const name of allNames) {
      const w = webMap.get(name);
      const a = adminMap.get(name);
      if (w === undefined) {
        diffs.push(`"${name}" present in admin but missing in web`);
      } else if (a === undefined) {
        diffs.push(`"${name}" present in web but missing in admin`);
      } else if (w !== a) {
        diffs.push(`"${name}" differs: web=${w} admin=${a}`);
      }
    }
    expect(diffs, diffs.join('\n')).toEqual([]);
  });

  it('admin @theme does NOT contain any --color-brand-* declaration', () => {
    const admin = readAdminCss();
    expect(admin).not.toMatch(/--color-brand-/);
  });

  it('admin imports the same @fontsource packages as web', () => {
    const admin = readAdminCss();
    const packs = [
      '@fontsource/montserrat/600',
      '@fontsource/montserrat/700',
      '@fontsource/montserrat/800',
      '@fontsource/open-sans/400',
      '@fontsource/open-sans/600',
      '@fontsource/open-sans/700',
      '@fontsource/open-sans/400-italic',
    ];
    for (const p of packs) {
      expect(admin).toMatch(new RegExp(p.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')));
    }
  });
});
