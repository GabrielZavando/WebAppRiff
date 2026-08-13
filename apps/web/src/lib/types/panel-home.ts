/**
 * Types shared by the home page "about / trust signals" panel.
 *
 * The panel is a presentational (dumb) component: it receives all its data
 * through props, so these interfaces are the contract between the page (which
 * owns the configuration via `PANEL_HOME_CONTENT`) and `PanelHome.astro`
 * (which only renders).
 *
 * `PanelCta` intentionally mirrors the shape of `HeroCta` from
 * `lib/types/hero-banner.ts` but lives in its own file to avoid coupling
 * across changes: if `HeroCta` evolves in a future change (e.g. adds a
 * `subRoute` or `formTarget` field for the hero), `PanelCta` must not break.
 * See design.md § Decision 9 for the rationale.
 */

/**
 * A single statistic rendered in the 2×2 grid on the right half of the panel.
 *
 * The `value` is the prominent figure (e.g. "40+", "30.000+"); the `label` is
 * the small uppercase caption beneath it (e.g. "AÑOS DE EXPERIENCIA EN LA
 * INDUSTRIA"). Neither field is rendered as a heading: the panel headline
 * carries the only `<h2>` of the panel, and the stats are plain `<div>`/
 * `<p>` content (see design.md § Decision 7).
 */
export interface PanelStat {
  /** Prominent figure, e.g. "40+" or "30.000+". */
  readonly value: string;
  /** Short uppercase caption, e.g. "AÑOS DE EXPERIENCIA EN LA INDUSTRIA". */
  readonly label: string;
  /**
   * Integer target for the count-up animation (e.g. 40 for "40+", 30000 for
   * "30.000+"). Kept separate from `value` so the animation can interpolate
   * numerically without parsing the formatted display string (es-ES thousands
   * separator + "+" suffix). See design.md Decision 4.
   */
  readonly numericValue: number;
}

/**
 * A call-to-action rendered as an `<a>` inside the left half of the panel.
 *
 * The `variant` controls the visual treatment: `primary` uses the
 * `--color-secondary` (navy `#1F2D40`) background token (filled solid,
 * contrasts with the primary teal background of the left half); `secondary`
 * is reserved for future use and not consumed by `PanelHome.astro` in this
 * change (the panel only renders one CTA). See design.md § Decision 5 for the
 * navy-on-teal rationale.
 */
export interface PanelCta {
  /** Visible label, e.g. "SOLICITAR ASESORÍA TÉCNICA". */
  readonly label: string;
  /** Destination path, e.g. "/contacto". */
  readonly href: string;
  /** Visual variant: filled navy (primary) or reserved future variant. */
  readonly variant: 'primary' | 'secondary';
}

/**
 * Props accepted by `PanelHome.astro`.
 *
 * The panel composes two halves:
 *   - Left half (teal background): `eyebrow`, `headline` (rendered as `<h2>`),
 *     `description` and a single `cta`.
 *   - Right half (white background): `stats` rendered in a 2×2 grid.
 *
 * The panel is rendered after the `HeroBanner` in `apps/web/src/pages/index.astro`
 * and visually overlaps it via a negative `margin-top` (see design.md § Decision 4).
 */
export interface PanelHomeProps {
  /** Uppercase eyebrow above the headline, e.g. "DESDE 1979". Not a heading. */
  readonly eyebrow: string;
  /** The panel headline, rendered as `<h2>` (the hero owns the only `<h1>`). */
  readonly headline: string;
  /** Description paragraph rendered with reduced opacity and constrained width. */
  readonly description: string;
  /** Single call-to-action anchor (navy on teal background). */
  readonly cta: PanelCta;
  /** Exactly four stats rendered in the 2×2 right grid, in render order. */
  readonly stats: readonly PanelStat[];
}
