import type { DestacadosSectionProps } from '@/lib/types/destacados-section';

/**
 * Hardcoded header copy for the home page "featured products" section.
 *
 * Since `home-featured-products-grid` the product CARDS are not hardcoded
 * anymore: the home page (`apps/web/src/pages/index.astro`) derives them at
 * build time from the backend featured catalog (`GET /api/v1/products?
 * destacado=true`, capped at 8) and passes them to `DestacadosSection` as
 * props. This constant only carries the section header copy, so the panel
 * (`destacado` flag) is the single source of truth for which products appear.
 *
 * See `openspec/changes/home-featured-products-grid/design.md` § Decision 3
 * and the delta spec of the same change for the full contract.
 */
export const DESTACADOS_SECTION_CONTENT: Readonly<
  Omit<DestacadosSectionProps, 'products'>
> = {
  headline: 'Soluciones Destacadas',
  ctaText: 'EXPLORAR CATÁLOGO COMPLETO',
  ctaHref: '/productos',
};
