import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/**
 * Verifies that no `.astro` component in `apps/web/src/components/` and
 * `apps/web/src/pages/` references the obsolete `bg-brand-*`/etc utilities.
 *
 * Source of truth: openspec/changes/design-system-revision/tasks.md (4.21).
 */
type FileEntry = { relPath: string; content: string };

function readAstroFilesIn(absDir: string, skipSubdirs: string[] = []): FileEntry[] {
  const result: FileEntry[] = [];
  const entries = readdirSync(absDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (skipSubdirs.includes(entry.name)) continue;
      for (const child of readAstroFilesIn(join(absDir, entry.name), skipSubdirs)) {
        result.push(child);
      }
    } else if (entry.name.endsWith('.astro')) {
      result.push({
        relPath: join(absDir, entry.name),
        content: readFileSync(join(absDir, entry.name), 'utf-8'),
      });
    }
  }
  return result;
}

// From apps/web/src/components/__tests__/no-brand-classes.test.ts we need to
// ascend 3 levels to reach apps/web/ (the workspace root).
const WEB_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const COMPONENTS_DIR = join(WEB_ROOT, 'src', 'components');
const PAGES_DIR = join(WEB_ROOT, 'src', 'pages');

const OBSOLETE = /\b(bg|text|from|to|via|border|after:bg|hover:bg)-brand-(navy|navy-light|orange|teal)\b/;

function componentFiles(): FileEntry[] {
  return readAstroFilesIn(COMPONENTS_DIR, ['__tests__', '__snapshots__', 'icons']);
}
function pageFiles(): FileEntry[] {
  return readAstroFilesIn(PAGES_DIR);
}

describe('apps/web — no obsolete brand-* classes in .astro (task 4.21)', () => {
  for (const name of ['TopHeader.astro', 'Header.astro', 'SearchForm.astro', 'HeroBanner.astro', 'PanelHome.astro']) {
    it(`${name} has no brand-* classes`, () => {
      const f = componentFiles().find((x) => x.relPath.endsWith(name));
      expect(f, `${name} not found`).toBeDefined();
      expect(f!.content).not.toMatch(OBSOLETE);
    });
  }

  it('NO .astro in components/ references brand-* classes', () => {
    const offenders = componentFiles().filter((f) => OBSOLETE.test(f.content));
    expect(
      offenders,
      `Offenders: ${offenders.map((o) => o.relPath).join(', ')}`,
    ).toEqual([]);
  });

  it('NO .astro in pages/ references brand-* classes (task 4.22)', () => {
    const offenders = pageFiles().filter((f) => OBSOLETE.test(f.content));
    expect(
      offenders,
      `Offenders: ${offenders.map((o) => o.relPath).join(', ')}`,
    ).toEqual([]);
  });
});
