/**
 * Types shared by the home page "specialized services" section.
 *
 * The services section is a presentational (dumb) component: it receives all
 * its data through props, so these interfaces are the contract between the
 * page (which owns the configuration via `SERVICES_SECTION_CONTENT`) and
 * `ServicesSection.astro` (which only renders).
 *
 * See `openspec/changes/services-section/design.md`:
 * - § Decision 2: three-file architecture (types / config / component).
 * - § Decision 11: `Service` does NOT carry an `icon` field — unlike `Solution`
 *   (which has `SolutionIconName` for a `bg-primary` badge), the services card
 *   has no badge icon. The only icon used is the decorative `lucide:arrow-right`
 *   inside the CTA, hardcoded in the component (no `ServiceIconName` union
 *   needed yet).
 * - § Decision 9 / 10: each card has a per-card CTA (label from `ctaLabel`,
 *   target derived from `slug` as `/servicios#{slug}`) and there is an extra
 *   centered "Ver todos los servicios" bottom CTA (the shared `cta` block).
 *   Per-service detail routes are future work, but `slug` is already part of
 *   the contract so no breaking change will be needed.
 */

import type { ImageMetadata } from 'astro';

/**
 * A single service card rendered in the responsive 2x2 grid.
 *
 * `image` is an `ImageMetadata` produced by importing from
 * `apps/web/src/assets/img/` (the `image-assets` convention: every optimizable
 * site image lives under `assets/img/` and is consumed via `astro:assets`).
 * `imageAlt` is the descriptive alternative text (NOT the card title — the
 * alt describes what the photo shows, see frontend-standards § "Imágenes del
 * sitio"). The image is rendered full-color (POST-APPLY UPDATE: the grayscale
 * filter was removed per client request, see design.md § Decision 8).
 *
 * The per-card CTA target is derived from `slug` as `/servicios#{slug}` (the
 * scroll anchor of the matching card on /servicios); the redundant generic
 * `href` field was removed — `slug` is the single source of truth for the CTA
 * destination (design.md § Decision 3).
 *
 * `ctaLabel` is the per-card CTA text ("Ver detalles") — distinct from the
 * bottom CTA label "Ver todos los servicios" (POST-APPLY UPDATE, design.md
 * § Decision 9 / Sub-decision 9a superseded).
 */
export interface Service {
  /** Kebab-case slug, e.g. "medicion-en-edificios"; the card CTA targets the /servicios scroll anchor `/servicios#{slug}`. */
  readonly slug: string;
  /** Card title, e.g. "Medición en Edificios", rendered as `<h4>`. */
  readonly title: string;
  /** Short description rendered under the title. */
  readonly description: string;
  /** Image metadata from `import ... from '@/assets/img/...'`. */
  readonly image: ImageMetadata;
  /** Descriptive alt text (not a repeat of `title`). */
  readonly imageAlt: string;
  /** Per-card CTA visible text, e.g. "Ver detalles". */
  readonly ctaLabel: string;
}

/**
 * Bottom CTA rendered once below the grid ("Ver todos los servicios", larger,
 * `px-8 py-4 text-sm`), pointing to `/servicios`. The per-card CTAs are NOT
 * part of this block: their label comes from `Service.ctaLabel` and their
 * target derives from `Service.slug` as `/servicios#{slug}` (design.md
 * § Decisions 9, 10).
 */
export interface ServicesSectionCta {
  /** Button label, e.g. "Ver todos los servicios". */
  readonly label: string;
  /** Destination URL, e.g. `/servicios`. */
  readonly href: string;
}

/**
 * Props accepted by `ServicesSection.astro`.
 *
 * The section composes a centered header (`headline` + `description`, no
 * eyebrow, no teal underline — see design.md § Decision 4), a 2x2 responsive
 * grid of `services` cards (mobile-first, see § Decision 7) and a centered
 * bottom CTA. All fields are readonly so the config constant can be safely
 * shared across consumers without risk of mutation.
 */
export interface ServicesSectionProps {
  /** The section headline, rendered as `<h3>` (subordinate to PanelHome `<h2>`). */
  readonly headline: string;
  /** Description paragraph rendered below the headline (muted, max-w-2xl). */
  readonly description: string;
  /** Service cards in render order; exactly 4 in the home config. */
  readonly services: readonly Service[];
  /** Bottom CTA ("Ver todos los servicios"); per-card CTAs derive their label and target from `Service.ctaLabel` + `Service.slug`. */
  readonly cta: ServicesSectionCta;
}
