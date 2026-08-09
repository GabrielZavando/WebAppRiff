import { expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ServicesSection from '@/components/ServicesSection.astro';
import type { Service, ServicesSectionProps } from '@/lib/types/services-section';
import { SERVICES_SECTION_CONTENT } from '@/lib/config/services-section';

/**
 * Shared render/extraction helpers for the ServicesSection component tests.
 *
 * Extracted from `ServicesSection.test.ts` so the spec file stays under the
 * ESLint `max-lines` budget (400 lines, frontend-standards § Umbrales
 * Angular). The component is a dumb presentational component, so the renderer
 * only needs `SERVICES_SECTION_CONTENT`; no mocks are required.
 */

/** Renders the component; defaults to the production content config. */
export async function renderServicesSection(
  props: ServicesSectionProps = SERVICES_SECTION_CONTENT,
): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(ServicesSection, {
    props: { ...props },
  });
  // Strip HTML comments so structural regex matches don't hit documentation
  // comments inside the rendered output (same pattern as PanelHome.test.ts).
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

/** Runs `fn` for each of the 4 rendered card `<article>` elements with its config service. */
export function forEachCard(
  html: string,
  fn: (card: string, service: Service) => void,
): void {
  const cards = html.match(/<article[\s\S]*?<\/article>/g) ?? [];
  expect(cards).toHaveLength(4);
  cards.forEach((card, index) =>
    fn(card, SERVICES_SECTION_CONTENT.services[index]!),
  );
}

/** Extracts the opening `<a ...>` tag of a card CTA. */
export function getCardCta(card: string): string {
  const match = card.match(/<a\s[^>]*>/);
  if (!match) throw new Error('card CTA <a> not found');
  return match[0];
}

/** Extracts the bottom CTA `<div class="...text-center...">` wrapper after the grid. */
export function getBottomWrapper(html: string): string {
  const grid = html.match(/class="[^"]*grid-cols-1[^"]*md:grid-cols-2[^"]*"/);
  if (!grid) throw new Error('card grid not found');
  const afterGrid = html.slice(html.indexOf(grid[0]));
  const wrappers =
    afterGrid.match(
      /<div[^>]*class="[^"]*text-center[^"]*"[^>]*>[\s\S]*?<\/div>/g,
    ) ?? [];
  const wrapper = wrappers.find((d) => d.includes('<a'));
  if (!wrapper) throw new Error('bottom CTA wrapper not found');
  return wrapper;
}