/**
 * Types shared by the home page hero banner.
 *
 * The hero banner is a presentational (dumb) component: it receives all its
 * data through props, so these interfaces are the contract between the page
 * (which owns the configuration via `HERO_BANNER_CONTENT`) and
 * `HeroBanner.astro` (which only renders).
 */

/**
 * A call-to-action rendered as an `<a>` inside the hero.
 *
 * The `variant` controls the visual treatment: `primary` uses the
 * `--color-primary` (`#41B3C4`) background token, `secondary` uses a white
 * border with no fill.
 */
export interface HeroCta {
  /** Visible label, e.g. "VER SERVICIOS". */
  readonly label: string;
  /** Destination path, e.g. "/servicios". */
  readonly href: string;
  /** Visual variant: filled primary teal (primary) or outlined white (secondary). */
  readonly variant: 'primary' | 'secondary';
}

/**
 * A single statistic rendered in the stats strip below the hero.
 *
 * Reserved for the future change `stats-strip`; the `HeroBanner` component
 * accepts an optional `stats` array on its props but does NOT render it in
 * this change. Defining the type now avoids a breaking change in the props
 * contract later.
 */
export interface HeroStat {
  /** Short label, e.g. "DESDE". */
  readonly label: string;
  /** Visible value, e.g. "1979" or "40+". */
  readonly value: string;
}

/** Props accepted by `HeroBanner.astro`. */
export interface HeroBannerProps {
  /** Full headline text; the `highlightedWord` substring is rendered in primary teal. */
  readonly headline: string;
  /** Substring of `headline` wrapped in a `<span class="text-primary">`. */
  readonly highlightedWord: string;
  /** Subtitle rendered as `<h2>` subordinate to the headline `<h1>`. */
  readonly subtitle: string;
  /** Description paragraph rendered with reduced opacity. */
  readonly description: string;
  /** Call-to-action links in render order (primary first, secondary second). */
  readonly ctas: readonly HeroCta[];
  /**
   * Optional statistics strip; not rendered by `HeroBanner` in this change.
   * Reserved for the future change `stats-strip`.
   */
  readonly stats?: readonly HeroStat[];
}
