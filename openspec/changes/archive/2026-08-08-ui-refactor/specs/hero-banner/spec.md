## MODIFIED Requirements

### Requirement: HeroBanner renders the headline with the highlighted word in a distinct color
The `hero-banner` SHALL render an `<h1>` whose visible text equals `headline` followed by `highlightedWord`, where `highlightedWord` is wrapped in a `<span>` carrying the `text-primary` class (resolving to `--color-primary` `#41B3C4`) so it visually stands out from the rest of the headline. The `<h1>` SHALL apply the heading font via `font-heading` (Montserrat) con peso `font-bold` (700) según la escala tipográfica canónica. The obsolete utility `text-brand-teal` and references to `--color-brand-teal` SHALL NOT appear. The component SHALL NOT render any background `<picture>`/image or overlay; the application shell provides all backgrounds.

#### Scenario: Highlighted word uses primary token
- **WHEN** the HeroBanner renders with headline "Innovación que Fluye" and highlightedWord "Fluye"
- **THEN** the `<h1>` contains a `<span>` element wrapping "Fluye"
- **AND** that `<span>` carries the `text-primary` class (resolving to `#41B3C4`)
- **AND** the `<h1>` carries `font-heading` and `font-bold` classes (Montserrat 700)
- **AND** the rendered HTML does NOT contain the class `text-brand-teal`
- **AND** the rendered HTML does NOT contain a `<picture>` element

### Requirement: HeroBanner renders subtitle and description in subordinate headings and paragraphs
The `hero-banner` SHALL render `subtitle` as an `<h2>` directly subordinate to the `<h1>`, with a constrained maximum width, applying la heading font via `font-heading` (Montserrat) con peso `font-semibold` (600). `description` SHALL render as a `<p>` with reduced opacity (Open Sans body implícito, `font-body` heredado), both inside the same `<section>` as the headline. Neither SHALL introduce a new background layer.

#### Scenario: Subtitle renders as h2 with constrained width
- **WHEN** the HeroBanner renders with `subtitle="Experiencia, tecnología y control en medición de fluidos y tratamientos de agua."`
- **THEN** an `<h2>` element is rendered containing the subtitle text verbatim
- **AND** the `<h2>` carries `font-heading` and `font-semibold` classes (Montserrat 600)
- **AND** the `<h2>` carries a class that constrains its max width (e.g. `max-w-3xl`) so it does not span the full row on desktop

#### Scenario: Description renders as a paragraph with reduced opacity
- **WHEN** the HeroBanner renders with `description="Desarrollamos soluciones..."`
- **THEN** a `<p>` element is rendered containing the description text verbatim
- **AND** the `<p>` carries a class expressing reduced opacity relative to the subtitle (e.g. `text-white/80`)
- **AND** the `<p>` carries a class constraining its max width (e.g. `max-w-2xl`)

### Requirement: HeroBanner renders two CTA buttons with primary and secondary variants
The `hero-banner` SHALL render one `<a>` per element of the `ctas` prop, where the element with `variant: 'primary'` carries the `bg-primary` background token (resolving to `#41B3C4`) and the element with `variant: 'secondary'` carries a white border with no fill. Ambos CTAs SHALL apply la heading font via `font-heading` (Montserrat) con peso `font-semibold` (600), `text-xs` size y `uppercase tracking-wide` per la escala tipográfica canónica. Los CTAs SHALL NOT apply `rounded` (flat design con radio 0). The obsolete utilities `bg-brand-teal` and references to `--color-brand-teal` SHALL NOT appear in any CTA.

#### Scenario: Primary CTA uses bg-primary
- **WHEN** the HeroBanner renders a primary-variant CTA
- **THEN** the `<a>` element carries `bg-primary` (resolving to `#41B3C4`)
- **AND** its class string contains `font-heading` and `font-semibold`
- **AND** its class string does NOT contain `rounded` (nor `rounded-*`)
- **AND** its class string does NOT contain `bg-brand-teal`

#### Scenario: Secondary CTA keeps white border
- **WHEN** the HeroBanner renders a secondary-variant CTA
- **THEN** the `<a>` element has a white border (`border-2 border-white`) with no fill
- **AND** the CTA is keyboard focusable
- **AND** its class string does NOT contain `rounded` (nor `rounded-*`)

#### Scenario: CTA container stacks on mobile and rows on sm+
- **WHEN** the HeroBanner renders
- **THEN** the CTA container carries `flex-col sm:flex-row`
