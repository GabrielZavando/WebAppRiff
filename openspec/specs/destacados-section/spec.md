# destacados-section Specification

## Purpose
TBD - created by change destacados-section. Update Purpose after archive.

## Requirements

### Requirement: DestacadosSection renders as a flat dark teal section with vertical padding
The `destacados-section` SHALL render a `<section>` as its outermost element carrying vertical padding utilities (`py-16 md:py-24`) and the deep teal background token `bg-primary-deep` (`--color-primary-deep: #006874`). The section SHALL NOT apply negative margin / overlap — it is a flat block with a hard color transition from the light `bg-bg` of `ServicesSection` above (or `SolutionSection` when rendered without ServicesSection). The section SHALL contain a single inner container using the canonical container utilities (`mx-auto px-4 sm:px-6 lg:px-8` and the `max-w-7xl` constraint expressed by the `container` utility). (POST-APPLY UPDATE: the section background is the deep teal `bg-primary-deep` per client request on 2026-08-09 — NOT the navy `bg-secondary-dark` used by ServicesSection; the token was added to both `globals.css` mirrors and to `docs/design/style-guide/README.md`.)

#### Scenario: Section is the outermost element
- **WHEN** the DestacadosSection renders
- **THEN** the outermost element of the rendered HTML is a `<section>`
- **AND** the `<section>` is NOT nested inside another `<section>` produced by the component itself

#### Scenario: Section carries vertical padding utilities
- **WHEN** the DestacadosSection renders
- **THEN** the `<section>` opening tag carries a class expressing mobile vertical padding (e.g. `py-16`)
- **AND** the `<section>` opening tag carries a class expressing a larger vertical padding at the `md` breakpoint (e.g. `md:py-24`)

#### Scenario: Section uses the deep teal background token
- **WHEN** the DestacadosSection renders
- **THEN** the `<section>` opening tag carries a class expressing the deep teal background token (e.g. `bg-primary-deep`)
- **AND** the rendered HTML does NOT contain the lighter `bg-bg` utility on the section's outermost element

#### Scenario: Section uses the canonical container for inner width
- **WHEN** the DestacadosSection renders
- **THEN** the section contains an inner `<div>` carrying the `container` class (or the equivalent `mx-auto px-4 sm:px-6 lg:px-8` plus `max-w-7xl` constraint)

### Requirement: DestacadosSection renders a header row with white headline and accent CTA
The `destacados-section` SHALL render a header row containing exactly two elements: a `<h3>` headline (the section title, e.g. "Soluciones Destacadas") styled with the white color token (`text-white`) and the heading font token (`font-heading`); and an `<a>` CTA link carrying the solid accent button pattern (background token `bg-accent`, hover darkening `hover:bg-accent-dark`, white text `text-white`, `font-heading font-semibold uppercase text-xs tracking-wide px-6 py-3 transition-colors`). The header row SHALL lay the headline on the left and the CTA on the right at the `sm` breakpoint and above (e.g. `flex flex-col sm:flex-row justify-between items-start sm:items-center`) — the CTA stacks below the headline on mobile. The header SHALL NOT render an eyebrow `<span>` and SHALL NOT render a teal underline `<div>`.

#### Scenario: Headline renders as an h3 with white color and heading font
- **WHEN** the DestacadosSection renders with `headline="Soluciones Destacadas"`
- **THEN** the header contains exactly one `<h3>` element whose visible text equals "Soluciones Destacadas" verbatim
- **AND** the `<h3>` carries a class expressing the white color token (e.g. `text-white`)
- **AND** the `<h3>` carries the `font-heading` utility class
- **AND** the `<h3>` does NOT carry `aria-hidden="true"` or `tabindex="-1"`

#### Scenario: Header CTA links to the cta href with the solid accent pattern
- **WHEN** the DestacadosSection renders with `ctaHref="/productos"` and `ctaText="EXPLORAR CATÁLOGO COMPLETO"`
- **THEN** the header contains an `<a>` element whose `href` attribute equals `"/productos"`
- **AND** the `<a>` visible text equals "EXPLORAR CATÁLOGO COMPLETO" verbatim
- **AND** the `<a>` carries the `bg-accent` class
- **AND** the `<a>` carries the `hover:bg-accent-dark` class
- **AND** the `<a>` carries the `text-white` class
- **AND** the `<a>` carries `font-heading`, `font-semibold`, `uppercase`, `text-xs`, `tracking-wide`, `px-6`, `py-3` utilities

#### Scenario: Header row places CTA on the right at the sm breakpoint
- **WHEN** the DestacadosSection renders
- **THEN** the header row wrapper carries flex utilities (`flex`) with `flex-col` as the mobile default
- **AND** the header row wrapper carries `sm:flex-row` and `justify-between` at the `sm` breakpoint

#### Scenario: Header does NOT render an eyebrow or underline
- **WHEN** the DestacadosSection renders
- **THEN** the header does NOT contain any element whose visible text matches an eyebrow-style uppercase label other than the headline and CTA texts
- **AND** the header does NOT contain a `<div>` carrying both a short horizontal bar utility (e.g. `h-1` and `w-16`) and the teal `bg-primary` background token

### Requirement: DestacadosSection renders a responsive card grid of featured products (mobile-first)
The `destacados-section` SHALL render a grid of `products` cards sized responsively mobile-first: 1 column on mobile (`< 640px`), 2 columns at the `sm` breakpoint (`>= 640px`) and 4 columns at the `lg` breakpoint (`>= 1024px`). The grid container SHALL carry the Tailwind utility classes `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` and a consistent gap utility (`gap-6 md:gap-8`). The grid SHALL render exactly N `<article>` cards, where N equals the length of the `products` prop.

#### Scenario: Card grid uses responsive column classes (mobile-first)
- **WHEN** the DestacadosSection renders with 4 products
- **THEN** the rendered card grid container carries `grid-cols-1` (mobile default)
- **AND** the rendered card grid container carries `sm:grid-cols-2` (two columns at the `sm` breakpoint)
- **AND** the rendered card grid container carries `lg:grid-cols-4` (four columns at the `lg` breakpoint)
- **AND** the rendered card grid container carries a gap utility (e.g. `gap-6`)

#### Scenario: Grid renders exactly N cards matching the products prop length
- **WHEN** the DestacadosSection renders with `products` of length 4
- **THEN** the card grid contains exactly 4 `<article>` elements
- **AND** each `<article>` contains the image, title and CTA elements described in the per-card requirements

### Requirement: Each DestacadosSection card is a white raised card with image mat, title and CTA
Each card SHALL be an `<article>` carrying a white background token (`bg-white`), a flat-design floating shadow (`shadow-2`) with a hover elevation (`hover:shadow-4`), and a `transition-shadow` utility. The card SHALL contain: (a) an image mat area — a `<div>` with padding (e.g. `p-4`) wrapping the `astro:assets` `<Image>` rendered with `object-contain` and a square aspect; (b) a content area with the `<h4>` title and the "Cotizar" CTA. The card SHALL NOT contain any price element (no `$` formatted text, no price paragraph).

#### Scenario: Card uses white background and elevated shadow tokens
- **WHEN** the DestacadosSection renders a card
- **THEN** the `<article>` carries a class expressing the white background token (e.g. `bg-white`)
- **AND** the `<article>` carries a shadow utility from the flat-design set (e.g. `shadow-2`)
- **AND** the `<article>` carries a hover shadow utility (e.g. `hover:shadow-4`)
- **AND** the `<article>` carries the `transition-shadow` utility

#### Scenario: Card has an image mat area with object-contain
- **WHEN** the DestacadosSection renders a card
- **THEN** the `<article>` contains a `<div>` carrying a padding utility (e.g. `p-4`) that wraps the card's image element
- **AND** the card's image element carries the `object-contain` utility

#### Scenario: Card does NOT render a price
- **WHEN** the DestacadosSection renders a card
- **THEN** the card content does NOT contain any element whose visible text starts with `$` (no price paragraph, no formatted amount)
- **AND** the rendered HTML of the card does NOT contain the substring `$0` or any `$`-prefixed number pattern matching `/\$\d/`

### Requirement: Each DestacadosSection card image is lazy-loaded, object-contain, with a descriptive alt
Each card SHALL contain an `<Image>` rendered by `astro:assets` carrying: `loading="lazy"` (the section is below the initial fold); a non-empty descriptive `alt` attribute matching the product's `imagenAlt` prop value (NOT the card title); `object-contain` with a square aspect ratio (e.g. `aspect-square`) so product shots are not cropped; and responsive `widths`/`sizes` attributes generated by `astro:assets`. The image SHALL NOT use raw `<img src="...">` with a static path. The image SHALL NOT have a `rounded-*` utility (flat design).

#### Scenario: Each card image uses lazy loading
- **WHEN** the DestacadosSection renders a card
- **THEN** the card's image element carries `loading="lazy"`

#### Scenario: Each card image carries a non-empty descriptive alt
- **WHEN** the DestacadosSection renders a card with `imagenAlt="Bidón azul de antiincrustante Bimaks 420 para ósmosis inversa"`
- **THEN** the card's image element carries an `alt` attribute equal to the `imagenAlt` prop value
- **AND** the `alt` value is non-empty
- **AND** the `alt` value is NOT identical to the card's `<h4>` visible text (it describes the photo, not the title)

#### Scenario: Images are processed by astro:assets (not raw src paths)
- **WHEN** the DestacadosSection renders a card
- **THEN** the card's image element carries a `src` attribute resolving to a hashed/optimized path (e.g. `/_astro/...` or `/.astro/...`) rather than a raw `apps/web/src/assets/img/...` path
- **AND** the image element carries `width` and `height` attributes (explicit dimensions, generated by `astro:assets`)

### Requirement: Each DestacadosSection card title renders as an h4
Each card SHALL render its product title as an `<h4>` element (subordinate to the section `<h3>`), carrying the `font-heading` utility and the navy text token (`text-secondary`), with a text clamp (e.g. `line-clamp-3`) and a minimum height reservation (e.g. `min-h-[4.5rem]`) so cards stay equal-height. The `<h4>` visible text SHALL equal the product's `titulo` prop value verbatim.

#### Scenario: Each card title renders as an h4 with the secondary color token
- **WHEN** the DestacadosSection renders a card with `titulo="Flujómetro Universal"`
- **THEN** the card contains an `<h4>` element whose visible text equals "Flujómetro Universal" verbatim
- **AND** the `<h4>` carries a class expressing the navy secondary color token (e.g. `text-secondary`)
- **AND** the `<h4>` carries the `font-heading` utility class

#### Scenario: Long product titles render fully and clamp after three lines
- **WHEN** the DestacadosSection renders a card with `titulo="MWN – MEDIDOR INDUSTRIAL PARA AGUA FRÍA LIMPIA – MEDIDOR TIPO WOLTMAN"`
- **THEN** the card `<h4>` visible text starts with "MWN – MEDIDOR INDUSTRIAL PARA AGUA FRÍA LIMPIA – MEDIDOR TIPO WOLTMAN" verbatim
- **AND** the `<h4>` carries the `line-clamp-3` utility

### Requirement: Each DestacadosSection card CTA renders as the outline primary "Cotizar" button
Each card SHALL render an `<a>` CTA with the `href` attribute set to `/productos/{slug}` (product `slug` prop interpolated) and the visible text "Cotizar" (verbatim, sentence case — NOT "SOLICITAR COTIZACIÓN"). The CTA SHALL follow the design-system outline primary button pattern: `border-2 border-primary text-primary hover:bg-primary hover:text-white font-heading font-semibold uppercase text-xs tracking-wide px-4 py-3 block text-center transition-colors`. The CTA SHALL NOT carry `aria-hidden="true"` or `tabindex="-1"`.

#### Scenario: Each card CTA links to the product slug route
- **WHEN** the DestacadosSection renders a card with `slug="flujometro-universal"`
- **THEN** the card contains an `<a>` element whose `href` attribute equals `"/productos/flujometro-universal"`

#### Scenario: Each card CTA visible text is "Cotizar"
- **WHEN** the DestacadosSection renders a card
- **THEN** the card CTA's visible text equals "Cotizar"
- **AND** the card CTA visible text does NOT equal "SOLICITAR COTIZACIÓN" or "Cotización"

#### Scenario: Each card CTA follows the outline primary button pattern
- **WHEN** the DestacadosSection renders a card
- **THEN** the card CTA `<a>` carries the `border-2` and `border-primary` classes
- **AND** the `<a>` carries the `text-primary` class
- **AND** the `<a>` carries the `hover:bg-primary` and `hover:text-white` classes
- **AND** the `<a>` carries `font-heading`, `font-semibold`, `uppercase`, `text-xs`, `tracking-wide`, `px-4`, `py-3` utilities
- **AND** the `<a>` does NOT carry `aria-hidden="true"` and does NOT carry `tabindex="-1"`

### Requirement: DestacadosSection is a dumb presentational component
The `destacados-section` SHALL be a dumb component: it SHALL NOT perform any data fetching (no `fetch`, no Firestore calls), SHALL NOT read `import.meta.env` directly, and SHALL NOT hold reactive state. All data (`headline`, `ctaText`, `ctaHref`, `products` array) SHALL be received through typed props spread by the consuming page (`apps/web/src/pages/index.astro`).

#### Scenario: Component renders in isolation with all required props
- **WHEN** the DestacadosSection is rendered via `AstroContainer.renderToString` with a complete `DestacadosSectionProps` object containing 4 products
- **THEN** the rendered HTML contains the header row (headline + CTA), exactly 4 cards, and no price text
- **AND** the rendered HTML references the `headline`, `ctaText`, and product `titulo` texts provided in the props

#### Scenario: Component frontmatter contains no import.meta.env or fetch access
- **WHEN** the source file `apps/web/src/components/DestacadosSection.astro` is inspected
- **THEN** the frontmatter (between `---` fences) does NOT contain the literal string `import.meta.env`
- **AND** the frontmatter does NOT contain the literal string `fetch(`

### Requirement: DestacadosSection consumes only canonical design tokens
The `destacados-section` SHALL consume design tokens declared in `apps/web/src/styles/globals.css` (`bg-primary-deep`, `bg-white`, `text-white`, `text-secondary`, `bg-accent`, `hover:bg-accent-dark`, `border-primary`, `text-primary`, `hover:bg-primary`, `font-heading`, `shadow-2`, `hover:shadow-4`) (POST-APPLY UPDATE: `bg-primary-deep` replaces `bg-secondary-dark` as the section background). The component SHALL NOT use literal hex color values (e.g. `#41B3C4`, `#16202E`) anywhere in its markup or class attributes. The component SHALL NOT use the deprecated `brand-*` tokens (e.g. `bg-brand-teal`, `text-brand-navy`). The component SHALL NOT use any `rounded-*` utility (flat design — `--radius: 0`).

#### Scenario: No literal hex color values in the rendered HTML
- **WHEN** the DestacadosSection renders
- **THEN** the rendered HTML does NOT contain any substring matching the regex `/#[0-9a-fA-F]{3,8}/`

#### Scenario: No deprecated brand-* tokens in the rendered HTML
- **WHEN** the DestacadosSection renders
- **THEN** the rendered HTML does NOT contain any substring matching the regex `/brand-(teal|navy|orange|gray)/`

#### Scenario: No rounded-* utilities in the rendered HTML
- **WHEN** the DestacadosSection renders
- **THEN** the rendered HTML does NOT contain any substring matching the regex `/rounded\b/` (the flat-design rule — `--radius: 0`)

### Requirement: DestacadosSection preserves the home page heading outline
The `destacados-section` SHALL render its headline as `<h3>` (NOT `<h1>` and NOT `<h2>`), since the home page already has a single `<h1>` (owned by HeroBanner) and a single `<h2>` (owned by PanelHome). Each product title SHALL be rendered as `<h4>`, subordinate to the section `<h3>`. The component SHALL NOT introduce any new `<h1>` or `<h2>` elements. After this change, the home page SHALL contain exactly three `<h3>` elements: one owned by `SolutionSection`, one owned by `ServicesSection` and one owned by `DestacadosSection` (sibling portfolio sections).

#### Scenario: Heading counts after rendering the section in isolation
- **WHEN** the DestacadosSection renders in isolation (no other components present)
- **THEN** the rendered HTML contains exactly one `<h3>` (the section headline)
- **AND** the rendered HTML contains exactly N `<h4>` elements, where N equals the length of `products` prop
- **AND** the rendered HTML contains zero `<h1>` elements
- **AND** the rendered HTML contains zero `<h2>` elements

#### Scenario: Headline is reachable via assistive technology (not aria-hidden)
- **WHEN** the DestacadosSection renders
- **THEN** the `<h3>` headline element does NOT carry `aria-hidden="true"`
- **AND** the `<h3>` headline element does NOT carry `tabindex="-1"`

### Requirement: DestacadosSection uses astro:assets pipeline and no icons
The `destacados-section` SHALL render all images via `astro:assets` (using `<Image>` with the `sharp` service built into Astro). The component SHALL NOT install or import the deprecated `@astrojs/image` package. The component SHALL NOT render any icon `<svg>` (the section has no icons in the mockup), so it does not require `astro-icon` nor icons from any set.

#### Scenario: Images are processed by astro:assets (not raw <img src=...>)
- **WHEN** the DestacadosSection renders a card
- **THEN** the card's image element carries a `src` attribute resolving to a hashed/optimized path (e.g. `/_astro/...` or `/.astro/...`) rather than a raw `apps/web/src/assets/img/...` path
- **AND** the image element carries `width` and `height` attributes (explicit dimensions, generated by `astro:assets`)

#### Scenario: Section renders no icons
- **WHEN** the DestacadosSection renders
- **THEN** the rendered HTML does NOT contain any `<svg>` element produced by `astro-icon` (no `lucide:` icon names, no other icon set)

### Requirement: DestacadosSection content is configured via a hardcoded constant
The `destacados-section` content SHALL come from the `DESTACADOS_SECTION_CONTENT` constant in `lib/config/destacados-section.ts`, exported as `Readonly<DestacadosSectionProps>`, containing exactly 4 products and the section header copy. The header SHALL be `headline: "Soluciones Destacadas"`, `ctaText: "EXPLORAR CATÁLOGO COMPLETO"`, `ctaHref: "/productos"`. The 4 products SHALL be, in render order: (1) "Antiincrustante Bimaks 420 para Ósmosis Inversa (Agua Salobre)"; (2) "Flujómetro Universal"; (3) "Medidor Ultrasónico Doppler Portátil Fullsonic (No Invasivo)"; (4) "MWN – MEDIDOR INDUSTRIAL PARA AGUA FRÍA LIMPIA – MEDIDOR TIPO WOLTMAN". Each product SHALL carry an `id`, `titulo`, `slug`, `imagen` (imported from `apps/web/src/assets/img/`) and a non-empty descriptive `imagenAlt`. The images SHALL be imported as: `antiincrustante-Bimaks.png` for product 1, `flujometro-multiproposito.webp` for product 2, `FULLSONIC-DOPPLER-CONTABLE.webp` for product 3, `MWN-DN50.webp` for product 4. The config SHALL NOT include price fields.

#### Scenario: DESTACADOS_SECTION_CONTENT exposes the full set of props
- **WHEN** `DESTACADOS_SECTION_CONTENT` is imported from `lib/config/destacados-section`
- **THEN** it has the shape `{ readonly headline: string; readonly ctaText: string; readonly ctaHref: string; readonly products: readonly FeaturedProduct[] }`
- **AND** `headline` equals `"Soluciones Destacadas"`
- **AND** `ctaText` equals `"EXPLORAR CATÁLOGO COMPLETO"`
- **AND** `ctaHref` equals `"/productos"`
- **AND** `products` has length exactly 4

#### Scenario: Products carry the expected titles in render order
- **WHEN** `FEATURED_PRODUCTS` (or `DESTACADOS_SECTION_CONTENT.products`) is inspected
- **THEN** the titles in render order are exactly: "Antiincrustante Bimaks 420 para Ósmosis Inversa (Agua Salobre)", "Flujómetro Universal", "Medidor Ultrasónico Doppler Portátil Fullsonic (No Invasivo)", "MWN – MEDIDOR INDUSTRIAL PARA AGUA FRÍA LIMPIA – MEDIDOR TIPO WOLTMAN"

#### Scenario: Products import the correct image for each card
- **WHEN** `FEATURED_PRODUCTS` is inspected
- **THEN** the product at index 0 ("Antiincrustante Bimaks 420 para Ósmosis Inversa (Agua Salobre)") imports the `antiincrustante-Bimaks.png` image
- **AND** the product at index 1 ("Flujómetro Universal") imports the `flujometro-multiproposito.webp` image
- **AND** the product at index 2 ("Medidor Ultrasónico Doppler Portátil Fullsonic (No Invasivo)") imports the `FULLSONIC-DOPPLER-CONTABLE.webp` image
- **AND** the product at index 3 ("MWN – MEDIDOR INDUSTRIAL PARA AGUA FRÍA LIMPIA – MEDIDOR TIPO WOLTMAN") imports the `MWN-DN50.webp` image

#### Scenario: Each product carries a non-empty descriptive imageAlt
- **WHEN** `FEATURED_PRODUCTS` is inspected
- **THEN** each element's `imagenAlt` is a non-empty string describing the image content (not the title)

#### Scenario: Each product carries a kebab-case slug
- **WHEN** `FEATURED_PRODUCTS` is inspected
- **THEN** each element's `slug` matches the kebab-case pattern (lowercase letters, digits and hyphens only)

#### Scenario: No product carries a price field
- **WHEN** `FEATURED_PRODUCTS` is inspected
- **THEN** no element exposes a `precio`, `price`, `precioVisible` or `priceVisible` property (the section deliberately shows no prices)

### Requirement: DestacadosSection integrates into the home page after ServicesSection
The `apps/web/src/pages/index.astro` SHALL render, in order inside the `<Layout>` slot: `<HeroBanner {...HERO_BANNER_CONTENT} />`, then `<PanelHome {...PANEL_HOME_CONTENT} />`, then `<SolutionSection {...SOLUTION_SECTION_CONTENT} />`, then `<ServicesSection {...SERVICES_SECTION_CONTENT} />`, then `<DestacadosSection {...DESTACADOS_SECTION_CONTENT} />`. The `DestacadosSection` SHALL NOT replace any existing component; all five render on the home page in the documented order.

#### Scenario: Home page renders DestacadosSection after ServicesSection
- **WHEN** a visitor loads `/` (the home page)
- **THEN** the rendered HTML contains the DestacadosSection `<section>` (with the "Soluciones Destacadas" `<h3>` headline and its 4 `<h4>` product titles)
- **AND** the DestacadosSection `<section>` appears in the DOM AFTER the ServicesSection `<section>`
- **AND** no price text (no `$-prefixed` numbers) appears inside the DestacadosSection `<section>`

#### Scenario: DOM order is preserved: hero → panel → solutions → services → destacados
- **WHEN** the home page renders
- **THEN** the rendered HTML keeps the existing order: the HeroBanner `<section>`, then the PanelHome `<section>`, then the SolutionSection `<section>`, then the ServicesSection `<section>`, then the DestacadosSection `<section>`
- **AND** the page outline is exactly 1 `<h1>`, 2 `<h2>`, 3 `<h3>` and 12 `<h4>` (DestacadosSection adds its own `<h3>` + 4 `<h4>` — POST-VERIFY UPDATE: the previously asserted 2 h3 / 8 h4 is obsolete)
- **AND** the DestacadosSection introduces no new content landmark: its outermost element is a `<section>` and the component emits no `<header>` element (the page keeps the pre-existing headers owned by the Layout/Header components)

#### Scenario: DestacadosSection does not modify the other sections' rendered HTML
- **WHEN** the home page renders with all five components
- **THEN** the HeroBanner `<section>` carries the same set of classes and content it would carry when rendered alone
- **AND** the PanelHome `<section>` carries the same set of classes and content it would carry when rendered alone
- **AND** the SolutionSection `<section>` carries the same set of classes and content it would carry when rendered alone
- **AND** the ServicesSection `<section>` carries the same set of classes and content it would carry when rendered alone