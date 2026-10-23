import type { ImageMetadata } from 'astro';

/**
 * Types shared by the public `/representaciones` page components.
 *
 * The page is composed of presentational (dumb) components that receive all
 * their data through props, so these interfaces are the contract between the
 * page (`apps/web/src/pages/representaciones.astro`, which owns the content via
 * `REPRESENTACIONES_PAGE_CONTENT`) and the components (which only render).
 *
 * See `openspec/changes/polish-representaciones-page/design.md`:
 * - § D3: dumb components + hardcoded typed config (site-wide pattern).
 * - § D4: reusable card components (`RepresentacionBrandCard`,
 *   `DistribuidorCard`, `ValuePropCard`) plus `RepresentacionesHero`.
 * - § D6: icons are Lucide names stored in config (e.g. `lucide:wrench`) and
 *   rendered through `astro-icon`.
 * - § D1/D2: company logos are real `ImageMetadata` assets imported from
 *   `@/assets/img/representaciones/` and rendered with `<Image>` from
 *   `astro:assets`.
 *
 * All fields are `readonly` by project convention: content constants are
 * immutable and components never mutate their props.
 */

/**
 * A metric card in the editorial hero (e.g. "05 / Representaciones
 * Exclusivas / Soporte directo de fábrica").
 */
export interface RepresentacionesMetric {
  /** Large display value, e.g. "05", "02" or "100%". */
  readonly value: string;
  /** Uppercase label, e.g. "Representaciones Exclusivas". */
  readonly label: string;
  /** Small secondary caption, e.g. "Soporte directo de fábrica". */
  readonly caption: string;
  /** Token used for the value color: brand primary or accent. */
  readonly valueTone: 'primary' | 'accent' | 'surface';
}

/** Content for the editorial hero section. */
export interface RepresentacionesHeroContent {
  /** Eyebrow label above the headline. */
  readonly eyebrow: string;
  /** Full headline text. */
  readonly headline: string;
  /** Substring of `headline` wrapped in `text-primary`. */
  readonly highlightedWord: string;
  /** Intro paragraph under the headline. */
  readonly intro: string;
  /** Exactly 3 metric cards. */
  readonly metrics: readonly RepresentacionesMetric[];
}

/**
 * A brand card in the "Marcas de Representación Exclusiva" section.
 *
 * The `logo` is a real asset (design.md § D1/D2) rendered with `<Image>` inside
 * a `data-brand-logo` container; its `alt` is the brand `title`.
 */
export interface RepresentacionBrand {
  /** Stable id used as the render key. */
  readonly id: string;
  /** Real brand logo imported from `@/assets/img/representaciones/`. */
  readonly logo: ImageMetadata;
  /** Origin chip, e.g. "Polonia / UE". */
  readonly chip: string;
  /** Small caption under the chip, e.g. "Partner Exclusivo desde 2004". */
  readonly sublabel: string;
  /** `<h3>` title, e.g. "Apator Powogaz". */
  readonly title: string;
  /** Technical category highlighted in `text-primary`. */
  readonly category: string;
  /** Descriptive paragraph. */
  readonly description: string;
}

/** Section content for the brand cards. */
export interface RepresentacionBrandsSection {
  readonly eyebrow: string;
  readonly headline: string;
  /** Exactly 5 brands in render order. */
  readonly brands: readonly RepresentacionBrand[];
}

/**
 * A distributor card (PIUSI, SENSUS).
 *
 * `logo` is a real asset (design.md § D1/D2); `name` is the brand name used as
 * the logo `alt`; `icon` is a Lucide name (design.md § D6).
 */
export interface Distribuidor {
  readonly id: string;
  /** Brand name used as the logo `alt`, e.g. "PIUSI" or "SENSUS". */
  readonly name: string;
  /** Real distributor logo imported from `@/assets/img/representaciones/`. */
  readonly logo: ImageMetadata;
  /** Badge next to the logo, e.g. "Italia" or "Xylem Brand". */
  readonly badge: string;
  /** Lucide icon name, e.g. "lucide:fuel". */
  readonly icon: string;
  /** `<h3>` title. */
  readonly title: string;
  /** Descriptive paragraph. */
  readonly description: string;
  /** Exactly 3 check-list bullets. */
  readonly bullets: readonly string[];
  /** Guarantee legend at the card foot, e.g. "Garantía Oficial PIUSI Italia". */
  readonly guarantee: string;
}

/** Section content for the authorized distributors. */
export interface DistribuidoresSection {
  readonly eyebrow: string;
  readonly headline: string;
  readonly intro: string;
  /** Exactly 2 distributors (PIUSI, SENSUS). */
  readonly distributors: readonly Distribuidor[];
}

/**
 * A "pillar" value-proposition card.
 *
 * `icon` is a Lucide name (design.md § D6); `accent` picks the icon color token
 * (there is no `tertiary` token, design.md § D5).
 */
export interface ValueProp {
  readonly id: string;
  /** Lucide icon name, e.g. "lucide:wrench". */
  readonly icon: string;
  /** Indexed label, e.g. "01 / Respaldo Técnico". */
  readonly indexLabel: string;
  /** `<h4>` title. */
  readonly title: string;
  /** Descriptive paragraph. */
  readonly description: string;
  /** Token used for the icon color. */
  readonly accent: 'primary' | 'accent' | 'secondary';
}

/** Section content for the value proposition. */
export interface ValuePropsSection {
  readonly eyebrow: string;
  readonly headline: string;
  readonly intro: string;
  /** Exactly 4 pillars. */
  readonly valueProps: readonly ValueProp[];
}

/**
 * Full content bag for the `/representaciones` page, passed to the page module
 * (and spread onto its sections) by `apps/web/src/pages/representaciones.astro`.
 */
export interface RepresentacionesPageContent {
  /** SEO `<title>`. */
  readonly title: string;
  /** SEO `<meta name="description">`. */
  readonly description: string;
  readonly hero: RepresentacionesHeroContent;
  readonly brandsSection: RepresentacionBrandsSection;
  readonly distributorsSection: DistribuidoresSection;
  readonly valuePropsSection: ValuePropsSection;
}
