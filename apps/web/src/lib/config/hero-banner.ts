import type { HeroBannerProps } from '@/lib/types/hero-banner';

/**
 * Hardcoded content for the home page hero banner.
 *
 * Lives in `lib/config/` so the page (`apps/web/src/pages/index.astro`) can
 * spread it onto `<HeroBanner {...HERO_BANNER_CONTENT} />` without the
 * component itself needing to know the marketing copy. Keeping it hardcoded
 * is consistent with `NAVIGATION_ITEMS` (header) and `CATEGORY_OPTIONS`
 * (search-form): as the site is SSG, any change requires a rebuild anyway.
 * The future change `contentful-from-cms` will replace this with content
 * injected via props without touching the component.
 */
export const HERO_BANNER_CONTENT: Readonly<HeroBannerProps> = {
  headline: 'Innovación que Fluye',
  highlightedWord: 'Fluye',
  subtitle:
    'Experiencia, tecnología y control en medición de fluidos y tratamientos de agua.',
  description:
    'Desarrollamos soluciones para la medición, control y tratamiento de agua, integrando equipos, soporte técnico y ejecución en terreno.',
  ctas: [
    { label: 'VER SERVICIOS', href: '/servicios', variant: 'primary' },
    { label: 'ESCRÍBENOS', href: '/contacto', variant: 'secondary' },
  ],
};

/**
 * Splits a hero headline into the text before the first occurrence of the
 * highlighted word and the text after it, so the `<h1>` in `HeroBanner.astro`
 * can wrap the highlighted word in a `<span class="text-brand-teal">`.
 *
 * Rules:
 * - Only the FIRST occurrence of `highlightedWord` is used as the split
 *   point. Subsequent occurrences remain inside the `after` part so they are
 *   rendered as plain text (multiple highlights are not supported in this
 *   change).
 * - When `highlightedWord` is the empty string, the original headline is
 *   returned as `before` and `after` is empty (no span is rendered).
 * - When `highlightedWord` does not appear in `headline`, the original
 *   headline is returned as `before` and `after` is empty (no span is
 *   rendered).
 * - When `highlightedWord` appears at the start, `before` is the empty
 *   string. When it appears at the end, `after` is the empty string.
 *
 * Pure helper (no IO): testable without mounting any component. Extracted
 * from the `.astro` frontmatter per frontend-standards § "Frontmatter sin
 * lógica de negocio no trivial".
 */
export function splitHeadline(
  headline: string,
  highlightedWord: string,
): readonly [string, string] {
  // Empty highlightedWord must not match position 0 of the headline; the
  // expected return is the original headline with no split.
  if (highlightedWord === '') {
    return [headline, ''] as const;
  }

  const index = headline.indexOf(highlightedWord);
  if (index === -1) {
    return [headline, ''] as const;
  }

  const before = headline.slice(0, index);
  // Skip exactly one occurrence: the rest of the string (including any
  // further occurrences of `highlightedWord`) becomes `after`.
  const after = headline.slice(index + highlightedWord.length);
  return [before, after] as const;
}
