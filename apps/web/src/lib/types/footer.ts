/**
 * Types shared by the public site footer.
 *
 * The footer is a presentational (dumb) component: it receives all its data
 * through props, so these interfaces are the contract between the layout
 * (which owns the configuration via `SITE_FOOTER_CONTENT`) and `Footer.astro`
 * (which only renders).
 *
 * All fields are `readonly` by project convention: content constants are
 * immutable by design, and the component never mutates its props.
 */

import type { SocialLink } from '@/lib/types/top-header';

/** A single link item rendered inside a footer link column. */
export interface FooterLink {
  /** Visible label, e.g. "Instalación de Medidores". */
  readonly label: string;
  /**
   * Destination. Currently a placeholder `"#"` — real routes are a future
   * change (see design.md § Decision 5).
   */
  readonly href: string;
}

/** A footer navigation column: title label + its list of links. */
export interface FooterColumn {
  /** Visible column title, e.g. "SERVICIOS". Rendered as a `<p>` label, NOT a heading. */
  readonly title: string;
  /** Links rendered under the title, in render order. */
  readonly links: readonly FooterLink[];
}

/** A single schedule row in the schedule column (default title "Horario de Atención"). */
export interface FooterScheduleEntry {
  /** Day range label, e.g. "Lunes a Jueves". */
  readonly days: string;
  /**
   * Hour blocks for the day range, in render order. One or more blocks are
   * allowed so a single day range can represent a split-shift schedule (e.g.
   * morning + afternoon). Previously a single `string`; widened to an array
   * in design.md § Decision 3.
   */
  readonly hours: readonly string[];
}

/** Props accepted by `Footer.astro`. */
export interface SiteFooterProps {
  /** Alt text for the brand logo image (falls back to "Riff" when empty). */
  readonly logoAlt: string;
  /** Brand tagline rendered under the logo. */
  readonly tagline: string;
  /**
   * Social network links, reusing the `SocialLink` contract from
   * `top-header` so the site has a single source of truth for the social
   * presence (design.md § Decision 4). Only configured URLs render.
   */
  readonly socialLinks: readonly SocialLink[];
  /** Link columns (SERVICIOS, EMPRESA), in render order. */
  readonly columns: readonly FooterColumn[];
  /**
   * Schedule column title, shown with the `uppercase` class. Currently
   * configured as "Horario de Atención" (renders "HORARIO DE ATENCIÓN").
   * Promoted to a typed prop so the component has no hardcoded column title,
   * matching the SERVICIOS/EMPRESA single-source-of-truth contract
   * (design.md § Decision 2). Previously hardcoded as "HORARIO TÉCNICO".
   */
  readonly scheduleTitle: string;
  /** Business hours rows, in render order. */
  readonly schedule: readonly FooterScheduleEntry[];
  /** Support note rendered under the schedule, e.g. "Soporte 24/7 disponible". */
  readonly scheduleNote: string;
}