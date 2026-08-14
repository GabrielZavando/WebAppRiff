import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Verifies the scrollbar styling block in `apps/web/src/styles/globals.css`.
 *
 * The scrollbar uses the existing `--color-secondary-dark` design token
 * (`#16202E`) and `--color-secondary-light` for the thumb + thumb:hover
 * states, with a transparent track — applied via both the standard
 * `scrollbar-color` property (Firefox) and the `::-webkit-scrollbar*`
 * pseudo-elements (Chromium / Safari).
 *
 * Source: openspec change `footer-credits-scrollbar`, specs/site-scrollbar/
 * spec.md. Frontend standards forbid raw hex literals outside `@theme`, so
 * the rules MUST consume the values as `var(--color-secondary-dark)` — never
 * the literal `#16202E`.
 */
function readGlobalsCss(): string {
  const path = fileURLToPath(
    new URL('../globals.css', import.meta.url),
  );
  return readFileSync(path, 'utf-8');
}

/** Extracts the contents of the `@layer base { ... }` block as a string. */
function extractBaseLayer(css: string): string {
  const startMatch = css.match(/@layer\s+base\s*\{/);
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

describe('site-scrollbar — globals.css @layer base', () => {
  const baseLayer = extractBaseLayer(readGlobalsCss());

  it('declares scrollbar-color on html with var(--color-secondary-dark) + transparent', () => {
    expect(baseLayer).toMatch(
      /scrollbar-color\s*:\s*var\(--color-secondary-dark\)\s+transparent/i,
    );
  });

  it('declares ::-webkit-scrollbar-thumb with var(--color-secondary-dark)', () => {
    expect(baseLayer).toMatch(
      /::-webkit-scrollbar-thumb\s*\{[^}]*background-color\s*:\s*var\(--color-secondary-dark\)/i,
    );
  });

  it('declares ::-webkit-scrollbar-thumb:hover with var(--color-secondary-light)', () => {
    expect(baseLayer).toMatch(
      /::-webkit-scrollbar-thumb:hover\s*\{[^}]*background-color\s*:\s*var\(--color-secondary-light\)/i,
    );
  });

  it('declares a transparent ::-webkit-scrollbar-track', () => {
    expect(baseLayer).toMatch(
      /::-webkit-scrollbar-track\s*\{[^}]*background\s*:\s*transparent/i,
    );
  });

  it('declares border-radius: 0 on the thumb (flat design radius-0)', () => {
    const thumbMatch = baseLayer.match(
      /::-webkit-scrollbar-thumb\s*\{([^}]*)\}/i,
    );
    if (!thumbMatch) throw new Error('::-webkit-scrollbar-thumb rule not found');
    expect(thumbMatch[1]).toMatch(/border-radius\s*:\s*0/i);
  });

  it('declares bounded width and height (8-16px) on ::-webkit-scrollbar', () => {
    const scrollBarMatch = baseLayer.match(
      /::-webkit-scrollbar\s*\{([^}]*)\}/i,
    );
    if (!scrollBarMatch || scrollBarMatch[1] === undefined) throw new Error('::-webkit-scrollbar rule not found');
    const body = scrollBarMatch[1];
    const widthMatch = body.match(/width\s*:\s*(\d+)px/i);
    const heightMatch = body.match(/height\s*:\s*(\d+)px/i);
    if (!widthMatch || widthMatch[1] === undefined) throw new Error('width not found on ::-webkit-scrollbar');
    if (!heightMatch || heightMatch[1] === undefined) throw new Error('height not found on ::-webkit-scrollbar');
    const width = parseInt(widthMatch[1], 10);
    const height = parseInt(heightMatch[1], 10);
    expect(width).toBeGreaterThanOrEqual(8);
    expect(width).toBeLessThanOrEqual(16);
    expect(height).toBeGreaterThanOrEqual(8);
    expect(height).toBeLessThanOrEqual(16);
  });

  it('the scrollbar rules do NOT contain the raw literal #16202E', () => {
    // Regression guard for frontend-standards § "no raw hex outside @theme".
    const baseLayerNoTheme = extractBaseLayer(readGlobalsCss());
    expect(baseLayerNoTheme).not.toMatch(/#16202E/i);
    expect(baseLayerNoTheme).not.toMatch(/#35445E/i);
  });
});
