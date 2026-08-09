import { expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import PilaresSection from '@/components/PilaresSection.astro';
import type { PilaresSectionProps } from '@/lib/types/pilares-section';
import { PILARES_SECTION_CONTENT } from '@/lib/config/pilares-section';

/**
 * Shared render/extraction helpers for the PilaresSection component tests.
 *
 * Extracted from `PilaresSection.test.ts` so the spec file stays under the
 * ESLint `max-lines` budget (400 lines, frontend-standards § Umbrales
 * Angular). The component is a dumb presentational component, so the renderer
 * only needs `PILARES_SECTION_CONTENT`; no mocks are required.
 */

/** Renders the component; defaults to the production content config. */
export async function renderPilaresSection(
  props: PilaresSectionProps = PILARES_SECTION_CONTENT,
): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(PilaresSection, {
    props: { ...props },
  });
  // Strip HTML comments so structural regex matches don't hit documentation
  // comments inside the rendered output (same pattern as DestacadosSection).
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

/** Extracts the opening `<section ...>` tag of the component. */
export function getSectionTag(html: string): string {
  const match = html.match(/<section[^>]*>/);
  if (!match) throw new Error('section tag not found');
  return match[0];
}

/** Extracts the whole left column HTML (first `relative z-10` wrapper subtree is too ambiguous; uses the primary-colored CTA as anchor). */
export function getLeftColumn(html: string): string {
  const start = html.indexOf('<span');
  if (start === -1) throw new Error('left column start not found');
  const ctaIndex = html.indexOf('bg-accent', start);
  if (ctaIndex === -1) throw new Error('left column CTA not found');
  return html.slice(start, ctaIndex + 200);
}

/** Extracts the whole right column start (from the right eyebrow onward, with enough headroom to include the column's opening `<div class="bg-primary-deep ...">`). */
export function getRightColumn(html: string): string {
  const idx = html.indexOf('Estándares de Calidad');
  if (idx === -1)
    throw new Error('right column eyebrow not found');
  return html.slice(idx - 250, idx + 3000);
}

/** Runs `fn` for each rendered pillar `<div>` item with its config pillar. */
export function forEachPillar(
  html: string,
  fn: (item: string, label: string, icon: string) => void,
): void {
  // Pillar items are the <div class="flex items-center gap-4"> wrappers
  // containing an <svg> icon + label span (design.md § Decision 7).
  const items =
    html.match(/<div[^>]*class="[^"]*flex items-center gap-4[^"]*"[^>]*>[\s\S]*?<\/div>/g) ??
    [];
  expect(items.length).toBeGreaterThanOrEqual(4);
  PILARES_SECTION_CONTENT.pillars.forEach((pillar, index) => {
    const item = items[index];
    if (!item) throw new Error(`pillar item ${index} not found`);
    fn(item, pillar.label, pillar.icon);
  });
}

/** Extracts every `<img ...>` opening tag from the rendered HTML. */
export function getBackgroundImages(html: string): string[] {
  const matches = html.match(/<img[^>]*>/g) ?? [];
  return matches;
}