import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import NosotrosTeamSection from '@/components/NosotrosTeamSection.astro';
import type { NosotrosTeamSectionProps } from '@/lib/types/nosotros-team-section';
import { NOSOTROS_TEAM_SECTION_CONTENT } from '@/lib/config/nosotros-team-section';

/**
 * Shared render/extraction helpers for the NosotrosTeamSection component
 * tests.
 *
 * Extracted from `NosotrosTeamSection.test.ts` so the spec file stays under
 * the ESLint `max-lines` budget (400 lines, frontend-standards § Umbrales).
 * The component is a dumb presentational component, so the renderer only
 * needs `NOSOTROS_TEAM_SECTION_CONTENT`; no mocks are required.
 */

/** Renders the component; defaults to the production content config. */
export async function renderNosotrosTeamSection(
  props: NosotrosTeamSectionProps = NOSOTROS_TEAM_SECTION_CONTENT,
): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(NosotrosTeamSection, {
    props: { ...props },
  });
  // Strip HTML comments so structural regex matches don't hit documentation
  // comments inside the rendered output (same pattern as PilaresSection).
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

/**
 * Extracts every member card block (the `<article>` wrappers) from the
 * rendered HTML. Cards are the `relative overflow-hidden group` containers.
 */
export function getMemberCards(html: string): string[] {
  const matches =
    html.match(
      /<article[^>]*class="[^"]*relative[^"]*overflow-hidden[^"]*"[^>]*>[\s\S]*?<\/article>/g,
    ) ?? [];
  return matches;
}

/**
 * Extracts every gradient overlay `<div>` (the `bg-linear-to-b` wrappers)
 * from the rendered HTML. POST-APPLY FIX #1: the overlay is a linear
 * vertical gradient (more transparent top, darker bottom), not a solid
 * `bg-secondary/80`.
 */
export function getGradientOverlays(html: string): string[] {
  return (
    html.match(/<div[^>]*class="[^"]*bg-linear-to-b[^"]*"[^>]*>/g) ?? []
  );
}

/** Extracts every `<img ...>` opening tag from the rendered HTML. */
export function getMemberImages(html: string): string[] {
  return html.match(/<img[^>]*>/g) ?? [];
}