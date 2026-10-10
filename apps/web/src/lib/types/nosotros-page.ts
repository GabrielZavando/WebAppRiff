/**
 * Types shared by the public about page (`/nosotros`).
 *
 * The page is composed of six presentational (dumb) components — hero,
 * timeline, value proposition, mission/vision, team grid and clients — each
 * receiving all of its data through props, so these interfaces are the
 * contract between the page (which owns the configuration via
 * `NOSOTROS_PAGE_CONTENT`) and the components (which only render).
 *
 * See `openspec/changes/nosotros-page/design.md` for the rationale:
 * § Decision 2 (six dumb components + typed config), § Decision 5
 * (`NosotrosIconName` is a closed union, NOT a free `string`: a typo like
 * `'bulding'` breaks at compile time instead of rendering an empty icon at
 * runtime — same rationale as `PilarIconName`, consumed via `astro-icon` as
 * `lucide:<name>`), § Decision 6 (images are local placeholders imported from
 * `@/assets/img/`, rendered via `astro:assets`).
 */

import type { ImageMetadata } from 'astro';

/**
 * The closed set of Lucide icon names any section of `/nosotros` may use.
 *
 * Every name was verified to exist in the installed `@iconify-json/lucide`
 * set (task 1.3). `building` is the documented fallback for Material's
 * `apartment` (`building-2` no longer exists in the installed set —
 * design.md D5). Consumed by the components via
 * `<Icon name={`lucide:${icon}`} />` with `aria-hidden="true"` (decorative).
 * Extending this union is a single-file change.
 */
export type NosotrosIconName =
  | 'badge-check' /* hero eyebrow (Material: verified) */
  | 'arrow-right' /* hero CTA (Material: arrow_forward) */
  | 'book-open-text' /* hero CTA "historia" (Material: history_edu) */
  | 'cog' /* pilar Durabilidad (Material: precision_manufacturing) */
  | 'sliders-horizontal' /* pilar Precisión (Material: tune) */
  | 'droplet' /* pilar Eficiencia (Material: water_drop) */
  | 'wrench' /* pilar Servicio In-Situ + badge equipo (Material: engineering) */
  | 'mountain' /* sector Minería (Material: terrain) */
  | 'utensils' /* sector Alimentos (Material: restaurant) */
  | 'users' /* sector APR (Material: reduce_capacity) */
  | 'building' /* sector Edificación (Material: apartment; fallback D5) */
  | 'clipboard-list' /* eyebrow Misión (Material: assignment) */
  | 'eye' /* eyebrow Visión (Material: visibility) */
  | 'shield-check' /* nota Misión (Material: verified_user) */
  | 'leaf' /* nota Visión (Material: eco) */
  | 'badge' /* pie de tarjeta de equipo (Material: badge) */
  | 'drafting-compass' /* pie tarjeta Lara Smith (Material: architecture) */
  | 'globe' /* pie tarjeta John Doe (Material: public) */
  | 'gauge' /* pie tarjeta Felipe Román (Material: speed) */
  | 'handshake' /* eyebrow Clientes (Material: handshake) */
  | 'phone' /* CTA teléfono (Material: call) */
  | 'star'; /* marcador del hito 2024 (glifo ★ de la referencia) */

/**
 * A call-to-action definition (hero + closing banner).
 *
 * `href` is a real route (`/contacto`) or an in-page anchor (`#historia`);
 * `#contacto` is forbidden (spec SC-208): the site has a real /contacto page.
 */
export interface NosotrosCta {
  /** CTA visible text, e.g. "SOLICITAR ASESORÍA TÉCNICA". */
  readonly label: string;
  /** CTA destination: real route ("/contacto") or in-page anchor ("#historia"). */
  readonly href: string;
  /** Decorative Lucide icon rendered next to the label. */
  readonly icon: NosotrosIconName;
}

/**
 * Visual tone of a timeline milestone (drives card + badge colors via design
 * tokens, design.md D4): `primary` = white card with `bg-primary-deep` badge
 * (1979, 2013), `secondary` = white card with `bg-secondary-light` badge
 * (2012), `accent` = white card with `bg-accent-dark` badge (2018), `dark` =
 * `bg-primary-deep` card with white text and `bg-accent` badge (Diciembre
 * 2024). The numeric marker on the central line alternates by index and is
 * derived in the component, not stored here.
 */
export type TimelineCardTone = 'primary' | 'secondary' | 'accent' | 'dark';

/**
 * A single historical milestone rendered by the timeline section
 * (`NosotrosTimeline.astro`). The copy is verbatim from the approved
 * reference (`docs/design/components/nosotros/reference.html`).
 */
export interface TimelineMilestone {
  /** Short year, e.g. "1979" or "DICIEMBRE 2024" (used by tests/scenarios). */
  readonly year: string;
  /** Visible badge text, e.g. "AÑO 1979" or "DICIEMBRE 2024". */
  readonly badge: string;
  /** Milestone headline, e.g. "Fundación: Aguas Purificadas Ltda.". */
  readonly title: string;
  /** Milestone body copy (verbatim). */
  readonly description: string;
  /** Label of the adjacent note box, e.g. "Hito Clave". */
  readonly noteLabel: string;
  /** Body copy of the adjacent note box (verbatim). */
  readonly noteText: string;
  /** Card tone (drives background/badge colors via design tokens). */
  readonly tone: TimelineCardTone;
  /**
   * Optional substring of `description` the component wraps in `<strong>`
   * (e.g. "RIFF SpA" in the Diciembre 2024 milestone — preserves the
   * reference's `<strong>` markup, design.md D13).
   */
  readonly highlight?: string;
}

/** Icon background tone for a value pillar (deep teal vs orange accent). */
export type PillarIconTone = 'primary' | 'accent';

/**
 * A value-proposition pillar (one of the four cards in
 * `NosotrosValueProp.astro`).
 */
export interface ValuePillar {
  /** Pillar headline, e.g. "Durabilidad Extrema". */
  readonly title: string;
  /** Pillar body copy (verbatim). */
  readonly description: string;
  /** Footnote strip copy, e.g. "Vida útil prolongada en ciclos severos.". */
  readonly note: string;
  /** Decorative Lucide icon rendered in the icon tile. */
  readonly icon: NosotrosIconName;
  /** Icon tile tone (deep teal for the first three, accent for the fourth). */
  readonly iconTone: PillarIconTone;
}

/**
 * An industry-sector card in the bento grid of `NosotrosValueProp.astro`.
 */
export interface SectorCard {
  /** Sector ordinal label, e.g. "SECTOR 01". */
  readonly label: string;
  /** Sector headline, e.g. "Gran Minería & Pulpa". */
  readonly title: string;
  /** Sector body copy (verbatim). */
  readonly description: string;
  /** Decorative Lucide icon anchored bottom-right of the card. */
  readonly icon: NosotrosIconName;
}

/** Area badge tone on a team photo (deep teal vs orange for Operaciones). */
export type TeamAreaTone = 'primary' | 'accent';

/**
 * A leadership team member rendered by `NosotrosTeamGrid.astro`.
 */
export interface TeamMember {
  /** Member name, e.g. "Steven Marks". */
  readonly name: string;
  /** Area label over the photo, e.g. "Dirección". */
  readonly area: string;
  /** Area badge tone. */
  readonly areaTone: TeamAreaTone;
  /** Role under the name, e.g. "Gerente General". */
  readonly role: string;
  /** Member bio copy (verbatim). */
  readonly description: string;
  /** Footer strip label, e.g. "Gestión Corporativa". */
  readonly footerLabel: string;
  /** Decorative Lucide icon in the footer strip. */
  readonly footerIcon: NosotrosIconName;
  /** Portrait image (local placeholder imported from `@/assets/img/`). */
  readonly image: ImageMetadata;
  /** Descriptive alt text (verbatim from the reference's `data-alt`). */
  readonly imageAlt: string;
}

/** A client wordmark tile in the closing "Quienes Han Confiado" grid. */
export interface ClientCard {
  /** Client name, e.g. "ANGLO AMERICAN". */
  readonly name: string;
  /** Sector caption under the name, e.g. "Minería". */
  readonly subtitle: string;
}

/** Props for `NosotrosHero.astro` (section 1). */
export interface NosotrosHeroProps {
  /** Uppercase eyebrow above the headline (not a heading). */
  readonly eyebrow: string;
  /** Decorative Lucide icon inside the eyebrow pill. */
  readonly eyebrowIcon: NosotrosIconName;
  /** Hero headline, e.g. "SOMOS RIFF" (the page's single `<h1>`). */
  readonly title: string;
  /** Substring of `title` rendered in the primary token, e.g. "RIFF". */
  readonly highlightedWord: string;
  /** Subordinate subtitle beneath the headline. */
  readonly subtitle: string;
  /** Introductory paragraph (verbatim). */
  readonly description: string;
  /** The two hero CTAs in render order (historia anchor last). */
  readonly ctas: readonly NosotrosCta[];
  /** Technical image (local placeholder). */
  readonly image: ImageMetadata;
  /** Descriptive alt text (verbatim from the reference's `data-alt`). */
  readonly imageAlt: string;
  /** Left caption over the image gradient, e.g. "Ingeniería Hidráulica Certificada". */
  readonly imageCaptionLeft: string;
  /** Right caption over the image gradient, e.g. "Norma ISO 9001:2015". */
  readonly imageCaptionRight: string;
}

/** Props for `NosotrosTimeline.astro` (section 2, anchor `#historia`). */
export interface NosotrosTimelineProps {
  /** Eyebrow above the section title, e.g. "Cronología y Legado". */
  readonly eyebrow: string;
  /** Section headline (verbatim). */
  readonly title: string;
  /** Section intro paragraph (verbatim). */
  readonly description: string;
  /** The five milestones in chronological order. */
  readonly milestones: readonly TimelineMilestone[];
}

/** Props for `NosotrosValueProp.astro` (section 3). */
export interface NosotrosValuePropProps {
  /** Eyebrow above the section title, e.g. "Diferenciación Operativa". */
  readonly eyebrow: string;
  /** Section headline, e.g. "Nuestra Propuesta de Valor". */
  readonly title: string;
  /** Section intro paragraph (verbatim). */
  readonly description: string;
  /** Side note chip in the header row (verbatim). */
  readonly sideNote: string;
  /** The four value pillars in render order. */
  readonly pillars: readonly ValuePillar[];
  /** Eyebrow of the sectors block, e.g. "Campos de Acción". */
  readonly sectorsEyebrow: string;
  /** Headline of the sectors block (verbatim). */
  readonly sectorsTitle: string;
  /** The four industry-sector cards in render order. */
  readonly sectors: readonly SectorCard[];
}

/** One block (Misión or Visión) of `NosotrosIdentity.astro`. */
export interface IdentityBlock {
  /** Uppercase eyebrow above the title. */
  readonly eyebrow: string;
  /** Decorative Lucide icon inside the eyebrow. */
  readonly eyebrowIcon: NosotrosIconName;
  /** Block title: "MISIÓN" or "VISIÓN". */
  readonly title: string;
  /** Quoted statement (verbatim, rendered with typographic quotes). */
  readonly quote: string;
  /** Supporting paragraph (verbatim). */
  readonly description: string;
  /** Decorative Lucide icon of the footer note. */
  readonly noteIcon: NosotrosIconName;
  /** Footer note copy (verbatim). */
  readonly noteText: string;
}

/** Props for `NosotrosIdentity.astro` (section 4). */
export interface NosotrosIdentityProps {
  /** Misión block (light surface). */
  readonly mission: IdentityBlock;
  /** Visión block (dark surface). */
  readonly vision: IdentityBlock;
}

/** Props for `NosotrosTeamGrid.astro` (section 5). */
export interface NosotrosTeamGridProps {
  /** Eyebrow above the section title, e.g. "Estructura de Liderazgo". */
  readonly eyebrow: string;
  /** Section headline (verbatim). */
  readonly title: string;
  /** Section subtitle (verbatim). */
  readonly subtitle: string;
  /** Accreditation badge copy, e.g. "+100 años de experiencia…". */
  readonly badgeText: string;
  /** Decorative Lucide icon inside the badge. */
  readonly badgeIcon: NosotrosIconName;
  /** The four leadership cards in render order. */
  readonly members: readonly TeamMember[];
}

/** Props for `NosotrosClients.astro` (section 6: clients grid + closing CTA). */
export interface NosotrosClientsProps {
  /** Uppercase eyebrow above the section title. */
  readonly eyebrow: string;
  /** Decorative Lucide icon inside the eyebrow. */
  readonly eyebrowIcon: NosotrosIconName;
  /** Section headline, e.g. "Quienes Han Confiado en Nosotros". */
  readonly title: string;
  /** Section intro paragraph (verbatim). */
  readonly description: string;
  /** The eight client tiles in render order. */
  readonly clients: readonly ClientCard[];
  /** Closing CTA banner content. */
  readonly cta: {
    /** Eyebrow of the banner, e.g. "Resolución Técnica Inmediata". */
    readonly eyebrow: string;
    /** Banner headline (verbatim). */
    readonly title: string;
    /** Banner paragraph (verbatim). */
    readonly description: string;
    /** Primary asesoría CTA (route `/contacto`, never `#contacto`). */
    readonly primaryCta: NosotrosCta;
    /** Visible phone text, resolved from `getContactInfo()`. */
    readonly phone: string;
    /** `tel:` href, resolved from `getContactInfo()`. */
    readonly phoneHref: string;
    /** Decorative Lucide phone icon. */
    readonly phoneIcon: NosotrosIconName;
  };
}

/**
 * Full props bag for the `/nosotros` page: one entry per section, spread onto
 * the six dumb components by `apps/web/src/pages/nosotros.astro`.
 */
export interface NosotrosPageContent {
  readonly hero: NosotrosHeroProps;
  readonly timeline: NosotrosTimelineProps;
  readonly value: NosotrosValuePropProps;
  readonly identity: NosotrosIdentityProps;
  readonly team: NosotrosTeamGridProps;
  readonly clients: NosotrosClientsProps;
}
