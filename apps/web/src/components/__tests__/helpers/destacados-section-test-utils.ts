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
 * only needs `DESTACADOS_SECTION_CONTENT`; no mocks are required.
 */

/** Renders the component; defaults to the production content config. */
export async function renderDestacadosSection(
  props: DestacadosSectionProps = DESTACADOS_SECTION_CONTENT,
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

/** Runs `fn` for each of the rendered card `<article>` elements with its config product. */
export function forEachCard(
  html: string,
  fn: (card: string, product: FeaturedProduct) => void,
): void {
  const cards = html.match(/<article[\s\S]*?<\/article>/g) ?? [];
  expect(cards).toHaveLength(4);
  cards.forEach((card, index) =>
    fn(card, DESTACADOS_SECTION_CONTENT.products[index]!),
  );
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