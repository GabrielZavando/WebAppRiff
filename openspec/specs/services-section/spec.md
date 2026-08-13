# services-section Specification

## Purpose
TBD - created by archiving change services-section. Update Purpose after archive.
## Requirements
### Requirement: ServicesSection renders as a flat dark section with vertical padding
The `services-section` SHALL render a `<section>` as its outermost element carrying vertical padding utilities (`py-16 md:py-24`) and the deep teal background token `bg-primary-deep` (`--color-primary-deep: #006874`). The section SHALL NOT apply negative margin / overlap (unlike `PanelHome`) — it is a flat block with a hard color transition from the light `bg-bg` of `SolutionSection` above. The section SHALL contain a single inner container using the canonical container utilities (`mx-auto px-4 sm:px-6 lg:px-8` and the `max-w-7xl` constraint expressed by the `container` utility). (MODIFIED in `site-favicon-and-bg-swap`: the section background token changes from `bg-secondary-dark` (navy) to `bg-primary-deep` (deep teal) so the services block reads as a more prominent teal band and the subsequent `DestacadosSection` becomes the navy anchor of the home — see also the mirrored change in the `destacados-section` spec.)

#### Scenario: Section is the outermost element
- **WHEN** the ServicesSection renders
- **THEN** the outermost element of the rendered HTML is a `<section>`
- **AND** the `<section>` is NOT nested inside another `<section>` produced by the component itself

#### Scenario: Section carries vertical padding utilities
- **WHEN** the ServicesSection renders
- **THEN** the `<section>` opening tag carries a class expressing mobile vertical padding (e.g. `py-16`)
- **AND** the `<section>` opening tag carries a class expressing a larger vertical padding at the `md` breakpoint (e.g. `md:py-24`)

#### Scenario: Section uses the deep teal background token
- **WHEN** the ServicesSection renders
- **THEN** the `<section>` opening tag carries a class expressing the deep teal background token (e.g. `bg-primary-deep`)
- **AND** the rendered HTML does NOT contain the lighter `bg-bg` utility on the section's outermost element
- **AND** the rendered HTML does NOT contain the `bg-secondary-dark` utility on the section's outermost element (the deep teal is the new background; the navy token belongs to `DestacadosSection` after the swap)

#### Scenario: Section uses the canonical container for inner width
- **WHEN** the ServicesSection renders
- **THEN** the section contains an inner `<div>` carrying the `container` class (or the equivalent `mx-auto px-4 sm:px-6 lg:px-8` plus `max-w-7xl` constraint)

### Requirement: ServicesSection renders a centered header with headline and description only (no eyebrow, no underline)
The `services-section` SHALL render a header block centered horizontally (`text-center`) containing exactly two elements: a `<h3>` headline styled with the white color token (`text-white`) and the heading font token (`font-heading`); and a `<p>` description styled with the muted text color token (`text-muted`) and horizontal width constrained for readability (e.g. `max-w-2xl mx-auto`). The header SHALL NOT render an eyebrow `<span>` (no eyebrow is provided in the props). The header SHALL NOT render a teal underline `<div>` beneath the headline.

#### Scenario: Header is centered
- **WHEN** the ServicesSection renders
- **THEN** the header block (the wrapper of the `<h3>` and the description `<p>`) carries a class expressing text centering (e.g. `text-center`)

#### Scenario: Headline renders as an h3 with white color and heading font
- **WHEN** the ServicesSection renders with `headline="Servicios especializados"`
- **THEN** the header contains exactly one `<h3>` element whose visible text equals "Servicios especializados" verbatim
- **AND** the `<h3>` carries a class expressing the white color token (e.g. `text-white`)
- **AND** the `<h3>` carries the `font-heading` utility class
- **AND** the `<h3>` does NOT carry `aria-hidden="true"` or `tabindex="-1"`

#### Scenario: Description renders as a paragraph with the muted color token
- **WHEN** the ServicesSection renders with `description="Soluciones técnicas para instalación..."`
- **THEN** the header contains a `<p>` element whose visible text equals the description verbatim
- **AND** the `<p>` carries a class expressing the muted text color token (e.g. `text-muted`)
- **AND** the `<p>` carries a class constraining its horizontal width (e.g. `max-w-2xl`)

#### Scenario: Header does NOT render an eyebrow
- **WHEN** the ServicesSection renders
- **THEN** the header block does NOT contain any element whose visible text matches an eyebrow-style uppercase label (no "PORTAFOLIO"/"SERVICIOS"/etc. eyebrow is rendered)
- **AND** the rendered header does NOT contain a `<span>` or `<p>` carrying both `uppercase` and an `accent`-family text color (the SolutionSection eyebrow signature)

#### Scenario: Header does NOT render a teal underline bar
- **WHEN** the ServicesSection renders
- **THEN** the header does NOT contain a `<div>` carrying both a short horizontal bar utility (e.g. `h-1` and `w-16`) and the teal `bg-primary` background token (the SolutionSection underline signature)

### Requirement: ServicesSection renders a responsive 2x2 grid of service cards (mobile-first)
The `services-section` SHALL render a grid of `services` cards sized responsively mobile-first: 1 column on mobile (`< 768px`) and 2 columns at the `md` breakpoint (`>= 768px`). The grid container SHALL carry the Tailwind utility classes `grid-cols-1 md:grid-cols-2` and a consistent gap utility. The grid SHALL render exactly N `<article>` cards, where N equals the length of the `services` prop.

#### Scenario: Card grid uses responsive column classes (mobile-first)
- **WHEN** the ServicesSection renders with 4 services
- **THEN** the rendered card grid container carries `grid-cols-1` (mobile default)
- **AND** the rendered card grid container carries `md:grid-cols-2` (two columns at the `md` breakpoint)
- **AND** the rendered card grid container does NOT carry `sm:grid-cols-2` or `lg:grid-cols-4` (those belong to the SolutionSection layout, not this one)

#### Scenario: Grid renders exactly N cards matching the services prop length
- **WHEN** the ServicesSection renders with `services` of length 4
- **THEN** the card grid contains exactly 4 `<article>` elements
- **AND** each `<article>` contains the image, title, description and CTA elements described in the per-card requirements

### Requirement: Each ServicesSection card is a horizontal layout (image left, content right) with mobile fallback
Each card SHALL be an `<article>` carrying the flex layout utilities: `flex flex-col` by default (mobile — image stacks above content, full width) and `sm:flex-row` at `>= 640px` (image `w-2/5` on the left, content `flex-1` on the right — the mockup layout). The card SHALL have a `bg-secondary` background, a 1px `border` with the `border-secondary-light` token, and an `overflow-hidden` to clip the image cleanly. The card SHALL NOT apply any `shadow*` utility in its static state (flat design — shadows are reserved for floating layers per the style guide).

#### Scenario: Card uses bg-secondary and border-secondary-light tokens
- **WHEN** the ServicesSection renders a card
- **THEN** the `<article>` carries a class expressing the navy background token `bg-secondary`
- **AND** the `<article>` carries a class expressing a 1px border with the secondary-light token (e.g. `border border-secondary-light`)

#### Scenario: Card layout is flex column on mobile, flex row from sm
- **WHEN** the ServicesSection renders a card
- **THEN** the `<article>` carries the `flex` utility
- **AND** the `<article>` carries `flex-col` as the mobile default
- **AND** the `<article>` carries `sm:flex-row` for the horizontal layout at `>= 640px`

#### Scenario: Card does NOT apply a shadow utility
- **WHEN** the ServicesSection renders a card
- **THEN** the `<article>` opening tag does NOT carry any `shadow-*` utility class (no `shadow-1`, `shadow-2`, `shadow-3`, `shadow-4`, `shadow-5`)

#### Scenario: Card clips overflowing content
- **WHEN** the ServicesSection renders a card
- **THEN** the `<article>` carries the `overflow-hidden` utility so the image's square corners meet the flat card edge cleanly

### Requirement: Each ServicesSection card image is full-color, lazy-loaded, with a descriptive alt
Each card SHALL contain an `<Image>` rendered by `astro:assets` (or a `<Picture>`) carrying: `loading="lazy"` (the section is below the initial fold); a non-empty descriptive `alt` attribute matching the service's `imageAlt` prop value (NOT the card title); and responsive `widths`/`sizes` attributes generated by `astro:assets`. The image SHALL NOT use raw `<img src="...">` with a static path. (POST-APPLY UPDATE: the images SHALL be rendered in full color — the `grayscale` CSS filter is NOT applied, per client request the service photos display in their original colors.)

#### Scenario: Each card image is rendered in full color (no grayscale filter)
- **WHEN** the ServicesSection renders a card
- **THEN** the card's image element does NOT carry the `grayscale` utility class
- **AND** the computed CSS `filter` of the rendered image is not `grayscale(1)` (or contains no `grayscale` function)

#### Scenario: Each card image uses lazy loading
- **WHEN** the ServicesSection renders a card
- **THEN** the card's image element carries `loading="lazy"`

#### Scenario: Each card image carries a non-empty descriptive alt
- **WHEN** the ServicesSection renders a card with `imageAlt="..."`
- **THEN** the card's image element carries an `alt` attribute equal to the `imageAlt` prop value
- **AND** the `alt` value is non-empty
- **AND** the `alt` value is NOT identical to the card's `<h4>` visible text (it describes the photo, not the title)

#### Scenario: Images are processed by astro:assets (not raw src paths)
- **WHEN** the ServicesSection renders a card
- **THEN** the card's image element carries a `src` attribute resolving to a hashed/optimized path (e.g. `/_astro/...` or `/.astro/...`) rather than a raw `apps/web/src/assets/img/...` path
- **AND** the image element carries `width` and `height` attributes (explicit dimensions, generated by `astro:assets`)

### Requirement: Each ServicesSection card title renders as an h4 with the teal primary token
Each card SHALL render its `title` as an `<h4>` element (subordinate to the section `<h3>`). The `<h4>` SHALL carry the teal primary color token (`text-primary`) and the `font-heading` utility. The `<h4>` visible text SHALL equal the service's `title` prop verbatim.

#### Scenario: Each card title renders as an h4 with the primary color token
- **WHEN** the ServicesSection renders a card with `title="Medición en Edificios"`
- **THEN** the card contains an `<h4>` element whose visible text equals "Medición en Edificios" verbatim
- **AND** the `<h4>` carries a class expressing the teal primary color token (e.g. `text-primary`)
- **AND** the `<h4>` carries the `font-heading` utility class

### Requirement: Each ServicesSection card description renders as a paragraph with the muted color token
Each card SHALL render its `description` as a `<p>` element carrying the muted text color token (`text-muted`). The `<p>` visible text SHALL equal the service's `description` prop verbatim.

#### Scenario: Each card description renders as a paragraph with the muted color token
- **WHEN** the ServicesSection renders a card with `description="Instalación y recambio..."`
- **THEN** the card contains a `<p>` element whose visible text equals the description verbatim
- **AND** the `<p>` carries a class expressing the muted text color token (e.g. `text-muted`)

### Requirement: Each ServicesSection card CTA renders as the design-system solid primary button
Each card SHALL render an `<a>` CTA with the `href` attribute set to the service's `href` prop value. The CTA SHALL follow the design-system solid primary button pattern (same as `SolutionSection`'s "SABER MÁS" and `HeroBanner`'s "VER SERVICIOS" CTAs): a teal background token (`bg-primary`), hover darkening (`hover:bg-primary-dark`), white text (`text-white`), `inline-flex items-center gap-1`, `font-heading font-semibold uppercase`, `text-xs tracking-wide`, `px-6 py-3`, and `transition-colors`. (POST-APPLY UPDATE) The card CTA's visible text SHALL be "Ver detalles" (provided by the service's `ctaLabel` prop value). The CTA SHALL contain a decorative `lucide:arrow-right` icon with `aria-hidden="true"`; the link's accessible name is its visible text. The CTA SHALL NOT be a plain text link without background (e.g. only `text-accent` or `text-primary` without `bg-primary`).

#### Scenario: Each card CTA links to the service href
- **WHEN** the ServicesSection renders a card with `href="/servicios"`
- **THEN** the card contains an `<a>` element whose `href` attribute equals `"/servicios"`

#### Scenario: Each card CTA visible text is "Ver detalles"
- **WHEN** the ServicesSection renders a card with `ctaLabel="Ver detalles"`
- **THEN** the card CTA's visible text includes "Ver detalles"
- **AND** the card CTA visible text does NOT equal "Ver todos los servicios" (the bottom CTA label is distinct)

#### Scenario: Each card CTA follows the solid primary button pattern
- **WHEN** the ServicesSection renders a card
- **THEN** the card CTA `<a>` carries the `bg-primary` class
- **AND** the `<a>` carries the `hover:bg-primary-dark` class
- **AND** the `<a>` carries the `text-white` class
- **AND** the `<a>` carries the `inline-flex` class
- **AND** the `<a>` carries `px-6` and `py-3` padding utilities
- **AND** the `<a>` carries `font-heading`, `font-semibold`, `uppercase`, `text-xs`, `tracking-wide` utilities
- **AND** the `<a>` does NOT carry only a text color token without a background (e.g. NOT a `<a class="text-accent ...">` link, NOT a `<a class="text-primary ...">` link)

#### Scenario: Each card CTA includes a decorative arrow icon with aria-hidden
- **WHEN** the ServicesSection renders a card
- **THEN** the card CTA `<a>` contains an `<svg>` rendered by `astro-icon` from `lucide:arrow-right`
- **AND** the arrow `<svg>` carries `aria-hidden="true"`
- **AND** the `<a>` element itself does NOT carry `aria-hidden="true"` or `tabindex="-1"`

### Requirement: ServicesSection renders a centered bottom CTA button below the card grid
The `services-section` SHALL render a single `<a>` CTA element below the card grid, centered horizontally (`text-center` wrapper). The CTA SHALL follow the design-system solid primary button pattern with a slightly larger size than the per-card CTAs: `bg-primary hover:bg-primary-dark text-white inline-flex items-center gap-2 font-heading font-semibold uppercase text-sm tracking-wide px-8 py-4 transition-colors`. The CTA's visible text SHALL equal the `cta.label` prop value and its `href` attribute SHALL equal the `cta.href` prop value. The CTA SHALL contain a decorative `lucide:arrow-right` icon with `aria-hidden="true"`.

#### Scenario: Bottom CTA is centered below the grid
- **WHEN** the ServicesSection renders
- **THEN** the rendered HTML contains a `<div>` wrapper carrying the `text-center` utility AFTER the card grid container
- **AND** that wrapper contains the bottom CTA `<a>` element

#### Scenario: Bottom CTA links to the cta href
- **WHEN** the ServicesSection renders with `cta.href="/servicios"`
- **THEN** the bottom CTA `<a>` carries the `href` attribute equal to `"/servicios"`

#### Scenario: Bottom CTA visible text equals the cta label
- **WHEN** the ServicesSection renders with `cta.label="Ver todos los servicios"`
- **THEN** the bottom CTA `<a>` visible text includes "Ver todos los servicios"

#### Scenario: Bottom CTA follows the solid primary button pattern with larger padding
- **WHEN** the ServicesSection renders
- **THEN** the bottom CTA `<a>` carries the `bg-primary`, `hover:bg-primary-dark`, `text-white`, `inline-flex`, `items-center`, `gap-2`, `font-heading`, `font-semibold`, `uppercase`, `text-sm`, `tracking-wide`, `px-8`, `py-4`, `transition-colors` classes

#### Scenario: Bottom CTA includes a decorative arrow icon with aria-hidden
- **WHEN** the ServicesSection renders
- **THEN** the bottom CTA `<a>` contains an `<svg>` rendered by `astro-icon` from `lucide:arrow-right`
- **AND** the arrow `<svg>` carries `aria-hidden="true"`
- **AND** the `<a>` element itself does NOT carry `aria-hidden="true"` or `tabindex="-1"`

### Requirement: ServicesSection is a dumb presentational component
The `services-section` SHALL be a dumb component: it SHALL NOT perform any data fetching (no `fetch`, no Firestore calls), SHALL NOT read `import.meta.env` directly, and SHALL NOT hold reactive state. All data (`headline`, `description`, `services` array, `cta`) SHALL be received through typed props spread by the consuming page (`apps/web/src/pages/index.astro`).

#### Scenario: Component renders in isolation with all required props
- **WHEN** the ServicesSection is rendered via `AstroContainer.renderToString` with a complete `ServicesSectionProps` object containing 4 services and a `cta`
- **THEN** the rendered HTML contains the centered header, exactly 4 cards, and the bottom CTA
- **AND** the rendered HTML references the `headline`, `description`, and `cta.label` texts provided in the props

#### Scenario: Component frontmatter contains no import.meta.env access
- **WHEN** the source file `apps/web/src/components/ServicesSection.astro` is inspected
- **THEN** the frontmatter (between `---` fences) does NOT contain the literal string `import.meta.env`
- **AND** the frontmatter does NOT contain the literal string `fetch(`

### Requirement: ServicesSection consumes only canonical design tokens
The `services-section` SHALL consume design tokens declared in `apps/web/src/styles/globals.css` (`bg-secondary-dark`, `bg-secondary`, `border-secondary-light`, `text-primary`, `text-muted`, `text-white`, `bg-primary`, `text-accent`, `font-heading`). The component SHALL NOT use literal hex color values (e.g. `#41B3C4`, `#16202E`) anywhere in its markup or class attributes. The component SHALL NOT use the deprecated `brand-*` tokens (e.g. `bg-brand-teal`, `text-brand-navy`). The component SHALL NOT use any `rounded-*` utility (flat design — `--radius: 0`).

#### Scenario: No literal hex color values in the rendered HTML
- **WHEN** the ServicesSection renders
- **THEN** the rendered HTML does NOT contain any substring matching the regex `/#[0-9a-fA-F]{3,8}/`

#### Scenario: No deprecated brand-* tokens in the rendered HTML
- **WHEN** the ServicesSection renders
- **THEN** the rendered HTML does NOT contain any substring matching the regex `/brand-(teal|navy|orange|gray)/`

#### Scenario: No rounded-* utilities in the rendered HTML
- **WHEN** the ServicesSection renders
- **THEN** the rendered HTML does NOT contain any substring matching the regex `/rounded\b/` (the flat-design rule — `--radius: 0`)

### Requirement: ServicesSection preserves the home page heading outline
The `services-section` SHALL render its headline as `<h3>` (NOT `<h1>` and NOT `<h2>`), since the home page already has a single `<h1>` (owned by HeroBanner) and a single `<h2>` (owned by PanelHome). Each card title SHALL be rendered as `<h4>`, subordinate to the section `<h3>`. The component SHALL NOT introduce any new `<h1>` or `<h2>` elements. After this change, the home page SHALL contain exactly two `<h3>` elements: one owned by `SolutionSection` and one owned by `ServicesSection` (sibling portfolio sections).

#### Scenario: Heading counts after rendering the section in isolation
- **WHEN** the ServicesSection renders in isolation (no other components present)
- **THEN** the rendered HTML contains exactly one `<h3>` (the section headline)
- **AND** the rendered HTML contains exactly N `<h4>` elements, where N equals the length of `services` prop
- **AND** the rendered HTML contains zero `<h1>` elements
- **AND** the rendered HTML contains zero `<h2>` elements

#### Scenario: Headline is reachable via assistive technology (not aria-hidden)
- **WHEN** the ServicesSection renders
- **THEN** the `<h3>` headline element does NOT carry `aria-hidden="true"`
- **AND** the `<h3>` headline element does NOT carry `tabindex="-1"`

### Requirement: ServicesSection uses astro-icon and astro:assets pipelines
The `services-section` SHALL render all icons via `astro-icon` (using `<Icon name="lucide:..." />` from the Lucide icon set, stroke 2px, outline) and all images via `astro:assets` (using `<Image>` or `<Picture>` with the `sharp` service built into Astro). The component SHALL NOT install or import the deprecated `@astrojs/image` package. The component SHALL NOT use any icon set other than `lucide:*` (no `material-symbols:`, no `logos:`).

#### Scenario: All icons are Lucide arrow-right
- **WHEN** the ServicesSection renders
- **THEN** every `<svg>` rendered by `astro-icon` inside the component comes from `lucide:arrow-right`
- **AND** the rendered HTML does NOT contain any `material-symbols:` or `logos:` icon name

#### Scenario: Images are processed by astro:assets (not raw <img src=...>)
- **WHEN** the ServicesSection renders a card
- **THEN** the card's image element carries a `src` attribute resolving to a hashed/optimized path (e.g. `/_astro/...` or `/.astro/...`) rather than a raw `apps/web/src/assets/img/...` path
- **AND** the image element carries `width` and `height` attributes (explicit dimensions, generated by `astro:assets`)

### Requirement: ServicesSection content is configured via a hardcoded constant
The `services-section` content SHALL come from the `SERVICES_SECTION_CONTENT` constant in `lib/config/services-section.ts`, exported as `Readonly<ServicesSectionProps>`, containing exactly 4 services and the section header copy + the `cta` block. The 4 services SHALL be, in render order: "Medición en Edificios", "Medición Industrial", "Obras y Proyectos", "Tratamiento de Agua y Desalinización". Each service SHALL carry a `slug`, `title`, `description`, `image` (imported from `apps/web/src/assets/img/`), `imageAlt`, `href` defaulting to `/servicios` and (POST-APPLY UPDATE) a `ctaLabel` equal to `"Ver detalles"`. The `cta` block SHALL be `{ label: "Ver todos los servicios", href: "/servicios" }`. The images SHALL be imported as: `edificios.jpg` for "Medición en Edificios", `medidores-de-agua.webp` for "Medición Industrial", `planta-tratamiento.webp` for "Obras y Proyectos", `osmosis-inversa.jpg` for "Tratamiento de Agua y Desalinización".

#### Scenario: SERVICES_SECTION_CONTENT exposes the full set of props
- **WHEN** `SERVICES_SECTION_CONTENT` is imported from `lib/config/services-section`
- **THEN** it has the shape `{ readonly headline: string; readonly description: string; readonly services: readonly Service[]; readonly cta: ServicesSectionCta }`
- **AND** `headline` and `description` are non-empty strings
- **AND** `services` has length exactly 4
- **AND** `cta` has non-empty `label` and `href` strings

#### Scenario: Services carry the expected titles in render order
- **WHEN** `SERVICES_DATA` (or `SERVICES_SECTION_CONTENT.services`) is inspected
- **THEN** the titles in render order are exactly: "Medición en Edificios", "Medición Industrial", "Obras y Proyectos", "Tratamiento de Agua y Desalinización"

#### Scenario: Services carry the expected descriptions in render order
- **WHEN** `SERVICES_DATA` is inspected
- **THEN** the descriptions in render order are exactly: "Instalación y recambio de medidores de agua caliente en comunidades.", "Instalación y puesta en marcha de sistemas de medición de caudal.", "Desarrollo de infraestructura para sistemas de medición y control.", "Diseño y optimización de plantas de tratamiento con tecnología de vanguardia."

#### Scenario: All services use the generic /servicios href by default
- **WHEN** `SERVICES_DATA` is inspected
- **THEN** every element's `href` equals `"/servicios"`

#### Scenario: Each service carries the "Ver detalles" card CTA label
- **WHEN** `SERVICES_DATA` is inspected
- **THEN** every element's `ctaLabel` equals `"Ver detalles"` (POST-APPLY UPDATE: per-card CTAs are distinct from the bottom "Ver todos los servicios" CTA)

#### Scenario: Each service carries a non-empty descriptive imageAlt
- **WHEN** `SERVICES_DATA` is inspected
- **THEN** each element's `imageAlt` is a non-empty string describing the image content (not the title)

#### Scenario: Services import the correct image for each card
- **WHEN** `SERVICES_DATA` is inspected
- **THEN** the service at index 0 ("Medición en Edificios") imports the `edificios.jpg` image
- **AND** the service at index 1 ("Medición Industrial") imports the `medidores-de-agua.webp` image
- **AND** the service at index 2 ("Obras y Proyectos") imports the `planta-tratamiento.webp` image
- **AND** the service at index 3 ("Tratamiento de Agua y Desalinización") imports the `osmosis-inversa.jpg` image

#### Scenario: The cta block carries "Ver todos los servicios" and /servicios
- **WHEN** `SERVICES_SECTION_CONTENT.cta` is inspected
- **THEN** `cta.label` equals `"Ver todos los servicios"`
- **AND** `cta.href` equals `"/servicios"`

### Requirement: ServicesSection integrates into the home page after SolutionSection
The `apps/web/src/pages/index.astro` SHALL render, in order inside the `<Layout>` slot: `<HeroBanner {...HERO_BANNER_CONTENT} />`, then `<PanelHome {...PANEL_HOME_CONTENT} />`, then `<SolutionSection {...SOLUTION_SECTION_CONTENT} />`, then `<ServicesSection {...SERVICES_SECTION_CONTENT} />`. The `ServicesSection` SHALL NOT replace any existing component; all four render on the home page in the documented order.

#### Scenario: Home page renders HeroBanner, PanelHome, SolutionSection and ServicesSection in order
- **WHEN** a visitor loads `/` (the home page)
- **THEN** the rendered HTML contains the HeroBanner `<section>` (with the hero `<h1>` headline)
- **AND** the rendered HTML contains the PanelHome `<section>` (with the panel `<h2>` headline)
- **AND** the rendered HTML contains the SolutionSection `<section>` (with the solution `<h3>` headline and its 4 `<h4>` card titles)
- **AND** the rendered HTML contains the ServicesSection `<section>` (with the services `<h3>` headline and its 4 `<h4>` card titles)
- **AND** the ServicesSection `<section>` appears in the DOM AFTER the SolutionSection `<section>`

#### Scenario: DOM order is preserved: hero → panel → solutions → services
- **WHEN** the home page renders
- **THEN** the rendered HTML keeps the existing order: `<TopHeader />`, then `<header>` (site-header), then the SearchForm `<div role="search">`, then the HeroBanner `<section>`, then the PanelHome `<section>`, then the SolutionSection `<section>`, then the ServicesSection `<section>`
- **AND** the count of `<header>` elements in the document is still exactly one (no new landmark is introduced)
- **AND** (POST-APPLY UPDATE) the visible heading outline of the loaded page keeps exactly 1 `<h1>`, 2 `<h2>`, 2 `<h3>` and 8 `<h4>`; the count is performed over visible elements because the Astro Dev Toolbar (present in `astro preview`) appends hidden `<h1>` elements to the DOM that are NOT part of the page content (this supersedes the previous 1/2/1/4 outline declared by the archived `solution-section` change: ServicesSection adds one `<h3>` and 4 `<h4>` as a sibling portfolio section)

#### Scenario: ServicesSection does not modify HeroBanner, PanelHome or SolutionSection rendered HTML
- **WHEN** the home page renders with all four components
- **THEN** the HeroBanner `<section>` carries the same set of classes and content it would carry when rendered alone
- **AND** the PanelHome `<section>` carries the same set of classes and content it would carry when rendered alone
- **AND** the SolutionSection `<section>` carries the same set of classes and content it would carry when rendered alone

