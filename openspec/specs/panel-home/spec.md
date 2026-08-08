# panel-home Specification

## Purpose
TBD - created by archiving change panel-home. Update Purpose after archive.
## Requirements
### Requirement: PanelHome renders the left half with eyebrow, headline, description and a navy CTA over a teal background
The `panel-home` SHALL render its left half as a `<div>` (or equivalent) carrying the `bg-primary` class (resolving to `--color-primary` `#41B3C4`), containing un eyebrow `<span>` (uppercase, not a heading) que aplica la heading font via `font-heading` (Montserrat) con peso `font-semibold` y size `text-xs tracking-wider`, a headline `<h2>` que aplica `font-heading font-bold`, a description `<p>` (Open Sans body implícito), and a single CTA `<a href="/contacto">` styled with `bg-secondary text-white font-heading font-semibold` (Montserrat 600, `text-xs uppercase tracking-wide`). The CTA SHALL NOT apply `rounded` (flat design con radio 0). The eyebrow SHALL NOT be rendered as a heading element (`<h1>`–`<h6>`). The obsolete utilities `bg-brand-teal` and `bg-brand-navy`, and references to `--color-brand-teal` / `--color-brand-navy`, SHALL NOT appear anywhere in the panel.

#### Scenario: Left half uses primary (not brand-teal)
- **WHEN** the PanelHome renders
- **THEN** the left half `<div>` carries `bg-primary` (computing to `rgb(65, 179, 196)`)
- **AND** its class string does NOT contain `bg-brand-teal`

#### Scenario: CTA uses secondary, flat square corners
- **WHEN** the PanelHome renders the `/contacto` CTA
- **THEN** the CTA `<a>` carries `bg-secondary text-white` (computing to `rgb(31, 45, 64)`)
- **AND** the CTA `<a>` carries `font-heading` and `font-semibold` classes (Montserrat 600)
- **AND** the CTA `<a>` does NOT contain `rounded` (nor any `rounded-*` variant) in its class
- **AND** its class string does NOT contain `bg-brand-navy`

#### Scenario: Eyebrow and headline use heading font
- **WHEN** the PanelHome renders the left half
- **THEN** the eyebrow `<span>` carries `font-heading` and `font-semibold` classes
- **AND** the headline `<h2>` carries `font-heading` and `font-bold` classes

### Requirement: PanelHome renders the right half with a 2×2 grid of four statistics over a white background
The `panel-home` SHALL render its right half as a `<div>` (or equivalent) carrying the `bg-white` class, containing exactly four stat cells laid out in a `grid-cols-2` grid (2 rows × 2 columns). Each stat cell SHALL render the `value` as a large bold paragraph con la heading font via `font-heading font-bold` (Montserrat 700) y class `text-secondary` (instead of the obsolete `text-brand-navy`), and the `label` as a small uppercase paragraph below it que aplica la body font implícita (`font-body`, Open Sans) y el token `text-text-2` (#5C6675) en lugar de la paleta por defecto Tailwind `text-gray-*`. The grid SHALL keep `grid-cols-2` across all viewports (mobile and desktop).

#### Scenario: Stat value uses secondary and heading font
- **WHEN** the PanelHome renders a stat cell
- **THEN** the value `<p>` carries `text-secondary` (resolving to `#1F2D40`)
- **AND** the value `<p>` carries `font-heading` and `font-bold` classes (Montserrat 700)
- **AND** its class string does NOT contain `text-brand-navy`

#### Scenario: Stat label uses text-text-2 (no gray-*)
- **WHEN** the PanelHome renders a stat cell
- **THEN** the label `<p>` carries the `text-text-2` class (resolving to `#5C6675`)
- **AND** the label `<p>` does NOT contain `text-gray-600`, `text-gray-700` nor any `text-gray-*` literal en su class string

### Requirement: PanelHome meets WCAG AA contrast between white text and the teal background
The `panel-home` SHALL meet WCAG AA contrast requirements between white text (`#FFFFFF`) and the teal background of the left half (now `--color-primary` `#41B3C4`):

- The headline `<h2>` (bold, fontsize ≥ 18pt) SHALL meet WCAG AA Large (contrast ratio ≥ 3:1) against the teal background.
- The description `<p>` SHALL meet WCAG AA Normal (contrast ratio ≥ 4.5:1) against the teal background. The opacity MAY be adjusted (e.g. `text-white/90` or solid `text-white`) to meet the threshold, OR — if the primary token `#41B3C4` cannot meet AA Normal even with solid white text — the background of the left half SHALL fall back to `--color-primary-darker` (`#227E8E`, ratio ≈ 3.95:1 to white) only when the AA Large fallback is required for text body.

The `test.skip()` calls in `apps/web/e2e/panel-home.spec.ts` for tasks 4.13 and 4.14 of the archived `panel-home` change SHALL be removed; the corresponding tests SHALL pass with the new tokens.

#### Scenario: h2 white text meets WCAG AA Large on teal background
- **WHEN** the Playwright E2E test 4.13 runs against the rendered PanelHome
- **THEN** the computed `color` (expected `rgb(255, 255, 255)`) and `background-color` (expected to resolve from `--color-primary` `#41B3C4`) of the `<h2>` are read via `getComputedStyle`
- **AND** the WCAG contrast ratio between them is ≥ 3.0
- **AND** the test runs (not `test.skip()`ed)

#### Scenario: description <p> meets WCAG AA Normal on teal background
- **WHEN** the Playwright E2E test 4.14 runs against the rendered PanelHome
- **THEN** the computed `color` and `background-color` of the description `<p>` are read via `getComputedStyle`
- **AND** the WCAG contrast ratio is ≥ 4.5
- **OR** if the primary token `#41B3C4` with solid white text does not reach 4.5:1, the left half background is overridden locally to `--color-primary-darker` `#227E8E` and the test passes
- **AND** the test runs (not `test.skip()`ed)

#### Scenario: panel-home spec file contains no test.skip for 4.13/4.14
- **WHEN** the source of `apps/web/e2e/panel-home.spec.ts` is inspected
- **THEN** no `test.skip()` call exists for the tests named "WCAG AA Large contrast: h2 white text on teal background (4.13)" nor "WCAG AA Normal contrast: description <p> on teal; verify and adjust if failing (4.14)"
- **AND** the tests are defined with a regular `test(...)` call and execute in CI

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

