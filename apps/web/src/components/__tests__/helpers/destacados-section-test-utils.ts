import { expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import DestacadosSection from '@/components/DestacadosSection.astro';
import type {
  FeaturedProduct,
  DestacadosSectionProps,
} from '@/lib/types/destacados-section';
import { DESTACADOS_SECTION_CONTENT } from '@/lib/config/destacados-section';

/**
 * Shared render/extraction helpers for the DestacadosSection component tests.
 *
 * Extracted from `DestacadosSection.test.ts` so the spec file stays under the
 * ESLint `max-lines` budget (400 lines, frontend-standards § Umbrales
 * Angular). The component is a dumb presentational component, so the renderer
 * needs the header copy plus a LOCAL fixture of featured cards — since
 * `home-featured-products-grid` the production cards come from the backend
 * featured catalog (the page applies the 8-card cap), so tests render against
 * a remote-URL fixture instead of `FEATURED_PRODUCTS`.
 */

/**
 * Local featured-card fixture (4 cards, backend-shaped after mapping).
 *
 * Each `imageUrl` is a remote Storage-like URL; `imagenAlt` describes the
 * photo and differs from the title (alt contract). Extend with `featured()`
 * when a test needs 5..8 cards.
 */
export const SAMPLE_FEATURED: readonly FeaturedProduct[] = [
  {
    id: 'antiincrustante-bimaks-420-para-osmosis-inversa-agua-salobre',
    titulo: 'Antiincrustante Bimaks 420 para Ósmosis Inversa (Agua Salobre)',
    slug: 'antiincrustante-bimaks-420-para-osmosis-inversa-agua-salobre',
    imageUrl: 'https://storage.googleapis.com/riff/antiincrustante-bimaks-420.webp',
    imagenAlt: 'Bidón azul de antiincrustante Bimaks 420 para ósmosis inversa',
  },
  {
    id: 'medidor-electromagnetico-fullmag-ha',
    titulo: 'Medidor Electromagnético Fullmag HA',
    slug: 'medidor-electromagnetico-fullmag-ha',
    imageUrl: 'https://storage.googleapis.com/riff/fullmag-ha.webp',
    imagenAlt: 'Medidor electromagnético Fullmag HA sobre fondo blanco',
  },
  {
    id: 'medidor-ultrasonico-doppler-portatil-fullsonic-no-invasivo',
    titulo: 'Medidor Ultrasónico Doppler Portátil Fullsonic (No Invasivo)',
    slug: 'medidor-ultrasonico-doppler-portatil-fullsonic-no-invasivo',
    imageUrl: 'https://storage.googleapis.com/riff/fullsonic-doppler.webp',
    imagenAlt: 'Medidor ultrasónico Doppler portátil Fullsonic no invasivo',
  },
  {
    id: 'medidor-de-flujo-riff-turbine-pro',
    titulo: 'Medidor de Flujo Riff Turbine Pro',
    slug: 'medidor-de-flujo-riff-turbine-pro',
    imageUrl: 'https://storage.googleapis.com/riff/riff-turbine-pro.webp',
    imagenAlt: 'Medidor mecánico tipo turbina Riff Turbine Pro',
  },
];

/** Builds a featured-card fixture list of arbitrary size (backend order). */
export function featuredArticles(count: number): FeaturedProduct[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `destacado-${i}`,
    titulo: `Destacado ${i}`,
    slug: `destacado-${i}`,
    imageUrl: `https://storage.googleapis.com/riff/destacado-${i}.webp`,
    imagenAlt: `Imagen del destacado ${i}`,
  }));
}

/** Default props: header copy + the 4-card fixture. */
export const DEFAULT_PROPS: DestacadosSectionProps = {
  ...DESTACADOS_SECTION_CONTENT,
  products: SAMPLE_FEATURED,
};

/** Renders the component; defaults to header copy + the 4-card fixture. */
export async function renderDestacadosSection(
  props: DestacadosSectionProps = DEFAULT_PROPS,
): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(DestacadosSection, {
    props: { ...props },
  });
  // Strip HTML comments so structural regex matches don't hit documentation
  // comments inside the rendered output (same pattern as ServicesSection).
  return stripHtmlComments(html);
}

/** Removes `<!-- ... -->` comments from a rendered HTML string. */
export function stripHtmlComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

/** Counts non-overlapping occurrences of `needle` in `haystack`. */
export function countOccurrences(haystack: string, needle: string): number {
  if (needle === '') return 0;
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count += 1;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

/** Escapes regex special chars so titles/descriptions match literally. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Runs `fn` for each of the rendered card `<article>` elements with its model. */
export function forEachCard(
  html: string,
  fn: (card: string, product: FeaturedProduct) => void,
  products: readonly FeaturedProduct[] = SAMPLE_FEATURED,
): void {
  const cards = html.match(/<article[\s\S]*?<\/article>/g) ?? [];
  expect(cards).toHaveLength(products.length);
  cards.forEach((card, index) => fn(card, products[index]!));
}

/** Extracts the opening `<a ...>` tag of a card CTA. */
export function getCardCta(card: string): string {
  const match = card.match(/<a\s[^>]*>/);
  if (!match) throw new Error('card CTA <a> not found');
  return match[0];
}

/** Extracts the opening `<a ...>` tag of the header row CTA. */
export function getHeaderCta(html: string): string {
  const match = html.match(/<a\s[^>]*>/);
  if (!match) throw new Error('header CTA <a> not found');
  return match[0];
}
