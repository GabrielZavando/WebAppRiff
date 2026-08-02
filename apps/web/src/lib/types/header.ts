/**
 * Types shared by the main site header.
 *
 * The header is a presentational (dumb) component: it receives all its data
 * through props, so these interfaces are the contract between the layout
 * (which owns the configuration) and `Header.astro` (which only renders).
 */

/** A single navigation item rendered in the main menu. */
export interface NavItem {
  /** Visible label, e.g. "Inicio". */
  readonly label: string;
  /** Destination path, e.g. "/nosotros". */
  readonly href: string;
}

/** Call-to-action button rendered on the right side of the header. */
export interface CtaConfig {
  /** Button text, e.g. "SOLICITAR COTIZACIÓN". */
  readonly label: string;
  /** Destination: internal route or external URL. */
  readonly href: string;
}

/** Props accepted by `Header.astro`. */
export interface HeaderProps {
  /** Navigation items, in render order. */
  readonly items: readonly NavItem[];
  /** Current path used to mark the active item (`Astro.url.pathname`). */
  readonly activePath: string;
  /** Quote CTA label and destination. */
  readonly cta: CtaConfig;
  /**
   * Alt text for the brand logo. Optional so the header renders even before
   * the real logo asset is provided; the component falls back to "Riff".
   */
  readonly logoAlt?: string;
}
