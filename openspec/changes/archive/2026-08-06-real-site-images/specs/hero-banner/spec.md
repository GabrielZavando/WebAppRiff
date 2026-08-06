# hero-banner Specification — Delta (real-site-images)

## ADDED Requirements

### Requirement: HeroBanner renders the real industrial background image with the Astro Picture component
The `hero-banner` SHALL render its background using the real industrial image imported from `@/assets/img/` and rendered with the built-in `astro:assets` `<Picture>` component, producing a responsive `srcset` with modern formats (AVIF and WebP) and a fixed `loading="eager"` (the hero is above-the-fold). A dark overlay SHALL sit above the image to preserve the contrast of the white text. The obsolete placeholder `from-secondary via-secondary-light to-secondary` CSS-only gradient SHALL be removed; the obsolete utilities `from-brand-navy`, `via-brand-navy-light`, `to-brand-navy` SHALL NOT appear.

#### Scenario: Picture renders with modern formats and eager loading
- **WHEN** the HeroBanner renders on a static build
- **THEN** the rendered HTML contains a `<picture>` element whose `<source>` elements reference `.avif` and `.webp` variants (and a fallback `<img>`)
- **AND** the `<img>` fallback carries `loading="eager"`
- **AND** the `<img>` fallback carries the `alt` attribute with a descriptive text for the industrial image
- **AND** the rendered HTML does NOT contain `from-secondary via-secondary-light to-secondary` nor any `brand-navy` substring

#### Scenario: Decorative overlay is aria-hidden
- **WHEN** the HeroBanner renders
- **THEN** the dark overlay `<div>` carries `aria-hidden="true"` (decorative, not exposed to screen readers)
- **AND** the accessible description of the background comes from the `<img>` `alt`, not from the overlay

## MODIFIED Requirements

### Requirement: HeroBanner is keyboard and screen-reader accessible
The `hero-banner` SHALL use semantic HTML so it is operable with the keyboard and consumable by screen readers: single `<h1>` for the page, `<h2>` subordinate, focusable CTAs in DOM order, and a background image described via a meaningful `alt` attribute on its `<img>` fallback (the decorative overlay is `aria-hidden`).

#### Scenario: Exactly one h1 on the page
- **WHEN** the home page renders with the HeroBanner
- **THEN** the document contains exactly one `<h1>` element (the hero headline)
- **AND** the hero's subtitle is rendered as `<h2>` (not as another `<h1>`)

#### Scenario: CTAs are keyboard-focusable anchors
- **WHEN** the HeroBanner renders
- **THEN** each CTA is an `<a href="...">` element (focusable by default)
- **AND** Tab navigation moves through the CTAs in DOM order
- **AND** the CTAs do not carry `tabindex="-1"` or `aria-hidden="true"`

#### Scenario: Background image is described by alt, overlay is silent
- **WHEN** the HeroBanner renders
- **THEN** the `<img>` fallback of the background picture carries a non-empty `alt` describing the industrial image
- **AND** the dark overlay `<div>` carries `aria-hidden="true"`
- **AND** the overlay does NOT carry `role="img"`, `aria-label`, or `alt`

## REMOVED Requirements

### Requirement: HeroBanner uses a CSS-only placeholder background, no external image
**Reason**: Replaced by the real industrial background image rendered with `astro:assets` `<Picture>` (change `real-site-images`).
**Migration**: The placeholder CSS gradient is replaced by the `<Picture>` background from `@/assets/img/banner_home.webp` with a dark overlay for text contrast; the rendered page needs no consumer migration.
