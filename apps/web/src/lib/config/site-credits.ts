import type { SiteCreditsProps } from '@/lib/types/site-credits';

/**
 * Hardcoded content for the SiteCredits strip rendered below the site footer.
 *
 * Lives in `lib/config/` so `Layout.astro` can spread it onto
 * `<SiteCredits {...SITE_CREDITS_CONTENT} />` without the component needing
 * to know the attribution copy. Consistent with every other section config
 * (`SITE_FOOTER_CONTENT`, `SOLUTION_SECTION_CONTENT`, etc.): as the site is
 * SSG, any change requires a rebuild anyway.
 *
 * The link opens `gabrielzavando.cl` in a new tab (client decision,
 * openspec change `footer-credits-scrollbar`).
 */
export const SITE_CREDITS_CONTENT: Readonly<SiteCreditsProps> = {
  developerLabel: 'Diseñado y desarrollado por:',
  developerName: 'Gabriel Zavando',
  developerUrl: 'https://gabrielzavando.cl',
};
