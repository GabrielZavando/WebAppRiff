import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/**
 * Verifies that `apps/web/src/styles/globals.css` declares the full canonical
 * design-token set in `@theme {}` (Tailwind v4 syntax).
 *
 * Source of truth:
 * - openspec/changes/design-system-revision/tasks.md (tasks 2.1, 2.3, 2.5,
 *   2.7, 2.9, 2.11)
 * - openspec/changes/design-system-revision/specs/design-tokens/spec.md
 *   (Requirements: Marca, Neutros, Estado, Tipografía, Radio y sombras,
 *   Prohibición de literales hex y tokens obsoletos)
 * - docs/design/style-guide/index.html (the visual canonical source).
 */
function readGlobalsCss(): string {
  const path = fileURLToPath(
    new URL('../globals.css', import.meta.url),
  );
  return readFileSync(path, 'utf-8');
}

/** Extracts the contents of the first `@theme { ... }` block as a string. */
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

const MARCA_TOKENS: ReadonlyArray<readonly [string, string]> = [
  ['--color-primary', '#41B3C4'],
  ['--color-primary-dark', '#2E9AAD'],
  ['--color-primary-darker', '#227E8E'],
  ['--color-primary-light', '#D2EEF2'],
  ['--color-primary-100', '#EAF7F9'],
  ['--color-secondary', '#1F2D40'],
  ['--color-secondary-dark', '#16202E'],
  ['--color-secondary-light', '#35455E'],
  ['--color-accent', '#F26A21'],
  ['--color-accent-dark', '#D14E12'],
  ['--color-accent-darker', '#B03E0E'],
  ['--color-accent-light', '#FDE8DC'],
];

const NEUTRAL_TOKENS: ReadonlyArray<readonly [string, string]> = [
  ['--color-text', '#1F2D40'],
  ['--color-text-2', '#5C6675'],
  ['--color-muted', '#98A1AC'],
  ['--color-border', '#E3E8ED'],
  ['--color-bg', '#F6F8FA'],
  ['--color-white', '#FFFFFF'],
];

const STATE_TOKENS: ReadonlyArray<readonly [string, string]> = [
  ['--color-success', '#25D366'],
  ['--color-success-dark', '#149A49'],
  ['--color-success-light', '#E4F8EC'],
  ['--color-warning', '#F5B01E'],
  ['--color-warning-dark', '#9A6E08'],
  ['--color-warning-light', '#FEF4DC'],
  ['--color-error', '#E0453A'],
  ['--color-error-dark', '#B93127'],
  ['--color-error-light', '#FCE9E7'],
  ['--color-info', '#2D9CDB'],
  ['--color-info-dark', '#1B74A6'],
  ['--color-info-light', '#E7F3FB'],
];

function buildRegExp(name: string, value: string): RegExp {
  // Matches `<name>\s*:\s*<value>` ignoring case (hex case-insensitive).
  return new RegExp(`${name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*:\\s*${value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`, 'i');
}

describe('apps/web/src/styles/globals.css — design tokens (tasks 2.x)', () => {
  describe('Task 2.1 — Marca (12 tokens)', () => {
    for (const [name, value] of MARCA_TOKENS) {
      it(`declares ${name}: ${value}`, () => {
        const theme = extractThemeBlock(readGlobalsCss());
        expect(
          theme,
          `Expected ${name}: ${value} inside @theme`,
        ).toMatch(buildRegExp(name, value));
      });
    }
  });

  describe('Task 2.3 — Neutros (6 tokens)', () => {
    for (const [name, value] of NEUTRAL_TOKENS) {
      it(`declares ${name}: ${value}`, () => {
        const theme = extractThemeBlock(readGlobalsCss());
        expect(theme).toMatch(buildRegExp(name, value));
      });
    }
  });

  describe('Task 2.5 — Estado (12 tokens)', () => {
    for (const [name, value] of STATE_TOKENS) {
      it(`declares ${name}: ${value}`, () => {
        const theme = extractThemeBlock(readGlobalsCss());
        expect(theme).toMatch(buildRegExp(name, value));
      });
    }
  });

  describe('Task 2.7 — Tipografía', () => {
    it('declares --font-heading: Montserrat', () => {
      const theme = extractThemeBlock(readGlobalsCss());
      expect(theme).toMatch(/--font-heading\s*:\s*["']Montserrat["']/);
    });
    it('declares --font-body: Open Sans', () => {
      const theme = extractThemeBlock(readGlobalsCss());
      expect(theme).toMatch(/--font-body\s*:\s*["']Open Sans["']/);
    });
  });

  describe('Task 2.8 — @fontsource imports', () => {
    const FONT_IMPORTS = [
      '@fontsource/montserrat/600',
      '@fontsource/montserrat/700',
      '@fontsource/montserrat/800',
      '@fontsource/open-sans/400',
      '@fontsource/open-sans/600',
      '@fontsource/open-sans/700',
      '@fontsource/open-sans/400-italic',
    ];
    for (const imp of FONT_IMPORTS) {
      it(`imports ${imp}.css`, () => {
        const css = readGlobalsCss();
        expect(css).toMatch(new RegExp(imp.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')));
      });
    }
    it('does NOT reference jsdelivr CDN', () => {
      const css = readGlobalsCss();
      expect(css).not.toMatch(/cdn\.jsdelivr\.net/);
    });
  });

  describe('Task 2.9 — Radio y sombras (ui-refactor: radio 0)', () => {
    it('declares --radius: 0 (flat design estricto, ángulos rectos)', () => {
      const theme = extractThemeBlock(readGlobalsCss());
      expect(theme).toMatch(/--radius\s*:\s*0(px)?\b/);
    });
    it('declares --shadow-1..5 with exact rgba values', () => {
      const theme = extractThemeBlock(readGlobalsCss());
      expect(theme).toMatch(/--shadow-1\s*:\s*0\s+1px\s+2px\s+rgba\(22\s*,\s*32\s*,\s*46\s*,\s*\.06\)/i);
      expect(theme).toMatch(/--shadow-2\s*:\s*0\s+2px\s+6px\s+rgba\(22\s*,\s*32\s*,\s*46\s*,\s*\.08\)/i);
      expect(theme).toMatch(/--shadow-3\s*:\s*0\s+4px\s+12px\s+rgba\(22\s*,\s*32\s*,\s*46\s*,\s*\.10\)/i);
      expect(theme).toMatch(/--shadow-4\s*:\s*0\s+8px\s+20px\s+rgba\(22\s*,\s*32\s*,\s*46\s*,\s*\.12\)/i);
      expect(theme).toMatch(/--shadow-5\s*:\s*0\s+12px\s+28px\s+rgba\(22\s*,\s*32\s*,\s*46\s*,\s*\.14\)/i);
    });
  });

  describe('Task 2.11 — No obsolete brand-* tokens', () => {
    const OBSOLETE = [
      'brand-navy',
      'brand-navy-light',
      'brand-orange',
      'brand-teal',
    ];
    for (const token of OBSOLETE) {
      it(`does NOT declare --color-${token}`, () => {
        const css = readGlobalsCss();
        expect(css).not.toMatch(new RegExp(`--color-${token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`));
      });
    }
  });
});

/**
 * ui-refactor task 2.1 (RED) — Flat design estricto con radio 0: ningún
 * componente base aplica la utility Tailwind `rounded` (ni variantes), porque
 * el token `--radius` es `0` y el flat cleanup remueve todas las esquinas
 * redondeadas. Source: openspec/changes/ui-refactor/specs/design-tokens/spec.md
 * (Requirement "Radio y sombras — flat design", scenario "Componentes base no
 * aplican utilidad rounded").
 */
const BASE_COMPONENTS = [
  'TopHeader.astro',
  'Header.astro',
  'SearchForm.astro',
  'HeroBanner.astro',
  'PanelHome.astro',
] as const;

// matches a Tailwind `rounded*` utility token inside a class string, using a
// leading boundary that tolerates the preceding class (space, quote, backtick,
// brace). Matches `rounded`, `rounded-sm`, `rounded-md`, `rounded-lg`,
// `rounded-xl`, `rounded-2xl`, `rounded-full`, `rounded-3xl`, etc., but NOT a
// non-utility token that merely contains the substring (e.g. a comment). The
// `class="..."` and `class:list={[...]}` attribute forms are both covered.
const ROUNDED_REGEX = /(?<=[\s"'`{])rounded(?:-(?:sm|md|lg|xl|2xl|3xl|full|t|b|l|r|tl|tr|bl|br|none))?(?=[\s"'`}])/;

function readComponentSource(name: string): string {
  const WEB_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
  const path = join(WEB_ROOT, 'src', 'components', name);
  return readFileSync(path, 'utf-8');
}

describe('ui-refactor — base components have no rounded* utility (flat radio 0)', () => {
  for (const name of BASE_COMPONENTS) {
    it(`${name} does not apply rounded* (and not rounded-none working state)`, () => {
      const src = readComponentSource(name);
      expect(
        src,
        `${name} must not apply any rounded* utility — flat design radio 0 (ui-refactor design-tokens spec)`,
      ).not.toMatch(ROUNDED_REGEX);
    });
  }
});
