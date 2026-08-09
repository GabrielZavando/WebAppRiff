/**
 * Types shared by the home page "featured products" section.
 *
 * The featured section is a presentational (dumb) component: it receives all
 * its data through props, so these interfaces are the contract between the
 * page (which owns the configuration via `DESTACADOS_SECTION_CONTENT`) and
 * `DestacadosSection.astro` (which only renders).
 *
 * See `openspec/changes/destacados-section/design.md` for the rationale:
 * § Decision 1 (dumb component) and § Decision 3 (`FeaturedProduct`
 * intentionally carries NO price fields — the client specified the section
 * shows no prices).
 */

import type { ImageMetadata } from 'astro';

/**
 * A single featured product card rendered in the responsive grid.
 *
 * `imagen` is an `ImageMetadata` produced by importing a PNG/WebP from
 * `apps/web/src/assets/img/` (the `image-assets` convention: every optimizable
 * site image lives under `assets/img/` and is consumed via `astro:assets`).
 * `imagenAlt` is the descriptive alternative text (NOT the card title — the
 * alt describes what the photo shows, see frontend-standards § "Imágenes del
 * sitio").
 *
 * `id` is a stable technical identifier; `slug` is the URL-friendly segment
 * used for the "Cotizar" CTA target `/productos/{slug}` (the product detail
 * routes are future work, but `slug` is already part of the contract so no
 * breaking change will be needed — same trade-off as `SolutionSection`'s
 * `href`, see design.md § Risks / Trade-offs).
 *
 * NOTE (design.md Decision 3): there is intentionally NO `precio` field. The
 * section renders no prices; the price contract will arrive with the future
 * catalog API/CMS migration.
 */
export interface FeaturedProduct {
  /** Stable technical identifier, e.g. "flujometro-universal". */
  readonly id: string;
  /** Product display name, e.g. "Flujómetro Universal", rendered as `<h4>`. */
  readonly titulo: string;
  /** Kebab-case slug, e.g. "flujometro-universal". CTA target base. */
  readonly slug: string;
  /** Image metadata from `import ... from '@/assets/img/...'`. */
  readonly imagen: ImageMetadata;
  /** Descriptive alt text (not a repeat of `titulo`). */
  readonly imagenAlt: string;
}

/**
 * Props accepted by `DestacadosSection.astro`.
 *
 * The section composes a header row (`headline` + `ctaText` link to
 * `ctaHref`) and a responsive grid of `products` cards. All fields are
 * readonly so the config constant can be safely shared.
 */
export interface DestacadosSectionProps {
  /** The section headline, e.g. "Soluciones Destacadas", rendered as `<h3>`. */
  readonly headline: string;
  /** Header CTA label, e.g. "EXPLORAR CATÁLOGO COMPLETO". */
  readonly ctaText: string;
  /** Header CTA destination, e.g. "/productos". */
  readonly ctaHref: string;
  /** Featured product cards in render order; exactly 4 in the home config. */
  readonly products: readonly FeaturedProduct[];
}