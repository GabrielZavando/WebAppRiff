import { expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Footer from '@/components/Footer.astro';
import type { SiteFooterProps } from '@/lib/types/footer';
import { SITE_FOOTER_CONTENT } from '@/lib/config/footer';

/**
 * Shared render/extraction helpers for the Footer component tests.
 *
 * Extracted from `Footer.test.ts` so the spec file stays under the ESLint
 * `max-lines` budget (400 lines, frontend-standards § Umbrales). The
 * component is a dumb presentational component, so the renderer only needs
 * `SITE_FOOTER_CONTENT`; no mocks are required (social links come from the
 * env-driven config and are filtered by `getSocialLinks`).
 */

/** Renders the component; defaults to the production content config. */
export async function renderFooter(
  props: SiteFooterProps = SITE_FOOTER_CONTENT,
): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Footer, {
    props: { ...props },
  });
  // Strip HTML comments so structural regex matches don't hit documentation
  // comments inside the rendered output (same pattern as other sections).
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

/** Returns the rendered footer HTML stripped of comments (non-empty check). */
export function getFooterMarkup(html: string): string {
  expect(html.trim().startsWith('<footer')).toBe(true);
  return html;
}

/** Extracts each `<a ...>...</a>` anchor with its full tag for inspection. */
export function getAnchors(html: string): Array<{ tag: string; text: string }> {
  const matches = html.match(/<a\s[^>]*>[\s\S]*?<\/a>/g) ?? [];
  return matches.map((anchor) => {
    const tag = anchor.match(/<a\s[^>]*>/)?.[0] ?? '';
    const text = anchor.replace(/<a\s[^>]*>/, '').replace(/<\/a>/, '').trim();
    return { tag, text };
  });
}

/** Extracts the brand `<img>` tag (astro:assets renders an `<img>`). */
export function getBrandImage(html: string): string {
  const match = html.match(/<img[^>]*>/);
  if (!match) throw new Error('brand <img> not found');
  return match[0];
}

/** Extracts the scroll-to-top `<button ...>` opening tag. */
export function getScrollTopButton(html: string): string {
  const match = html.match(/<button[^>]*data-scroll-top[^>]*>/);
  if (!match) throw new Error('scroll-to-top <button> not found');
  return match[0];
}

/** Extracts the `@media (prefers-reduced-motion...)` style block if present. */
export function getStyleBlock(html: string): string {
  const match = html.match(/<style[^>]*>[\s\S]*?<\/style>/);
  return match?.[0] ?? '';
}