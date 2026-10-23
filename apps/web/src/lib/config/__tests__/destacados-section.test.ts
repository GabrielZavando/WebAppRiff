import { describe, it, expect, expectTypeOf } from 'vitest';
import { DESTACADOS_SECTION_CONTENT } from '@/lib/config/destacados-section';

/**
 * Header copy contract for the home "featured products" section.
 *
 * Since `home-featured-products-grid` the cards come from the backend
 * featured catalog (capped at 8 by the home page); the config constant only
 * carries the section header copy. `FEATURED_PRODUCTS` and the local
 * `assets/img` imports were removed — see the delta spec of
 * `openspec/changes/home-featured-products-grid`.
 */
describe('DESTACADOS_SECTION_CONTENT', () => {
  it('carries only the header copy: headline, ctaText, ctaHref', () => {
    expect(Object.keys(DESTACADOS_SECTION_CONTENT).sort()).toEqual([
      'ctaHref',
      'ctaText',
      'headline',
    ]);
    expect(DESTACADOS_SECTION_CONTENT.headline).toBe('Soluciones Destacadas');
    expect(DESTACADOS_SECTION_CONTENT.ctaText).toBe(
      'EXPLORAR CATÁLOGO COMPLETO',
    );
    expect(DESTACADOS_SECTION_CONTENT.ctaHref).toBe('/productos');
  });

  it('does NOT expose a products array (cards are panel-driven now)', () => {
    expect(DESTACADOS_SECTION_CONTENT).not.toHaveProperty('products');
  });

  it('is typed as the header copy subset of DestacadosSectionProps', () => {
    expectTypeOf(DESTACADOS_SECTION_CONTENT).toEqualTypeOf<
      Readonly<
        Pick<
          import('@/lib/types/destacados-section').DestacadosSectionProps,
          'headline' | 'ctaText' | 'ctaHref'
        >
      >
    >();
  });
});
