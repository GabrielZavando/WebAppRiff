/**
 * Types shared by the public `/servicios` page components.
 *
 * The services page is composed of presentational (dumb) components:
 * `ServicesHero.astro` and `ServiceCard.astro` receive all their data through
 * props, so these interfaces are the contract between the page
 * (`apps/web/src/pages/servicios.astro`, which owns the configuration via
 * `SERVICIOS_PAGE_CONTENT`) and the components (which only render).
 *
 * See `openspec/changes/servicios-page/design.md`:
 * - § Decision 1: dumb components + hardcoded config (site-wide pattern).
 * - § Decision 6: `number` is the 1-based index (01, 02…) rendered as a badge.
 * - § Decision 5: `intro`, `bullets` and `tags` are OPTIONAL. `intro` (lead
 *   paragraph) is used by cards 01/02/03; `bullets` (check-list) is used by all
 *   four cards (01 and 03 migrated to bullets in the post-apply text expansion);
 *   `tags` (pills) is still supported by the component but unused on /servicios
 *   after card 03 dropped it. The short `description` field was removed (post-
 *   apply): `intro` is now the only prose block on a card. The component must
 *   render each block only when present.
 * - § Decision 4: `imagePosition` is NOT part of the service data (it is a
 *   layout concern decided by the page); `ServiceCardProps` adds it on top of
 *   `ServicePageService`.
 *
 * All fields are `readonly` by project convention: content constants are
 * immutable by design, and the components never mutate their props.
 */

import type { ImageMetadata } from 'astro';

/**
 * A single service rendered as a card on the `/servicios` page.
 *
 * `image` is an `ImageMetadata` produced by importing from
 * `apps/web/src/assets/img/` (the `image-assets` convention: every optimizable
 * site image lives under `assets/img/` and is consumed via `astro:assets`).
 * `imageAlt` is the descriptive alternative text (NOT the card title — the alt
 * describes what the photo shows, see frontend-standards § "Imágenes del
 * sitio").
 *
 * `number` is the 1-based ordinal rendered as a two-digit badge ("01", "02"…).
 * `bullets` and `tags` are optional; when absent the card omits those blocks.
 */
export interface ServicePageService {
  /** 1-based ordinal, e.g. 1. Rendered as a two-digit badge ("01"). */
  readonly number: number;
  /** Sector label, e.g. "SECTOR INDUSTRIAL" (rendered uppercase primary). */
  readonly sector: string;
  /** Card title, e.g. "Medición Industrial", rendered as `<h2>`. */
  readonly title: string;
  /** Optional lead-in paragraph rendered above the `bullets` list (cards 01, 02,
   * 03). It is the only prose block on a card (the short `description` field was
   * removed, design.md § Decision 5). Introduces the service before the
   * check-list (e.g. "Nuestro servicio incluye:"). */
  readonly intro?: string;
  /** Image metadata from `import ... from '@/assets/img/...'`. */
  readonly image: ImageMetadata;
  /** Descriptive alt text (not a repeat of `title`). */
  readonly imageAlt: string;
  /** Optional bullet points rendered with a `lucide:check` icon (all four cards). */
  readonly bullets?: readonly string[];
  /** Optional tag pills rendered as a row; supported by the component but unused
   * on /servicios after card 03 migrated to bullets (design.md § Decision 5). */
  readonly tags?: readonly string[];
}

/**
 * Props accepted by `ServicesHero.astro`.
 *
 * The hero is a dark (`bg-secondary-dark`) band with a single `<h1>` headline.
 * `highlightedWord` is wrapped in `<span class="text-accent">` via the shared
 * `splitHeadline()` helper (design.md § Decision 2).
 */
export interface ServicesHeroProps {
  /** Full headline text; the `highlightedWord` substring is wrapped in accent. */
  readonly headline: string;
  /** Substring of `headline` rendered in accent (e.g. "Precisión"). */
  readonly highlightedWord: string;
  /** Subtitle paragraph rendered under the headline. */
  readonly subtitle: string;
}

/**
 * Props accepted by `ServiceCard.astro`.
 *
 * Extends `ServicePageService` with the layout-only `imagePosition` prop that
 * the page computes per card (alternating left/right, design.md § Decision 4).
 */
export interface ServiceCardProps extends ServicePageService {
  /** Image side in the horizontal layout: `left` or `right` (from `md+`). */
  readonly imagePosition: 'left' | 'right';
}

/**
 * Full props bag for the `/servicios` page, spread onto its components by
 * `apps/web/src/pages/servicios.astro`.
 */
export interface ServicesPageProps {
  /** Hero section content. */
  readonly hero: ServicesHeroProps;
  /** Service cards in render order; exactly 4 on the page. */
  readonly services: readonly ServicePageService[];
}
