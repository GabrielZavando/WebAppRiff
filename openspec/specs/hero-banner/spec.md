# hero-banner Specification

## Purpose
Sección hero del home del sitio público Astro. Componente presentacional (dumb) que renderiza headline + palabra destacada, subtítulo, descripción y dos CTAs (primario teal + secundario outline blanco) sobre un fondo navy generado con CSS placeholder (sin imagen externa). Layout responsivo (mobile stacked, desktop horizontal). Headline único `<h1>` de la home, subtítulo `<h2>` subordinado.
## Requirements
### Requirement: HeroBanner renders the headline with the highlighted word in a distinct color
The `hero-banner` SHALL render an `<h1>` whose visible text equals `headline` followed by `highlightedWord`, where `highlightedWord` is wrapped in a `<span>` carrying the `text-brand-teal` class so it visually stands out from the rest of the headline.

#### Scenario: Highlighted word appears in the middle of the headline
- **WHEN** the HeroBanner renders with `headline="Innovación que Fluye"` and `highlightedWord="Fluye"`
- **THEN** the rendered `<h1>` contains the literal text "Innovación que " followed by a `<span class="text-brand-teal">Fluye</span>`
- **AND** the visible concatenated text reads "Innovación que Fluye" (the original single space is preserved, no extra whitespace is introduced by the split)

#### Scenario: Highlighted word appears at the start of the headline
- **WHEN** the HeroBanner renders with `headline="Fluye con nosotros"` and `highlightedWord="Fluye"`
- **THEN** the rendered `<h1>` contains a `<span class="text-brand-teal">Fluye</span>` followed by the literal text " con nosotros"
- **AND** the visible concatenated text reads "Fluye con nosotros"

#### Scenario: Highlighted word appears at the end of the headline
- **WHEN** the HeroBanner renders with `headline="Innovación que Fluye"` and `highlightedWord="Fluye"`
- **THEN** the rendered `<h1>` shows the literal "Innovacion que " (trimmed) followed by `<span class="text-brand-teal">Fluye</span>`
- **AND** the visible concatenated text reads "Innovación que Fluye"

#### Scenario: Highlighted word not present in headline does not break the render
- **WHEN** the HeroBanner renders with `headline="Bienvenido"` and `highlightedWord="Fluye"`
- **THEN** the rendered `<h1>` contains the literal text "Bienvenido"
- **AND** NO `<span class="text-brand-teal">` element is rendered

#### Scenario: Only the first occurrence of the highlighted word is highlighted
- **WHEN** the HeroBanner renders with `headline="Fluye y vuelve a Fluye"` and `highlightedWord="Fluye"`
- **THEN** the rendered `<h1>` contains exactly one `<span class="text-brand-teal">Fluye</span>`
- **AND** the second occurrence of "Fluye" remains plain text without the span

### Requirement: HeroBanner renders subtitle and description in subordinate headings and paragraphs
The `hero-banner` SHALL render `subtitle` as an `<h2>` directly subordinate to the `<h1>`, with a constrained maximum width, and `description` as a `<p>` with reduced opacity, both inside the same `<section>` as the headline.

#### Scenario: Subtitle renders as h2 with constrained width
- **WHEN** the HeroBanner renders with `subtitle="Experiencia, tecnología y control en medición de fluidos y tratamientos de agua."`
- **THEN** an `<h2>` element is rendered containing the subtitle text verbatim
- **AND** the `<h2>` carries a class that constrains its max width (e.g. `max-w-3xl`) so it does not span the full row on desktop

#### Scenario: Description renders as a paragraph with reduced opacity
- **WHEN** the HeroBanner renders with `description="Desarrollamos soluciones..."`
- **THEN** a `<p>` element is rendered containing the description text verbatim
- **AND** the `<p>` carries a class expressing reduced opacity relative to the subtitle (e.g. `text-white/80`)
- **AND** the `<p>` carries a class constraining its max width (e.g. `max-w-2xl`)

### Requirement: HeroBanner renders two CTA buttons with primary and secondary variants
The `hero-banner` SHALL render one `<a>` per element of the `ctas` prop, where the element with `variant: 'primary'` carries the `bg-brand-teal` background token and the element with `variant: 'secondary'` carries a white border with no fill, both with uppercase labels.

#### Scenario: Primary CTA renders with teal background
- **WHEN** the HeroBanner renders with `ctas` containing one element `{ label: "VER SERVICIOS", href: "/servicios", variant: "primary" }`
- **THEN** the rendered `<a href="/servicios">` carries a class containing `bg-brand-teal`
- **AND** its visible text equals "VER SERVICIOS"
- **AND** the text color class is `text-white`

#### Scenario: Secondary CTA renders with white border and no fill
- **WHEN** the HeroBanner renders with `ctas` containing one element `{ label: "ESCRÍBENOS", href: "/contacto", variant: "secondary" }`
- **THEN** the rendered `<a href="/contacto">` carries a class containing `border-white` (or `border-2 border-white`)
- **AND** its visible text equals "ESCRÍBENOS"
- **AND** the element does NOT carry any `bg-brand-teal` or `bg-*` fill class

#### Scenario: CTAs render in the order provided by the prop
- **WHEN** the HeroBanner renders with `ctas` in order `[primary, secondary]`
- **THEN** the primary `<a>` appears in the DOM before the secondary `<a>`

#### Scenario: CTA container stacks on mobile and lays out horizontally on `sm:` and up
- **WHEN** the HeroBanner renders
- **THEN** the CTAs are wrapped in a single container element
- **AND** the container carries a layout class that stacks vertically on mobile (`flex-col`) and switches to horizontal on small breakpoints and up (`sm:flex-row`)

### Requirement: HeroBanner uses a CSS-only placeholder background, no external image
The `hero-banner` SHALL render its background using Tailwind CSS utilities only (gradients and overlays), without referencing any external image file, URL, or asset, so the build has zero new external dependencies.

#### Scenario: Hero section uses gradient utilities for the background
- **WHEN** the HeroBanner renders
- **THEN** the outermost `<section>` carries Tailwind classes expressing a gradient background (e.g. `bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-navy`)
- **AND** no `<img>`, `<picture>`, or inline `style="background-image: url(...)"` attribute is present referencing an external asset

#### Scenario: Background covers the full hero height with no seams
- **WHEN** the HeroBanner renders
- **THEN** the background layer element(s) carry an `absolute inset-0` (or equivalent) class so they fill the entire `<section>` area
- **AND** the content layer above has `relative` positioning so it sits on top of the background

### Requirement: HeroBanner layout is responsive across viewports
The `hero-banner` SHALL scale its typography and spacing based on the viewport: smaller on mobile (< 768px) and larger on desktop (>= 768px), with the CTA container switching between stacked and inline layouts at the `sm` breakpoint.

#### Scenario: Mobile uses small typography and stacked CTAs
- **WHEN** the HeroBanner renders on a viewport < 768px
- **THEN** the `<h1>` carries a class constraining its size to `text-4xl` (or the equivalent base size at mobile)
- **AND** the CTA container uses `flex-col` layout so each CTA occupies a full row

#### Scenario: Desktop uses large typography and inline CTAs
- **WHEN** the HeroBanner renders on a viewport >= 768px
- **THEN** the `<h1>` carries a responsive class scaling up to `md:text-6xl`
- **AND** the CTA container uses `sm:flex-row` layout so the CTAs sit side by side

#### Scenario: Section padding scales with viewport
- **WHEN** the HeroBanner renders
- **THEN** the content wrapper inside the section carries vertical padding that scales responsively (e.g. `py-16` on mobile, `md:py-24` on desktop)

### Requirement: HeroBanner is keyboard and screen-reader accessible
The `hero-banner` SHALL use semantic HTML so it is operable with the keyboard and consumable by screen readers without extra ARIA attributes: single `<h1>` for the page, `<h2>` subordinate, and focusable CTAs in DOM order.

#### Scenario: Exactly one h1 on the page
- **WHEN** the home page renders with the HeroBanner
- **THEN** the document contains exactly one `<h1>` element (the hero headline)
- **AND** the hero's subtitle is rendered as `<h2>` (not as another `<h1>`)

#### Scenario: CTAs are keyboard-focusable anchors
- **WHEN** the HeroBanner renders
- **THEN** each CTA is an `<a href="...">` element (focusable by default)
- **AND** Tab navigation moves through the CTAs in DOM order
- **AND** the CTAs do not carry `tabindex="-1"` or `aria-hidden="true"`

#### Scenario: Decorative background has no aria noise
- **WHEN** the HeroBanner renders
- **THEN** the background layer element(s) do NOT carry `role="img"`, `aria-label`, or `alt` attributes (the placeholder background is purely decorative)

### Requirement: HeroBanner content is configured via a hardcoded constant
The `hero-banner` content SHALL come from the `HERO_BANNER_CONTENT` constant in `lib/config/hero-banner.ts`, exported as `Readonly<HeroBannerProps>`, with exactly two CTAs (one primary and one secondary).

#### Scenario: HERO_BANNER_CONTENT exposes the full set of props
- **WHEN** `HERO_BANNER_CONTENT` is imported
- **THEN** it has the shape `{ headline: string; highlightedWord: string; subtitle: string; description: string; ctas: readonly HeroCta[] }`
- **AND** `headline` and `highlightedWord` are non-empty strings
- **AND** `headline` contains `highlightedWord` as a substring OR `highlightedWord` is empty (edge case handled by `splitHeadline`)

#### Scenario: HERO_BANNER_CONTENT.ctas has exactly two CTAs (primary + secondary)
- **WHEN** `HERO_BANNER_CONTENT.ctas` is inspected
- **THEN** it has length `2`
- **AND** the first element has `variant: "primary"` (rendered as `VER SERVICIOS` with `href: "/servicios"`)
- **AND** the second element has `variant: "secondary"` (rendered as `ESCRÍBENOS` with `href: "/contacto"`)

#### Scenario: splitHeadline splits the headline on the first occurrence of the highlighted word
- **WHEN** `splitHeadline("Innovación que Fluye", "Fluye")` is called
- **THEN** it returns `["Innovación que ", ""]` so the before-part goes plain and the highlighted word is wrapped, with no trailing text since "Fluye" appears at the end

#### Scenario: splitHeadline returns the original headline when the highlighted word is absent
- **WHEN** `splitHeadline("Bienvenido", "Fluye")` is called
- **THEN** it returns `["Bienvenido", ""]` so the component renders the plain headline with no highlighted span

#### Scenario: splitHeadline highlights only the first occurrence when the word appears multiple times
- **WHEN** `splitHeadline("Fluye y vuelve a Fluye", "Fluye")` is called
- **THEN** it returns `["", " y vuelve a Fluye"]` so only the first "Fluye" is rendered in the highlighted span

### Requirement: HeroBanner integrates into the home page replacing the placeholder content
The `apps/web/src/pages/index.astro` SHALL render `<HeroBanner {...HERO_BANNER_CONTENT} />` inside its `<Layout>` slot, replacing any pre-existing placeholder `<h1>` or `<p>` from the bootstrap phase.

#### Scenario: Home page renders the HeroBanner instead of the placeholder
- **WHEN** a visitor loads `/` (the home page)
- **THEN** the rendered HTML contains a `<section>` (the hero) wrapping the configured headline, subtitle and CTAs
- **AND** the legacy placeholder text "Proyecto en desarrollo — Fase A: Bootstrap completado" is NOT present in the document

#### Scenario: HeroBanner renders after the existing header landmarks in the DOM
- **WHEN** the home page renders
- **THEN** the rendered HTML keeps the existing order: `<TopHeader />`, then `<header>` (from site-header), then the SearchForm `<div role="search">`, then the hero `<section>` from the HeroBanner
- **AND** the count of `<header>` elements in the document is still exactly one (the SearchForm remains in its own `role="search"` landmark)

