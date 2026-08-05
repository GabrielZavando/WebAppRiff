## ADDED Requirements

### Requirement: PanelHome renders the left half with eyebrow, headline, description and a navy CTA over a teal background
The `panel-home` SHALL render its left half as a `<div>` (or equivalent) carrying the `bg-brand-teal` class, containing an eyebrow `<span>` (uppercase, not a heading), a headline `<h2>`, a description `<p>` and a single CTA `<a href="/contacto">` styled with `bg-brand-navy text-white`. The eyebrow SHALL NOT be rendered as a heading element (`<h1>`–`<h6>`).

#### Scenario: Left half uses the brand-teal background token
- **WHEN** the PanelHome renders
- **THEN** the left half element carries a class containing `bg-brand-teal`
- **AND** the left half does NOT carry `bg-white`, `bg-brand-navy` or any other background class that overrides the teal

#### Scenario: Eyebrow renders as a non-heading uppercase span
- **WHEN** the PanelHome renders with `eyebrow="DESDE 1979"`
- **THEN** the left half contains a `<span>` (or `<p>`) element whose visible text equals "DESDE 1979"
- **AND** the element carries a class expressing uppercase transformation (e.g. `uppercase`)
- **AND** the element is NOT any of `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`

#### Scenario: Headline renders as an h2 with white text
- **WHEN** the PanelHome renders with `headline="Más de 40 Años de Liderazgo en la Medición y Control de Fluidos"`
- **THEN** the left half contains an `<h2>` element whose visible text equals the headline verbatim
- **AND** the `<h2>` carries a class expressing white text (e.g. `text-white`)

#### Scenario: Description renders as a paragraph with reduced opacity and constrained width
- **WHEN** the PanelHome renders with `description="Nuestra historia comienza..."`
- **THEN** the left half contains a `<p>` element whose visible text equals the description verbatim
- **AND** the `<p>` carries a class expressing reduced opacity relative to the headline (e.g. `text-white/80`, `text-white/90` or `text-white`)
- **AND** the `<p>` carries a class constraining its max width (e.g. `max-w-md` or `max-w-lg`)

#### Scenario: CTA renders as a navy anchor linking to /contacto
- **WHEN** the PanelHome renders with `cta={ label: "SOLICITAR ASESORÍA TÉCNICA", href: "/contacto", variant: "primary" }`
- **THEN** the left half contains an `<a href="/contacto">` element
- **AND** the `<a>` carries a class containing `bg-brand-navy` and `text-white`
- **AND** the `<a>` does NOT carry `bg-brand-teal` (the CTA color contrasts with the panel background)
- **AND** the visible text of the `<a>` equals "SOLICITAR ASESORÍA TÉCNICA"

### Requirement: PanelHome renders the right half with a 2×2 grid of four statistics over a white background
The `panel-home` SHALL render its right half as a `<div>` (or equivalent) carrying the `bg-white` class, containing exactly four stat cells laid out in a `grid-cols-2` grid (2 rows × 2 columns). Each stat cell SHALL render the `value` as a large bold paragraph and the `label` as a small uppercase paragraph below it. The grid SHALL keep `grid-cols-2` across all viewports (mobile and desktop).

#### Scenario: Right half uses the white background
- **WHEN** the PanelHome renders
- **THEN** the right half element carries a class containing `bg-white`
- **AND** the right half does NOT carry `bg-brand-teal`, `bg-brand-navy` or any other background class

#### Scenario: Four stat cells are rendered
- **WHEN** the PanelHome renders with `stats` of length `4`
- **THEN** the right half contains exactly four stat cell elements
- **AND** each stat cell contains a value element and a label element

#### Scenario: Stat value renders as a bold navy paragraph
- **WHEN** the PanelHome renders with `stats[0].value="40+"`
- **THEN** the first stat cell contains a `<p>` (or equivalent) whose visible text equals "40+"
- **AND** the element carries a class expressing bold weight (e.g. `font-bold`) and navy text (e.g. `text-brand-navy`)

#### Scenario: Stat label renders as a small uppercase gray paragraph
- **WHEN** the PanelHome renders with `stats[0].label="AÑOS DE EXPERIENCIA EN LA INDUSTRIA"`
- **THEN** the first stat cell contains a `<p>` (or equivalent) whose visible text equals the label verbatim
- **AND** the element carries a class expressing uppercase transformation (e.g. `uppercase`) and a gray text color (e.g. `text-gray-600`)

#### Scenario: Stat cells are laid out in a 2×2 grid on every viewport
- **WHEN** the PanelHome renders
- **THEN** the right half contains a grid container with class `grid-cols-2`
- **AND** the grid container does NOT carry `grid-cols-1` as the only column class (i.e. it does not collapse to a single column on mobile)

#### Scenario: Stat cells do not introduce heading elements
- **WHEN** the PanelHome renders
- **THEN** NO stat value or label element is rendered as `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>` or `<h6>`
- **AND** stat values and labels are rendered as `<p>` or `<span>` or `<div>` elements

### Requirement: PanelHome layout is responsive: stacked on mobile, two columns on desktop
The `panel-home` SHALL compose its two halves in a responsive grid: on mobile (`< 1024px`) the two halves stack vertically (left teal on top, right white on bottom, each full-width); on desktop (`>= 1024px`) the two halves sit side by side, each occupying 50% of the panel width. The breakpoint SHALL be `lg` (1024px).

#### Scenario: Mobile stacks the two halves vertically
- **WHEN** the PanelHome renders on a viewport `< 1024px`
- **THEN** the outermost panel grid carries a class expressing a single column (e.g. `grid-cols-1`)
- **AND** the left half element sits above the right half element in the DOM

#### Scenario: Desktop lays the two halves side by side
- **WHEN** the PanelHome renders on a viewport `>= 1024px`
- **THEN** the outermost panel grid carries a class expressing two columns (e.g. `lg:grid-cols-2`)
- **AND** the left half and the right half each occupy ~50% of the panel width

### Requirement: PanelHome overlaps the HeroBanner by approximately 50% via negative margin-top
The `panel-home` outermost `<section>` SHALL carry a negative `margin-top` (e.g. `-mt-16 md:-mt-24 lg:-mt-32`) and `position: relative` with a positive `z-index` (e.g. `z-10`) so the panel visually overlaps the bottom portion of the `HeroBanner` above it. The overlap SHALL be purely visual (CSS) and SHALL NOT modify the HeroBanner component or its rendered HTML.

#### Scenario: Panel section carries a negative margin-top utility
- **WHEN** the PanelHome renders
- **THEN** the outermost `<section>` carries a Tailwind negative-margin utility class (matching the regex `/-mt-\d+/`)
- **AND** the `<section>` carries a `relative` positioning class
- **AND** the `<section>` carries a positive z-index class (e.g. `z-10`)

#### Scenario: PanelHome is rendered after the HeroBanner in the DOM
- **WHEN** the home page `/` renders
- **THEN** the rendered HTML contains the HeroBanner `<section>` followed by the PanelHome `<section>`
- **AND** the PanelHome `<section>` appears exactly once in the document

#### Scenario: HeroBanner HTML is not modified by the PanelHome
- **WHEN** the home page `/` renders with both HeroBanner and PanelHome
- **THEN** the HeroBanner `<section>` carries the same set of classes it would carry when rendered alone
- **AND** the HeroBanner headline, subtitle and CTAs render with the same text and classes as in the `banner-home` change

### Requirement: PanelHome is keyboard and screen-reader accessible
The `panel-home` SHALL use semantic HTML so it is operable with the keyboard and consumable by screen readers without extra ARIA attributes: the panel headline is `<h2>` (subordinate to the hero `<h1>`), the CTA is a focusable `<a>`, and no decorative element emits aria noise.

#### Scenario: The panel headline is an h2, not a new h1
- **WHEN** the home page renders with both HeroBanner and PanelHome
- **THEN** the document contains exactly one `<h1>` (the hero headline)
- **AND** the PanelHome headline is rendered as `<h2>`

#### Scenario: The CTA is keyboard-focusable
- **WHEN** the PanelHome renders
- **THEN** the CTA is an `<a href="/contacto">` element (focusable by default)
- **AND** the CTA does NOT carry `tabindex="-1"` or `aria-hidden="true"`
- **AND** Tab navigation can move focus to the CTA

#### Scenario: Stat cells do not carry aria-label
- **WHEN** the PanelHome renders
- **THEN** no stat cell `<div>` or `<p>` carries `role="img"`, `aria-label` or `alt` attributes (the stats are plain text, no decorative noise)

### Requirement: PanelHome content is configured via a hardcoded constant
The `panel-home` content SHALL come from the `PANEL_HOME_CONTENT` constant in `lib/config/panel-home.ts`, exported as `Readonly<PanelHomeProps>`, with exactly four stats and exactly one CTA. The first stat's value SHALL be `"40+"` and the last stat's value SHALL be `"9+"`.

#### Scenario: PANEL_HOME_CONTENT exposes the full set of props
- **WHEN** `PANEL_HOME_CONTENT` is imported
- **THEN** it has the shape `{ eyebrow: string; headline: string; description: string; cta: PanelCta; stats: readonly PanelStat[] }`
- **AND** `eyebrow`, `headline` and `description` are non-empty strings
- **AND** `cta.label`, `cta.href` and `cta.variant` are non-empty strings with `variant === 'primary'`

#### Scenario: PANEL_HOME_CONTENT.stats has exactly four stats
- **WHEN** `PANEL_HOME_CONTENT.stats` is inspected
- **THEN** it has length `4`
- **AND** each element has non-empty `value` and `label` strings
- **AND** the first element's `value` equals `"40+"`
- **AND** the last element's `value` equals `"9+"`

#### Scenario: PANEL_HOME_CONTENT.cta points to /contacto
- **WHEN** `PANEL_HOME_CONTENT.cta` is inspected
- **THEN** `cta.href` equals `"/contacto"`
- **AND** `cta.label` equals `"SOLICITAR ASESORÍA TÉCNICA"`
- **AND** `cta.variant` equals `"primary"`

#### Scenario: Each stat label is uppercase
- **WHEN** `PANEL_HOME_CONTENT.stats` is inspected
- **THEN** each element's `label` matches the regex `/^[A-ZÁÉÍÓÚÑ0-9\s+]+$/` (uppercase letters, digits, spaces and the plus sign only)

### Requirement: PanelHome integrates into the home page after the HeroBanner
The `apps/web/src/pages/index.astro` SHALL render `<HeroBanner {...HERO_BANNER_CONTENT} />` followed by `<PanelHome {...PANEL_HOME_CONTENT} />` inside its `<Layout>` slot. The PanelHome SHALL NOT replace the HeroBanner; both render on the home page.

#### Scenario: Home page renders both HeroBanner and PanelHome
- **WHEN** a visitor loads `/` (the home page)
- **THEN** the rendered HTML contains the HeroBanner `<section>` (with the hero headline, subtitle and CTAs)
- **AND** the rendered HTML contains the PanelHome `<section>` (with the panel headline, description, CTA and 4 stats)

#### Scenario: PanelHome renders after the HeroBanner in the DOM
- **WHEN** the home page renders
- **THEN** the rendered HTML keeps the existing order: `<TopHeader />`, then `<header>` (site-header), then the SearchForm `<div role="search">`, then the HeroBanner `<section>`, then the PanelHome `<section>`
- **AND** the count of `<header>` elements in the document is still exactly one (no new landmark is introduced)
