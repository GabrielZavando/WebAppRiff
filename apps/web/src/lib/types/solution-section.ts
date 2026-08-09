/**
 * Types shared by the home page "solutions portfolio" section.
 *
 * The solution section is a presentational (dumb) component: it receives all
 * its data through props, so these interfaces are the contract between the
 * page (which owns the configuration via `SOLUTION_SECTION_CONTENT`) and
 * `SolutionSection.astro` (which only renders).
 *
 * See `openspec/changes/solution-section/design.md` § Decision 11 for the
 * rationale of `SolutionIconName` being a closed union (not a free `string`):
 * a typo like `'gauges'` breaks at compile time instead of rendering an empty
 * icon at runtime (consumed via `astro-icon` as `lucide:<name>`).
 */

import type { ImageMetadata } from 'astro';

/**
 * The closed set of Lucide icon names a solution card may use for its badge.
 *
 * Consumed by `SolutionSection.astro` via `<Icon name={`lucide:${solution.icon}`} />`.
 * Extending this union (e.g. adding a 5th solution) is a single-file change
 * (design.md § Decision 11).
 */
export type SolutionIconName =
  | 'gauge'
  | 'droplet'
  | 'flask-conical'
  | 'settings-2';

/**
 * A single portfolio card rendered in the responsive grid.
 *
 * `image` is an `ImageMetadata` produced by importing a WebP from
 * `apps/web/src/assets/img/` (the `image-assets` convention: every optimizable
 * site image lives under `assets/img/` and is consumed via `astro:assets`).
 * `imageAlt` is the descriptive alternative text (NOT the card title — the
 * alt describes what the photo shows, see frontend-standards § "Imágenes del
 * sitio").
 *
 * `href` defaults to the generic `/soluciones` page in this change; the
 * per-solution detail routes `/soluciones/{slug}` are future work
 * (`solution-detail-pages`), but `slug` is already part of the contract so no
 * breaking change will be needed (design.md § Trade-offs).
 */
export interface Solution {
  /** Kebab-case slug, e.g. "medicion-de-fluidos". Reserved for detail routes. */
  readonly slug: string;
  /** Card title, e.g. "Medición de Fluidos", rendered as `<h4>`. */
  readonly title: string;
  /** Short description rendered under the title (line-clamped). */
  readonly description: string;
  /** Image metadata from `import ... from '@/assets/img/...webp'`. */
  readonly image: ImageMetadata;
  /** Descriptive alt text (not a repeat of `title`). */
  readonly imageAlt: string;
  /** Lucide icon name for the badge, restricted to `SolutionIconName`. */
  readonly icon: SolutionIconName;
  /** Destination of the "SABER MÁS" link, e.g. `/soluciones`. */
  readonly href: string;
}

/**
 * Props accepted by `SolutionSection.astro`.
 *
 * The section composes a header (`eyebrow` + `headline` + teal underline +
 * `description`) and a responsive grid of `solutions` cards. All fields are
 * readonly so the config constant can be safely shared.
 */
export interface SolutionSectionProps {
  /** Uppercase eyebrow above the headline, e.g. "PORTAFOLIO". Not a heading. */
  readonly eyebrow: string;
  /** The section headline, rendered as `<h3>` (subordinate to PanelHome `<h2>`). */
  readonly headline: string;
  /** Description paragraph rendered in the header's right column. */
  readonly description: string;
  /** Portfolio cards in render order; exactly 4 in the home config. */
  readonly solutions: readonly Solution[];
}