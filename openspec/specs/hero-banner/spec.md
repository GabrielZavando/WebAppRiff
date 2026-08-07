# hero-banner Specification

## Purpose
Sección hero del home del sitio público Astro. Componente presentacional (dumb) que renderiza headline + palabra destacada, subtítulo, descripción y dos CTAs (primario teal + secundario outline blanco). No incluye imagen de fondo ni overlay: el fondo y la cobertura full-viewport los aporta el shell hero del Layout (capability `home-hero-shell`), que envuelve imagen `bg-secondary/80` detrás de los headers transparentes. Layout responsivo (mobile stacked, desktop horizontal). Headline único `<h1>` de la home, subtítulo `<h2>` subordinado.
## Requirements
### Requirement: HeroBanner renders the headline with the highlighted word in a distinct color
The `hero-banner` SHALL render an `<h1>` whose visible text equals `headline` followed by `highlightedWord`, where `highlightedWord` is wrapped in a `<span>` carrying the `text-primary` class (resolving to `--color-primary` `#41B3C4`) so it visually stands out from the rest of the headline. The obsolete utility `text-brand-teal` and references to `--color-brand-teal` SHALL NOT appear. The component SHALL NOT render any background `<picture>`/image or overlay; the application shell provides all backgrounds.

#### Scenario: Highlighted word uses primary token
- **WHEN** the HeroBanner renders with headline "Innovación que Fluye" and highlightedWord "Fluye"
- **THEN** the `<h1>` contains a `<span>` element wrapping "Fluye"
- **AND** that `<span>` carries the `text-primary` class (resolving to `#41B3C4`)
- **AND** the rendered HTML does NOT contain the class `text-brand-teal`
- **AND** the rendered HTML does NOT contain a `<picture>` element

### Requirement: HeroBanner renders subtitle and description in subordinate headings and paragraphs
The `hero-banner` SHALL render `subtitle` as an `<h2>` directly subordinate to the `<h1>`, with a constrained maximum width, and `description` as a `<p>` with reduced opacity, both inside the same `<section>` as the headline. Neither SHALL introduce a new background layer.

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
The `hero-banner` SHALL render one `<a>` per element of the `ctas` prop, where the element with `variant: 'primary'` carries the `bg-primary` background token (resolving to `#41B3C4`) and the element with `variant: 'secondary'` carries a white border with no fill, both with uppercase labels. The obsolete utilities `bg-brand-teal` and references to `--color-brand-teal` SHALL NOT appear in any CTA.

#### Scenario: Primary CTA uses bg-primary
- **WHEN** the HeroBanner renders a primary-variant CTA
- **THEN** the `<a>` element carries `bg-primary` (resolving to `#41B3C4`)
- **AND** its class string does NOT contain `bg-brand-teal`

#### Scenario: Secondary CTA keeps white border
- **WHEN** the HeroBanner renders a secondary-variant CTA
- **THEN** the `<a>` element has a white border (`border-2 border-white`) with no fill
- **AND** the CTA is keyboard focusable

#### Scenario: CTA container stacks on mobile and rows on sm+
- **WHEN** the HeroBanner renders
- **THEN** the CTA container carries `flex-col sm:flex-row`

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

### Requirement: HeroBanner has no built-in background image or overlay
The `hero-banner` SHALL NOT render a `<picture>`, overlay `div` or any image import. Where the home needs a background, the application shell (capability `home-hero-shell`) provides it.

#### Scenario: No picture element rendered
- **WHEN** the HeroBanner renders
- **THEN** the rendered HTML does NOT contain a `<picture>` tag
- **AND** does NOT contain `bg-secondary/60` nor `bg-secondary/80` in any class

### Requirement: HeroBanner is keyboard and screen-reader accessible
The `hero-banner` SHALL use semantic HTML so it is operable with the keyboard and consumable by screen readers: single `<h1>` for the page, `<h2>` subordinate, and focusable CTAs in DOM order. Background imagery and its decorative overlay are handled by the application shell (`home-hero-shell`), not by this component.

#### Scenario: Exactly one h1 on the page
- **WHEN** the home page renders with the HeroBanner
- **THEN** the document contains exactly one `<h1>` element (the hero headline)
- **AND** the hero's subtitle is rendered as `<h2>` (not as another `<h1>`)

#### Scenario: CTAs are keyboard-focusable anchors
- **WHEN** the HeroBanner renders
- **THEN** each CTA is an `<a href="...">` element (focusable by default)
- **AND** Tab navigation moves through the CTAs in DOM order
- **AND** the CTAs do not carry `tabindex="-1"` or `aria-hidden="true"`

#### Scenario: No background imagery inside the hero component
- **WHEN** the HeroBanner renders
- **THEN** the component renders no `<picture>`, no `<img>`, and no overlay `<div>`
- **AND** no `aria-hidden` overlay element is introduced by the hero section

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
The home page SHALL render `<HeroBanner {...HERO_BANNER_CONTENT} />` inside its hero shell Layout (see `home-hero-shell`), replacing any pre-existing placeholder `<h1>` or `<p>` from the bootstrap phase.

#### Scenario: Home page renders the HeroBanner with headers above
- **WHEN** a visitor loads `/` (the home page)
- **THEN** the rendered HTML contains a `<section>` (the hero) wrapping the configured headline, subtitle and CTAs
- **AND** the DOM order is: hero shell (with `bg-secondary/80` overlay), `TopHeader`, `<header>` (from site-header), SearchForm `<div role="search">`, then the hero `<h1>` block
- **AND** exactly one `<header>` element exists in the document
- **AND** the legacy placeholder text "Proyecto en desarrollo — Fase A: Bootstrap completado" is NOT present

