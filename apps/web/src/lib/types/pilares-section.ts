/**
 * Types shared by the home page "pillars of excellence" section.
 *
 * The pillars section is a presentational (dumb) component: it receives all
 * its data through props, so these interfaces are the contract between the
 * page (which owns the configuration via `PILARES_SECTION_CONTENT`) and
 * `PilaresSection.astro` (which only renders).
 *
 * See `openspec/changes/pilares-section/design.md` for the rationale:
 * § Decision 1 (dumb component), § Decision 4 (heading hierarchy:
 * left column `<h2>` + right column `<h3>`) and § Decision 5
 * (`PilarIconName` is a closed union, NOT a free `string`: a typo like
 * `'recicle'` breaks at compile time instead of rendering an empty icon at
 * runtime — same rationale as `SolutionIconName`, consumed via `astro-icon`
 * as `lucide:<name>`).
 */

import type { ImageMetadata } from 'astro';

/**
 * The closed set of Lucide icon names a pillar item may use.
 *
 * Each name is verified to exist in the installed `@iconify-json/lucide`
 * set. Consumed by `PilaresSection.astro` via
 * `<Icon name={`lucide:${pilar.icon}`} />`. Extending this union (e.g.
 * adding a 5th pillar or swapping an icon) is a single-file change
 * (design.md § Decision 5).
 */
export type PilarIconName =
  | 'recycle' /* Sostenibilidad */
  | 'clock' /* Proyectos a tiempo */
  | 'monitor' /* Tecnología de Vanguardia */
  | 'headphones'; /* Soporte Técnico Especializado */

/**
 * A single pillar item rendered in the right column list.
 *
 * `label` is the human-readable pillar name (e.g. "Sostenibilidad"),
 * rendered next to the decorative Lucide `icon` (accent colored,
 * `aria-hidden="true"` — see design.md § Decision 7).
 */
export interface Pilar {
  /** Pillar display name, e.g. "Sostenibilidad". Rendered as a `<span>`. */
  readonly label: string;
  /** Lucide icon name for the pillar, restricted to `PilarIconName`. */
  readonly icon: PilarIconName;
}

/**
 * The call-to-action definition of the left column.
 *
 * `label` is the button text (e.g. "HABLEMOS DE TU PROYECTO").
 * `href` is the destination route; `/contacto` is a future route — the link
 * contract is set now so no breaking change is needed when the page lands
 * (same trade-off as `SolutionSection`'s `href`, see design.md § Risks).
 */
export interface PilaresCta {
  /** CTA button text, e.g. "HABLEMOS DE TU PROYECTO". */
  readonly label: string;
  /** CTA destination, e.g. "/contacto". */
  readonly href: string;
}

/**
 * Props accepted by `PilaresSection.astro`.
 *
 * The section composes two full-bleed columns: the left one holds the value
 * proposition copy (`eyebrow` + `headline` + `description` + `cta`) over the
 * `leftImage` background; the right one holds the pillars block
 * (`rightEyebrow` + `rightHeadline` + `rightDescription` + `pillars`) over a
 * solid `bg-primary-deep` background (POST-APPLY FIX #2 2026-08-09: the
 * right column dropped `rightImage`/`rightImageAlt` when the client replaced
 * the `planta-tratamiento-ecologica.webp` photo with the flat #006874 color —
 * design.md § Decision 3). All fields are readonly so the config constant
 * can be safely shared.
 */
export interface PilaresSectionProps {
  /** Uppercase eyebrow above the left headline, e.g. "Sostenibilidad y Eficiencia". Not a heading. */
  readonly eyebrow: string;
  /** Left column headline, e.g. "Comprometidos con la Optimización de Recursos", rendered as `<h2>`. */
  readonly headline: string;
  /** Left column description paragraph (white, 80% opacity). */
  readonly description: string;
  /** Left column call-to-action (solid accent button). */
  readonly cta: PilaresCta;
  /** Uppercase eyebrow above the right headline, e.g. "Estándares de Calidad". Not a heading. */
  readonly rightEyebrow: string;
  /** Right column headline, e.g. "Nuestros Pilares de Excelencia", rendered as `<h3>`. */
  readonly rightHeadline: string;
  /** Right column description paragraph (white, 80% opacity). */
  readonly rightDescription: string;
  /** Pillar items in render order; exactly 4 in the home config. */
  readonly pillars: readonly Pilar[];
  /** Left column background image, imported from `sostenibilidad-edificios.jpg`. */
  readonly leftImage: ImageMetadata;
  /** Descriptive alt text for the left background image (not the headline). */
  readonly leftImageAlt: string;
}