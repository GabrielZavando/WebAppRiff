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
 * - Ningún componente base declara un prefijo de icono distinto de `lucide:`,
 *   **excepto** `simple-icons:x` para el logo de marca de X (Twitter), la única
 *   excepción documentada (Lucide no provee el logo actual de X).
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
  'lucide:instagram',
  'lucide:linkedin',
] as const;

// The sole documented exception to the unique-Lucide set rule: the X (Twitter)
// brand logo is not available in Lucide, so `simple-icons:x` is authorized
// (see docs/design/style-guide/README.md). See
// openspec/changes/topheader-click-to-call-x-icon.
const EXCEPTION_REFS = ['simple-icons:x'] as const;

// Any reference to the obsolete icon sets must be gone from both the
// canonical docs and the base component sources.
const OBSOLETE_PREFIXES = /material-symbols:|logos:/;

describe('ui-refactor — catálogo de iconos: set único Lucide (task 6.2)', () => {
  describe('docs/design/style-guide/README.md documenta el set Lucide', () => {
    const readme = readStyleGuideReadme();

    it('menciona las referencias lucide:* de los 5 componentes y la excepción simple-icons:x', () => {
      for (const ref of LUCIDE_REFS) {
        expect(readme, `README debe documentar ${ref}`).toContain(ref);
      }
      // La excepción documentada para el logo de X.
      for (const ref of EXCEPTION_REFS) {
        expect(readme, `README debe documentar la excepción ${ref}`).toContain(ref);
      }
    });

    it('NO menciona material-symbols: ni logos: como sets autorizados', () => {
      expect(readme).not.toMatch(OBSOLETE_PREFIXES);
    });
  });

  describe('componentes base usan exclusivamente el prefijo lucide: (con excepción simple-icons:x)', () => {
    for (const name of BASE_COMPONENTS) {
      it(`${name} no referencia material-symbols: ni logos:`, () => {
        const src = readComponentSource(name);
        expect(
          src,
          `${name} must not reference the obsolete icon sets material-symbols/logos`,
        ).not.toMatch(OBSOLETE_PREFIXES);
      });

      it(`${name} usa <Icon name="lucide:*"> en etiquetas literales (excluye mapeos dinámicos)`, () => {
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

    // The sole documented exception: the X social icon must use simple-icons:x
    // in both TopHeader and Footer (cross-component consistency, design.md § D4).
    const EXCEPTION_COMPONENTS = ['TopHeader.astro', 'Footer.astro'];
    for (const name of EXCEPTION_COMPONENTS) {
      it(`${name} mapea X a simple-icons:x (logo oficial X)`, () => {
        const src = readComponentSource(name);
        expect(src, `${name} must map X to simple-icons:x`).toContain(
          "X: 'simple-icons:x'",
        );
        expect(src, `${name} must not use lucide:twitter for X`).not.toContain(
          "X: 'lucide:twitter'",
        );
      });
    }
  });
});
