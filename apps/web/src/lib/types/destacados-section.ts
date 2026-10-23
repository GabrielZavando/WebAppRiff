/**
 * Types shared by the home page "featured products" section.
 *
 * The featured section is a presentational (dumb) component: it receives all
 * its data through props. Since the `home-featured-products-grid` change the
 * cards are derived at build time from the backend featured catalog
 * (`GET /api/v1/products?destacado=true`, capped at 8 by the home page), so
 * the contract describes an API-backed product card rather than a locally
 * imported asset: `imageUrl` is the public Firebase Storage URL of
 * `galeria[0]` and `imagenAlt` is the gallery alt text (falling back to the
 * product title when the panel image has no alt).
 *
 * See `openspec/changes/home-featured-products-grid/design.md` for the
 * rationale: § Decision 3 (API-backed card model) and § Decision 4 (remote
 * `<img>` instead of `astro:assets`).
 */

/**
 * A single featured product card rendered in the responsive grid.
 *
 * `imageUrl` is a remote public image URL (from the product's gallery in the
 * backend); it may be empty when the product has no gallery entry — the card
 * then renders an image-less mat. `imagenAlt` is the alternative text (the
 * gallery alt when present, otherwise the product title).
 *
 * `id` is the stable backend identifier; `slug` is the URL-friendly segment
 * used for the "Ver detalles" CTA target `/productos/{slug}`.
 *
 * There is intentionally NO `precio` field: the section renders no prices
 * (client decision, preserved from the original `destacados-section` design).
 */
export interface FeaturedProduct {
  /** Backend product identifier (Firestore doc id). */
  readonly id: string;
  /** Product display name, rendered as `<h4>`. */
  readonly titulo: string;
  /** Kebab-case slug; CTA target `/productos/{slug}`. */
  readonly slug: string;
  /** Remote image URL from `galeria[0].url`; empty when no gallery image. */
  readonly imageUrl: string;
  /** Descriptive alt text (gallery alt, falling back to `titulo`). */
  readonly imagenAlt: string;
}

/**
 * Props accepted by `DestacadosSection.astro`.
 *
 * The section composes a header row (`headline` + `ctaText` link to
 * `ctaHref`) and a responsive grid of `products` cards. All fields are
 * readonly so the config constant can be safely shared. `products` holds the
 * backend featured list after the home page applies the 8-card visual cap,
 * so 0..8 entries are valid.
 */
export interface DestacadosSectionProps {
  /** The section headline, e.g. "Soluciones Destacadas", rendered as `<h3>`. */
  readonly headline: string;
  /** Header CTA label, e.g. "EXPLORAR CATÁLOGO COMPLETO". */
  readonly ctaText: string;
  /** Header CTA destination, e.g. "/productos". */
  readonly ctaHref: string;
  /** Featured product cards in render order (backend order, 0..8 entries). */
  readonly products: readonly FeaturedProduct[];
}
