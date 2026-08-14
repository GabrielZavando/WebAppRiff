/**
 * Types for the SiteCredits strip — the thin developer-attribution bar
 * rendered by `Layout.astro` directly below the global `site-footer`.
 *
 * The component is presentational (dumb): it receives all its data through
 * props, sourced from the `SITE_CREDITS_CONTENT` config constant. All fields
 * are `readonly` by project convention.
 */

/** Props accepted by `SiteCredits.astro`. */
export interface SiteCreditsProps {
  /** Prefix label, e.g. "Diseñado y desarrollado por:". */
  readonly developerLabel: string;
  /** Visible link text — the developer's name, e.g. "Gabriel Zavando". */
  readonly developerName: string;
  /** Absolute external URL for the developer's site, e.g. "https://gabrielzavando.cl". */
  readonly developerUrl: string;
}
