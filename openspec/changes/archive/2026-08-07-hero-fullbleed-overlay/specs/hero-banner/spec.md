## REMOVED Requirements

### Requirement: HeroBanner renders the real industrial background image with the Astro Picture component
**Reason**: El fondo de primera pantalla se traslada al shell del Layout de la home (capability `home-hero-shell`). La imagen no puede vivir en HeroBanner (que se renderiza después de los headers) para quedar detrás de TopHeader/Header/SearchForm.
**Migration**: `apps/web/src/components/HeroBanner.astro` deja de renderizar `<Picture>`, overlay y `md:min-h-screen`. El wrapper con la imagen + `bg-secondary/80` vive en el Layout de la home (modo `hero`). La home sigue renderizando `<HeroBanner {...HERO_BANNER_CONTENT} />`; los headers llevan `transparent`.

### Requirement: HeroBanner section covers the full viewport height on md+ while remaining content-driven on mobile
**Reason**: La altura de pantalla completa es propiedad del shell del Layout que envuelve imagen + headers + content; ya no del section del HeroBanner.
**Migration**: Los tests del componente dejan de afirmar `md:min-h-screen`/`md:flex`/`lg:py-32` en el componente; el shell del cambio asegura la cobertura del viewport.

## MODIFIED Requirements

### Requirement: HeroBanner renders the headline with the highlighted word in a distinct color
The `hero-banner` SHALL render an `<h1>` whose visible text equals `headline` followed by `highlightedWord`, where `highlightedWord` is wrapped in a `<span>` carrying the `text-primary` class (resolving to `--color-primary` `#41B3C4`). The obsolete utility `text-brand-teal` SHALL NOT appear. The component SHALL NOT render any background `<picture>`/image or overlay; the application shell provides all backgrounds.

#### Scenario: Highlighted word uses primary token
- **WHEN** the HeroBanner renders with headline "Innovación que Fluye" and highlightedWord "Fluye"
- **THEN** the `<h1>` contains a `<span>` wrapping "Fluye" with class `text-primary`
- **AND** the rendered HTML does NOT contain `text-brand-teal`
- **AND** the rendered HTML does NOT contain a `<picture>` element

### Requirement: HeroBanner renders subtitle and description in subordinate headings and paragraphs
The `hero-banner` SHALL keep the existing behavior: `subtitle` renders as an `<h2>` with constrained width, `description` renders as a `<p>` with reduced opacity; neither SHALL introduce a new background layer.

#### Scenario: Subtitle renders as h2 with constrained width
- **WHEN** the HeroBanner renders with `subtitle`
- **THEN** an `<h2>` is rendered with a max-width class (e.g. `max-w-3xl`)

#### Scenario: Description renders as a paragraph with reduced opacity
- **WHEN** the HeroBanner renders with `description`
- **THEN** a `<p>` is rendered with `text-white/80` and a `max-w-2xl` class

### Requirement: HeroBanner renders two CTA buttons with primary and secondary variants
The `hero-banner` SHALL render one `<a>` per `ctas` prop; primary carries `bg-primary`, secondary carries a white border, both uppercase.

#### Scenario: Primary CTA uses bg-primary
- **WHEN** the HeroBanner renders a primary-variant CTA
- **THEN** the `<a>` element carries `bg-primary`
- **AND** its class string does NOT contain `bg-brand-teal`

#### Scenario: Secondary CTA keeps white border
- **WHEN** the HeroBanner renders a secondary-variant CTA
- **THEN** the `<a>` element has `border-2 border-white` with no fill
- **AND** the CTA is keyboard focusable

#### Scenario: CTA container stacks on mobile and rows on sm+
- **WHEN** the HeroBanner renders
- **THEN** the CTA container carries `flex-col sm:flex-row`

## ADDED Requirements

### Requirement: HeroBanner has no built-in background image or overlay
The `hero-banner` SHALL NOT render a `<picture>`, overlay `div` or any image import. Where the home needs a background, the application shell (caps `home-hero-shell`) provides it.

#### Scenario: No picture element rendered
- **WHEN** the HeroBanner renders
- **THEN** the rendered HTML does NOT contain a `<picture>` tag
- **AND** does NOT contain `bg-secondary/60` nor `bg-secondary/80` in any class

### Requirement: HeroBanner integrates into the home page replacing the placeholder content
The home page SHALL render `<HeroBanner {...HERO_BANNER_CONTENT} />` inside its hero shell Layout.

#### Scenario: Home page renders the HeroBanner with headers above
- **WHEN** the home page renders
- **THEN** the document keeps order: `hero-shell`, `TopHeader`, `<header>`, SearchForm `role="search"`, then the hero `<h1>` block
- **AND** exactly one `<header>` element exists
- **AND** the legacy placeholder "Proyecto en desarrollo — Fase A: Bootstrap completado" is NOT present