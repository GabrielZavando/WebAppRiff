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
 * - § Decision 9 / 10: each card has a per-card CTA and there is an extra
 *   centered "Ver todos los servicios" bottom CTA; both CTAs share the same
 *   `cta` block (label + href) in this MVP. Per-service detail routes are
 *   future work, but `slug` is already part of the contract so no breaking
 *   change will be needed.
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
 * `href` defaults to the generic `/servicios` page in this change; the
 * per-service detail routes `/servicios/{slug}` are future work, but `slug`
 * is already part of the contract so no breaking change will be needed
 * (design.md § Trade-offs).
 *
 * `ctaLabel` is the per-card CTA text ("Ver detalles") — distinct from the
 * bottom CTA label "Ver todos los servicios" (POST-APPLY UPDATE, design.md
 * § Decision 9 / Sub-decision 9a superseded).
 */
export interface Service {
  /** Kebab-case slug, e.g. "medicion-en-edificios". Reserved for detail routes. */
  readonly slug: string;
  /** Card title, e.g. "Medición en Edificios", rendered as `<h4>`. */
  readonly title: string;
  /** Short description rendered under the title. */
  readonly description: string;
  /** Image metadata from `import ... from '@/assets/img/...'`. */
  readonly image: ImageMetadata;
  /** Descriptive alt text (not a repeat of `title`). */
  readonly imageAlt: string;
  /** Destination of the card CTA link, e.g. `/servicios`. */
  readonly href: string;
  /** Per-card CTA visible text, e.g. "Ver detalles". */
  readonly ctaLabel: string;
}

/**
 * CTA button rendered both per-card (smaller, `px-6 py-3 text-xs`) and once
 * below the grid (larger, `px-8 py-4 text-sm`), both pointing to `/servicios`
 * in this MVP (design.md § Decisions 9, 10).
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
  /** Shared CTA for the per-card buttons and the bottom centered button. */
  readonly cta: ServicesSectionCta;
}
