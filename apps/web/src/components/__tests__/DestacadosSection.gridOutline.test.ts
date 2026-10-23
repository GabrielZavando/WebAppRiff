import { describe, it, expect } from 'vitest';
import type { DestacadosSectionProps } from '@/lib/types/destacados-section';
import {
  renderDestacadosSection as render,
  countOccurrences,
  DEFAULT_PROPS,
  featuredArticles,
} from './helpers/destacados-section-test-utils';

/**
 * Grid flow & dynamic heading outline for 0..8 featured cards (change
 * `home-featured-products-grid`).
 *
 * The grid classes are FIXED (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
 * with `gap-6 md:gap-8`): CSS Grid auto-placement flows 5..8 cards into a
 * second row on desktop (4 per row) without conditional row classes. The
 * heading outline is dynamic: exactly 1 <h3> and N <h4>, where N is the
 * products length (0..8 after the page cap).
 *
 * Viewport-level row placement itself is not asserted here: the DOM
 * contract is (a) the fixed utility classes and (b) no conditional row
 * rules — the browser does the flow (spec scenario "Grid fluye a segunda
 * fila con 5 a 8 productos").
 */

describe('DestacadosSection — grid invariants across 0..8 cards', () => {
  it.each([0, 1, 4, 5, 8])(
    'renders the same fixed grid classes with N=%i cards',
    async (n) => {
      const props: DestacadosSectionProps = {
        ...DEFAULT_PROPS,
        products: featuredArticles(n),
      };
      const html = await render(props);
      const gridMatch = html.match(
        /class="[^"]*grid-cols-1[^"]*sm:grid-cols-2[^"]*lg:grid-cols-4[^"]*"/,
      );
      if (!gridMatch) throw new Error('card grid not found');
      expect(gridMatch[0]).toContain('grid-cols-1');
      expect(gridMatch[0]).toContain('sm:grid-cols-2');
      expect(gridMatch[0]).toContain('lg:grid-cols-4');
      expect(gridMatch[0]).toContain('gap-6 md:gap-8');
      // Only ONE grid element and no conditional row/grid classes.
      expect(countOccurrences(html, 'grid-cols-')).toBe(3);
      expect(countOccurrences(html, 'lg:col-span-')).toBe(0);
      expect(countOccurrences(html, 'md:row-start-')).toBe(0);
    },
  );

  it.each([0, 1, 4, 5, 8])(
    'renders exactly N <article> cards with N=%i products',
    async (n) => {
      const props: DestacadosSectionProps = {
        ...DEFAULT_PROPS,
        products: featuredArticles(n),
      };
      const html = await render(props);
      expect(countOccurrences(html, '<article')).toBe(n);
    },
  );
});

describe('DestacadosSection — dynamic heading outline for 0..8 cards', () => {
  it.each([0, 1, 4, 5, 8])(
    'emits 1 <h3> and N <h4> with N=%i products (and no h1/h2)',
    async (n) => {
      const props: DestacadosSectionProps = {
        ...DEFAULT_PROPS,
        products: featuredArticles(n),
      };
      const html = await render(props);
      expect(countOccurrences(html, '<h3')).toBe(1);
      expect(countOccurrences(html, '<h4')).toBe(n);
      expect(html).not.toMatch(/<h1/);
      expect(html).not.toMatch(/<h2/);
    },
  );

  it('renders the empty-grid degradation: header intact, zero cards', async () => {
    const html = await render({ ...DEFAULT_PROPS, products: [] });
    expect(html).toContain('Soluciones Destacadas');
    expect(html).toContain('EXPLORAR CATÁLOGO COMPLETO');
    expect(countOccurrences(html, '<article')).toBe(0);
  });
});

describe('DestacadosSection — 8-card default cap fixtures stay flat-design', () => {
  it('keeps the same card aesthetic on every card of an 8-card grid', async () => {
    const props: DestacadosSectionProps = {
      ...DEFAULT_PROPS,
      products: featuredArticles(8),
    };
    const html = await render(props);
    const cards = html.match(/<article[\s\S]*?<\/article>/g) ?? [];
    expect(cards).toHaveLength(8);
    for (const card of cards) {
      expect(card).toContain('bg-white shadow-2 hover:shadow-4 transition-shadow');
      expect(card).toMatch(/<div class="p-4"/);
      expect(card).toMatch(/<h4[^>]*class="[^"]*line-clamp-3[^"]*"/);
    }
  });
});
