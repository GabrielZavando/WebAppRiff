import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/**
 * ui-refactor task 6.2 (RED→GREEN) — Catálogo de iconos: set único Lucide.
 * Source: openspec/changes/ui-refactor/specs/design-tokens/spec.md y
 * openspec/changes/ui-refactor/tasks.md (tasks 6.1/6.2).
 *
 * - `docs/design/style-guide/README.md` debe documentar la tabla Lucide con
 *   las referencias usadas por los 5 componentes base y NO mencionar
 *   `material-symbols:`/`logos:` como sets autorizados.
 * - Ningún componente base declara un prefijo de icono distinto de `lucide:`.
 */

const REPO_ROOT = fileURLToPath(new URL('../../../../..', import.meta.url));
const WEB_ROOT = fileURLToPath(new URL('../../..', import.meta.url));

const BASE_COMPONENTS = [
  'TopHeader.astro',
  'Header.astro',
  'SearchForm.astro',
  'HeroBanner.astro',
  'PanelHome.astro',
] as const;

function readStyleGuideReadme(): string {
  return readFileSync(
    join(REPO_ROOT, 'docs', 'design', 'style-guide', 'README.md'),
    'utf-8',
  );
}

function readComponentSource(name: string): string {
  return readFileSync(join(WEB_ROOT, 'src', 'components', name), 'utf-8');
}

const LUCIDE_REFS = [
  'lucide:phone',
  'lucide:menu',
  'lucide:x',
  'lucide:facebook',
  'lucide:twitter',
  'lucide:instagram',
  'lucide:linkedin',
];

// Any reference to the obsolete icon sets must be gone from both the
// canonical docs and the base component sources.
const OBSOLETE_PREFIXES = /material-symbols:|logos:/;

describe('ui-refactor — catálogo de iconos: set único Lucide (task 6.2)', () => {
  describe('docs/design/style-guide/README.md documenta el set Lucide', () => {
    const readme = readStyleGuideReadme();

    it('menciona las referencias lucide:* de los 5 componentes', () => {
      for (const ref of LUCIDE_REFS) {
        expect(readme, `README debe documentar ${ref}`).toContain(ref);
      }
    });

    it('NO menciona material-symbols: ni logos: como sets autorizados', () => {
      expect(readme).not.toMatch(OBSOLETE_PREFIXES);
    });
  });

  describe('componentes base usan exclusivamente el prefijo lucide:', () => {
    for (const name of BASE_COMPONENTS) {
      it(`${name} no referencia material-symbols: ni logos:`, () => {
        const src = readComponentSource(name);
        expect(
          src,
          `${name} must not reference the obsolete icon sets material-symbols/logos`,
        ).not.toMatch(OBSOLETE_PREFIXES);
      });

      it(`${name} solo usa <Icon name="lucide:*"> o mapeos con valores lucide:*`, () => {
        const src = readComponentSource(name);
        const iconTags = src.match(/<\s*Icon\b[^>]*>/g) ?? [];
        for (const tag of iconTags) {
          const nameAttrs = tag.match(/name="([^"]+)"/g) ?? [];
          for (const attr of nameAttrs) {
            expect(attr, `${name} uses a non-lucide Icon: ${attr}`).toMatch(
              /name="lucide:[^"]+"/,
            );
          }
        }
      });
    }
  });
});
