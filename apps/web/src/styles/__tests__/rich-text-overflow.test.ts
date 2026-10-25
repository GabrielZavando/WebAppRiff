import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Guards the long-description containment rules in `globals.css`.
 *
 * Quill can emit long unbroken words/URLs and block elements. Without explicit
 * wrapping, those tokens overflow the content column and create horizontal
 * page scrolling. Source: openspec change `admin-quill-editor-and-limits`,
 * specs/product-detail-page/spec.md.
 */
function readGlobalsCss(): string {
  const path = fileURLToPath(new URL('../globals.css', import.meta.url));
  return readFileSync(path, 'utf-8');
}

function ruleBody(css: string, selector: RegExp): string {
  const match = css.match(selector);
  if (!match || match[1] === undefined) {
    throw new Error(`CSS rule not found: ${selector}`);
  }
  return match[1];
}

describe('rich-text overflow containment — globals.css', () => {
  const css = readGlobalsCss();

  it('declares overflow-wrap and word-break on .rich-text', () => {
    const body = ruleBody(css, /\.rich-text\s*\{([^}]*)\}/);
    expect(body).toMatch(/overflow-wrap\s*:\s*anywhere/i);
    expect(body).toMatch(/word-break\s*:\s*break-word/i);
  });

  it('binds direct children to the container width', () => {
    const body = ruleBody(css, /\.rich-text\s*>\s*\*\s*\{([^}]*)\}/);
    expect(body).toMatch(/max-width\s*:\s*100%/i);
  });
});
