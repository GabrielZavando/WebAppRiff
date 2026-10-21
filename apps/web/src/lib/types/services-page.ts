/**
 * Types shared by the public `/servicios` page components.
 *
 * The page is composed of presentational (dumb) components that receive all
 * their data through props. These interfaces are the contract between
 * `apps/web/src/pages/servicios.astro` (which owns the content via
 * `SERVICIOS_PAGE_CONTENT`) and the components, which only render.
 *
 * See `openspec/changes/redesign-servicios-page/design.md`:
 * - D2: `ServiciosSectionHeading`, `SolucionPortafolioCard`,
 *   `ServicioTerrenoCard` and the two section wrappers.
 * - D3: config lives in `lib/config/services-page.ts`; `ServicioTerrenoBody`
 *   is a discriminated union with exactly one rendered variant per service.
 * - D6: the section-2 `slug` keeps the home deep-link contract; section 1
 *   uses its own `id`.
 *
 * All fields are `readonly` by project convention: content constants are
 * immutable and components never mutate their props.
 */

import type { ImageMetadata } from 'astro';

/**
 * Props accepted by `ServicesHero.astro`.
 *
 * The hero is transparent over the `Layout` banner and renders a single `<h1>`.
 * `highlightedWord` is wrapped in `<span class="text-primary">` via the shared
 * `splitHeadline()` helper.
 */
export interface ServicesHeroProps {
  /** Full headline text; the `highlightedWord` substring is wrapped in primary. */
  readonly headline: string;
  /** Substring of `headline` rendered in primary (#41B3C4), e.g. "Servicios Industriales". */
  readonly highlightedWord: string;
  /** Subtitle paragraph rendered under the headline. */
  readonly subtitle: string;
}

/** A label/value pair rendered in the technical specifications panel. */
export interface ServicioSpec {
  readonly label: string;
  readonly value: string;
}

/**
 * One row of the "Nuestras Soluciones — Portafolio Técnico" section.
 *
 * `icon` is a full Iconify name restricted to the Lucide set (e.g.
 * `lucide:gauge`). `id` is the scroll anchor of the row.
 */
export interface SolucionPortafolio {
  /** Scroll anchor, e.g. `solucion-medicion-fluidos`. */
  readonly id: string;
  /** Lucide icon name, e.g. `lucide:gauge`. */
  readonly icon: string;
  /** Uppercase technical category, e.g. "Instrumentación de Precisión". */
  readonly category: string;
  /** `<h3>` title. */
  readonly title: string;
  /** Descriptive paragraph. */
  readonly description: string;
  /** `<h4>` title of the specifications panel. */
  readonly specsTitle: string;
  /** Between two and four label/value pairs. */
  readonly specs: readonly ServicioSpec[];
  /** Label above the chips, e.g. "Sectores e Industrias:". */
  readonly tagsLabel: string;
  /** Chips shown under the specifications panel. */
  readonly tags: readonly string[];
  /** Visible CTA text, e.g. "Solicitar Asesoría Técnica". */
  readonly ctaLabel: string;
  /** CTA destination; `/contacto` for this page. */
  readonly ctaHref: string;
}

/** Props accepted by `SolucionPortafolioCard.astro`. */
export interface SolucionPortafolioCardProps extends SolucionPortafolio {}

/** Props accepted by `ServiciosPortafolioSection.astro`. */
export interface ServiciosPortafolioSectionProps {
  readonly eyebrow: string;
  readonly headline: string;
  readonly intro: string;
  /** Exactly four solutions in render order. */
  readonly solutions: readonly SolucionPortafolio[];
}

/** A feature box inside the section-2 body. */
export interface ServicioFeature {
  readonly title: string;
  readonly description: string;
}

/** A bullet with a bold lead-in inside the section-2 body. */
export interface ServicioBullet {
  readonly strong: string;
  readonly text: string;
}

/**
 * Exactly one content variant is rendered per field-service card.
 *
 * `features` renders boxes, `bullets` renders a check list and `tags` renders
 * chips. The union prevents combining variants that the reference design keeps
 * mutually exclusive.
 */
export type ServicioTerrenoBody =
  | { readonly kind: 'features'; readonly features: readonly ServicioFeature[] }
  | { readonly kind: 'bullets'; readonly bullets: readonly ServicioBullet[] }
  | { readonly kind: 'tags'; readonly tags: readonly string[] };

/**
 * One row of the "Servicios Especializados en Terreno" section.
 *
 * `slug` MUST match the home `SERVICES_DATA` slug 1:1 so the home CTAs can
 * deep-link to `/servicios#{slug}`. `image` comes from `@/assets/img/` and is
 * rendered through `astro:assets`.
 */
export interface ServicioTerreno {
  /** Kebab-case home deep-link anchor, e.g. `medicion-en-edificios`. */
  readonly slug: string;
  /** 1-based ordinal rendered as a two-digit index ("01"). */
  readonly index: number;
  /** Sector label, e.g. "RESIDENCIAL & COMERCIAL". */
  readonly sector: string;
  /** `<h3>` title. */
  readonly title: string;
  /** Descriptive paragraph. */
  readonly description: string;
  /** Image metadata imported from `@/assets/img/`. */
  readonly image: ImageMetadata;
  /** Descriptive alt text (not a repeat of `title`). */
  readonly imageAlt: string;
  /** Small label over the image caption, e.g. "COMPATIBILIDAD TELEMÉTRICA". */
  readonly imageCaptionLabel: string;
  /** Caption text over the image. */
  readonly imageCaption: string;
  /** Exactly one body variant. */
  readonly body: ServicioTerrenoBody;
  /** Visible CTA text, e.g. "Contactar a un Especialista". */
  readonly ctaLabel: string;
  /** CTA destination; `/contacto` for this page. */
  readonly ctaHref: string;
}

/** Props accepted by `ServicioTerrenoCard.astro`. */
export interface ServicioTerrenoCardProps extends ServicioTerreno {
  /** Image side in the desktop grid: `left` or `right`. */
  readonly imagePosition: 'left' | 'right';
}

/** Props accepted by `ServiciosTerrenoSection.astro`. */
export interface ServiciosTerrenoSectionProps {
  readonly eyebrow: string;
  readonly headline: string;
  readonly intro: string;
  /** Exactly four services in render order. */
  readonly services: readonly ServicioTerreno[];
}

/** Marker/eyebrow tone shared by both section headings. */
export interface ServiciosSectionHeadingProps {
  readonly eyebrow: string;
  readonly headline: string;
  readonly intro: string;
  readonly markerTone: 'primary' | 'accent';
}

/** Full props bag for the `/servicios` page. */
export interface ServicesPageProps {
  readonly hero: ServicesHeroProps;
  readonly portfolioSection: ServiciosPortafolioSectionProps;
  readonly fieldServicesSection: ServiciosTerrenoSectionProps;
}
