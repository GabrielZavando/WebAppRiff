# pilares-section Specification

## Purpose
TBD - created by change pilares-section. Update Purpose after archive.

## ADDED Requirements

### Requirement: PilaresSection renders as a full-bleed two-column section
The `pilares-section` SHALL render a `<section>` as its outermost element carrying NO background color token (the backgrounds live on each column, not on the section). The section SHALL be full-bleed: it SHALL NOT wrap its content in the canonical `container` utility. The section SHALL render a grid with the mobile-first classes `grid-cols-1 lg:grid-cols-2` (columns stack on mobile, split 50/50 from the `lg` breakpoint). The LEFT column SHALL be `relative` and SHALL contain a background `<Image>` (astro:assets) with `absolute inset-0 w-full h-full object-cover`, a navy color overlay `<div>` with `absolute inset-0 bg-secondary/80`, and the column content wrapped in a `relative z-10` container with padding utilities (`p-8 md:p-12 lg:p-16`). The RIGHT column SHALL carry the solid teal-deep background token `bg-primary-deep` (token `--color-primary-deep: #006874` — POST-APPLY FIX 2026-08-09: the right column has NO background photo and NO overlay; it is a flat solid color per client feedback that the `planta-tratamiento-ecologica.webp` photo "no se ve nada de bien") with the same padding utilities.

#### Scenario: Section is the outermost element
- **WHEN** the PilaresSection renders
- **THEN** the outermost element of the rendered HTML is a `<section>`
- **AND** the `<section>` is NOT nested inside another `<section>` produced by the component itself

#### Scenario: Section is full-bleed without a centered container
- **WHEN** the PilaresSection renders
- **THEN** the `<section>` opening tag does NOT carry the `container` class
- **AND** the `<section>` opening tag does NOT carry any `bg-*` color utility (backgrounds are per column)

#### Scenario: Section renders a stack-to-split responsive grid
- **WHEN** the PilaresSection renders
- **THEN** the section's inner grid carries `grid-cols-1` (mobile default)
- **AND** the grid carries `lg:grid-cols-2` (two equal columns at the `lg` breakpoint)

#### Scenario: Left column has the photo background with the navy overlay
- **WHEN** the PilaresSection renders the LEFT column
- **THEN** the LEFT column contains a background image element with `absolute inset-0 w-full h-full object-cover` classes
- **AND** the LEFT column contains an overlay `<div>` carrying `absolute inset-0` and the navy `bg-secondary/80` class (token `--color-secondary: #1F2D40`; POST-APPLY FIX 2026-08-09: the left overlay is the navy secondary token, NOT `bg-secondary-dark`)
- **AND** the LEFT column's content wrapper carries `relative z-10`

#### Scenario: Right column has a solid primary-deep background (no photo, no overlay)
- **WHEN** the PilaresSection renders the RIGHT column
- **THEN** the RIGHT column carries the `bg-primary-deep` class (token `--color-primary-deep: #006874`; POST-APPLY FIX 2026-08-09)
- **AND** the RIGHT column does NOT render any background image element (`<img>`/`<picture>`) of its own
- **AND** the RIGHT column does NOT render any `absolute inset-0` overlay `<div>`

### Requirement: Left column renders eyebrow, h2 headline, description and accent CTA
The left column SHALL render, in order: (a) an eyebrow `<span>` (decorative, uppercase) carrying the accent color token (`text-accent`) and `font-heading font-semibold uppercase text-xs tracking-wider`; (b) an `<h2>` headline carrying `font-heading font-bold text-white`; (c) a description `<p>` carrying `text-white/80`; (d) a CTA `<a>` carrying the solid accent button pattern (`bg-accent text-white hover:bg-accent-dark font-heading font-semibold uppercase text-xs tracking-wide px-6 py-3 transition-colors`) with `href` equal to the `cta.href` prop value. The CTA SHALL NOT carry `aria-hidden="true"` or `tabindex="-1"`.

#### Scenario: Left column renders the eyebrow with accent color
- **WHEN** the PilaresSection renders with `eyebrow="Sostenibilidad y Eficiencia"`
- **THEN** the left column contains a `<span>` whose visible text equals "Sostenibilidad y Eficiencia" verbatim
- **AND** the `<span>` carries the `text-accent` class
- **AND** the `<span>` carries `font-heading`, `font-semibold`, `uppercase`, `text-xs` and `tracking-wider` utilities

#### Scenario: Left column renders the h2 headline in white
- **WHEN** the PilaresSection renders with `headline="Comprometidos con la Optimización de Recursos"`
- **THEN** the left column contains exactly one `<h2>` element whose visible text equals "Comprometidos con la Optimización de Recursos" verbatim
- **AND** the `<h2>` carries the `text-white` class
- **AND** the `<h2>` carries the `font-heading` utility class

#### Scenario: Left column renders the description paragraph
- **WHEN** the PilaresSection renders with `description="Empresa especializada en medición de fluidos y tratamiento de agua..."`
- **THEN** the left column contains a `<p>` element whose visible text matches the `description` prop value
- **AND** the `<p>` carries the `text-white/80` class

#### Scenario: Left column renders the solid accent CTA with the configured href
- **WHEN** the PilaresSection renders with `cta={ label: "HABLEMOS DE TU PROYECTO", href: "/contacto" }`
- **THEN** the left column contains an `<a>` element whose `href` attribute equals `"/contacto"`
- **AND** the `<a>` visible text equals "HABLEMOS DE TU PROYECTO" verbatim
- **AND** the `<a>` carries the `bg-accent` and `hover:bg-accent-dark` classes
- **AND** the `<a>` carries the `text-white` class
- **AND** the `<a>` carries `font-heading`, `font-semibold`, `uppercase`, `text-xs`, `tracking-wide`, `px-6`, `py-3` utilities
- **AND** the `<a>` does NOT carry `aria-hidden="true"` and does NOT carry `tabindex="-1"`

### Requirement: Right column renders eyebrow, h3 headline, description and the pillar list
The right column SHALL render, in order: (a) an eyebrow `<span>` (decorative, uppercase) carrying the primary color token (`text-primary` — token `--color-primary: #41B3C4`; POST-APPLY FIX 2026-08-09: added to mirror the left column structure per client request, visible text "Estándares de Calidad" from the `rightEyebrow` prop) and `font-heading font-semibold uppercase text-xs tracking-wider`; (b) an `<h3>` headline carrying `font-heading font-bold text-white`; (c) a description `<p>` carrying `text-white/80`; (d) a list of N pillar items rendered as `<div>` elements, where N equals the length of the `pillars` prop. Each pillar item SHALL contain a Lucide `<Icon>` (via `astro-icon`, `name="lucide:<pilar.icon>"`) carrying `aria-hidden="true"` and `text-primary` (token `--color-primary: #41B3C4`; POST-APPLY FIX 2026-08-09: icons changed from `text-accent` to `text-primary` per client request) and a `<span>` label carrying `font-heading` and `text-white`.

#### Scenario: Right column renders the eyebrow with primary color
- **WHEN** the PilaresSection renders with `rightEyebrow="Estándares de Calidad"`
- **THEN** the right column contains a `<span>` whose visible text equals "Estándares de Calidad" verbatim
- **AND** the `<span>` carries the `text-primary` class
- **AND** the `<span>` carries `font-heading`, `font-semibold`, `uppercase`, `text-xs` and `tracking-wider` utilities

#### Scenario: Right column renders the h3 headline in white
- **WHEN** the PilaresSection renders with `rightHeadline="Nuestros Pilares de Excelencia"`
- **THEN** the right column contains exactly one `<h3>` element whose visible text equals "Nuestros Pilares de Excelencia" verbatim
- **AND** the `<h3>` carries the `text-white` class
- **AND** the `<h3>` carries the `font-heading` utility class

#### Scenario: Right column renders the description paragraph
- **WHEN** the PilaresSection renders with `rightDescription="Equipos de alta precisión y durabilidad..."`
- **THEN** the right column contains a `<p>` element whose visible text matches the `rightDescription` prop value
- **AND** the `<p>` carries the `text-white/80` class

#### Scenario: Right column renders exactly N pillar items
- **WHEN** the PilaresSection renders with `pillars` of length 4
- **THEN** the right column contains exactly 4 pillar `<div>` elements
- **AND** each pillar `<div>` contains the icon and label elements described in the pillar scenarios

#### Scenario: Each pillar item renders a Lucide icon
- **WHEN** the PilaresSection renders a pillar with `icon="recycle"`
- **THEN** the pillar item contains an `<svg>` element produced by `astro-icon`
- **AND** the `<svg>` carries `aria-hidden="true"`
- **AND** the `<svg>` carries `lucide:recycle` as its icon reference (the `name` attribute equals `lucide:recycle`)

#### Scenario: Each pillar item renders the white label
- **WHEN** the PilaresSection renders a pillar with `label="Sostenibilidad"`
- **THEN** the pillar item contains a `<span>` whose visible text equals "Sostenibilidad" verbatim
- **AND** the `<span>` carries the `text-white` class
- **AND** the `<span>` carries the `font-heading` utility class

### Requirement: PilaresSection left background image uses astro:assets with lazy loading and descriptive alt
The `pilares-section` SHALL render ONLY the LEFT background image via `astro:assets` (`<Image>` with the `sharp` service built into Astro), NOT raw `<img src="...">` with static paths. The LEFT background image SHALL carry `loading="lazy"` (the section is below the initial fold), a non-empty descriptive `alt` matching the configured `imageAlt`, and `object-cover` so the photo fills the column. The image SHALL NOT carry a `rounded-*` utility (flat design). POST-APPLY FIX 2026-08-09: the RIGHT column has NO background image (solid `bg-primary-deep` per the "full-bleed two-column section" requirement), so the `rightImage`/`rightImageAlt` props are removed from the contract.

#### Scenario: Left background image is processed by astro:assets
- **WHEN** the PilaresSection renders the left column
- **THEN** the left background image element carries a `src` attribute resolving to a hashed/optimized path (e.g. `/_astro/...` or `/.astro/...`) rather than a raw `apps/web/src/assets/img/...` path
- **AND** the image element carries `width` and `height` attributes

#### Scenario: Right column carries no background image element
- **WHEN** the PilaresSection renders the right column
- **THEN** the `<section>` output contains exactly ONE image element (the left photo)
- **AND** the right column does NOT contain any `<img>` or `<picture>` element

#### Scenario: Left background image loads lazily
- **WHEN** the PilaresSection renders
- **THEN** the ONLY background image element (left photo) carries `loading="lazy"`

#### Scenario: Left background image carries descriptive alt text
- **WHEN** the PilaresSection renders with configured `leftImageAlt`
- **THEN** the left background image carries an `alt` attribute equal to the `leftImageAlt` prop value
- **AND** the `alt` value is non-empty

### Requirement: PilaresSection is a dumb presentational component
The `pilares-section` SHALL be a dumb component: it SHALL NOT perform any data fetching (no `fetch`, no Firestore calls), SHALL NOT read `import.meta.env` directly, and SHALL NOT hold reactive state. All data (`eyebrow`, `headline`, `description`, `cta`, `rightEyebrow`, `rightHeadline`, `rightDescription`, `pillars`, left background image) SHALL be received through typed props spread by the consuming page (`apps/web/src/pages/index.astro`).

#### Scenario: Component renders in isolation with all required props
- **WHEN** the PilaresSection is rendered via `AstroContainer.renderToString` with a complete `PilaresSectionProps` object containing 4 pillars
- **THEN** the rendered HTML contains the left column copy (eyebrow, h2 headline, description, CTA)
- **AND** the rendered HTML contains the right column copy (h3 headline, description, 4 pillar items)
- **AND** the rendered HTML references the `headline`, `cta.label` and pillar `label` texts provided in the props

#### Scenario: Component frontmatter contains no import.meta.env or fetch access
- **WHEN** the source file `apps/web/src/components/PilaresSection.astro` is inspected
- **THEN** the frontmatter (between `---` fences) does NOT contain the literal string `import.meta.env`
- **AND** the frontmatter does NOT contain the literal string `fetch(`

### Requirement: PilaresSection preserves the home page heading outline
The `pilares-section` SHALL render its left headline as `<h2>` (NOT `<h1>`) and its right headline as `<h3>` (NOT `<h1>`, NOT `<h2>`), since the home page already has a single `<h1>` (owned by HeroBanner) and a single `<h2>` (owned by PanelHome). The component SHALL NOT introduce any new `<h1>` elements. After this change, the home page SHALL contain exactly three `<h2>` elements (HeroBanner subtitle, PanelHome headline, PilaresSection left headline) and exactly four `<h3>` elements (SolutionSection, ServicesSection, DestacadosSection, PilaresSection right headline).

#### Scenario: Heading counts after rendering the section in isolation
- **WHEN** the PilaresSection renders in isolation (no other components present)
- **THEN** the rendered HTML contains exactly one `<h2>` (the left headline)
- **AND** the rendered HTML contains exactly one `<h3>` (the right headline)
- **AND** the rendered HTML contains zero `<h1>` elements
- **AND** the rendered HTML contains zero `<h4>` elements

#### Scenario: Headlines are reachable via assistive technology (not aria-hidden)
- **WHEN** the PilaresSection renders
- **THEN** the `<h2>` headline element does NOT carry `aria-hidden="true"`
- **AND** the `<h3>` headline element does NOT carry `aria-hidden="true"`
- **AND** neither heading carries `tabindex="-1"`

### Requirement: PilaresSection consumes only canonical design tokens
The `pilares-section` SHALL consume design tokens declared in `apps/web/src/styles/globals.css` (`bg-secondary-dark`, `text-accent`, `text-white`, `bg-accent`, `hover:bg-accent-dark`, `font-heading`). The component SHALL NOT use literal hex color values anywhere in its markup or class attributes. The component SHALL NOT use the deprecated `brand-*` tokens. The component SHALL NOT use any `rounded-*` utility (flat design — `--radius: 0`).

#### Scenario: No literal hex color values in the rendered HTML
- **WHEN** the PilaresSection renders
- **THEN** the rendered HTML does NOT contain any substring matching the regex `/#[0-9a-fA-F]{3,8}/`

#### Scenario: No deprecated brand-* tokens in the rendered HTML
- **WHEN** the PilaresSection renders
- **THEN** the rendered HTML does NOT contain any substring matching the regex `/brand-(teal|navy|orange|gray)/`

#### Scenario: No rounded-* utilities in the rendered HTML
- **WHEN** the PilaresSection renders
- **THEN** the rendered HTML does NOT contain any substring matching the regex `/rounded\b/`

### Requirement: PilaresSection content is configured via a hardcoded constant
The `pilares-section` content SHALL come from the `PILARES_SECTION_CONTENT` constant in `lib/config/pilares-section.ts`, exported as `Readonly<PilaresSectionProps>`, containing the section copy and exactly 4 pillars. The config SHALL define: `eyebrow: "Sostenibilidad y Eficiencia"`, `headline: "Comprometidos con la Optimización de Recursos"`, a non-empty `description`, `cta: { label: "HABLEMOS DE TU PROYECTO", href: "/contacto" }`, `rightEyebrow: "Estándares de Calidad"` (POST-APPLY FIX 2026-08-09: added per client request), `rightHeadline: "Nuestros Pilares de Excelencia"`, a non-empty `rightDescription`, 4 `pillars` in render order — (1) "Sostenibilidad" / `recycle`, (2) "Proyectos a tiempo" / `clock`, (3) "Tecnología de Vanguardia" / `monitor`, (4) "Soporte Técnico Especializado" / `headphones` — and the LEFT background image `leftImage` (imported `sostenibilidad-edificios.jpg`) with a non-empty descriptive `leftImageAlt`. The config SHALL NOT include a price field. POST-APPLY FIX 2026-08-09: the config SHALL NOT include `rightImage` (`planta-tratamiento-ecologica.webp` is no longer used — the right column is solid `bg-primary-deep` per client feedback).

#### Scenario: PILARES_SECTION_CONTENT exposes the full set of props
- **WHEN** `PILARES_SECTION_CONTENT` is imported from `lib/config/pilares-section`
- **THEN** it has the shape `{ readonly eyebrow: string; readonly headline: string; readonly description: string; readonly cta: { readonly label: string; readonly href: string }; readonly rightEyebrow: string; readonly rightHeadline: string; readonly rightDescription: string; readonly pillars: readonly { readonly label: string; readonly icon: PilarIconName }[]; readonly leftImage: ImageMetadata; readonly leftImageAlt: string }`
- **AND** `eyebrow` equals `"Sostenibilidad y Eficiencia"`
- **AND** `headline` equals `"Comprometidos con la Optimización de Recursos"`
- **AND** `cta.label` equals `"HABLEMOS DE TU PROYECTO"`
- **AND** `cta.href` equals `"/contacto"`
- **AND** `rightEyebrow` equals `"Estándares de Calidad"`
- **AND** `rightHeadline` equals `"Nuestros Pilares de Excelencia"`
- **AND** `pillars` has length exactly 4

#### Scenario: Pillars carry the expected labels in render order
- **WHEN** `PILARES_SECTION_CONTENT.pillars` is inspected
- **THEN** the labels in render order are exactly: "Sostenibilidad", "Proyectos a tiempo", "Tecnología de Vanguardia", "Soporte Técnico Especializado"
- **AND** the icons in render order are exactly: `recycle`, `clock`, `monitor`, `headphones`

#### Scenario: Pillar icons are restricted to the closed union
- **WHEN** `PILARES_SECTION_CONTENT.pillars` is inspected
- **THEN** the type of each `icon` field is a member of `PilarIconName` (`'recycle' | 'clock' | 'monitor' | 'headphones'`)
- **AND** each icon name exists in the installed `@iconify-json/lucide` set

#### Scenario: Background image imports the client-provided asset
- **WHEN** `PILARES_SECTION_CONTENT` is inspected
- **THEN** `leftImage` is the image imported from `sostenibilidad-edificios.jpg`
- **AND** `leftImageAlt` is a non-empty descriptive string
- **AND** no element exposes a `rightImage` or `rightImageAlt` property (POST-APPLY FIX 2026-08-09: the right column dropped the background photo)

#### Scenario: Config carries no price field
- **WHEN** `PILARES_SECTION_CONTENT` is inspected
- **THEN** no element exposes a `precio`, `price`, `precioVisible` or `priceVisible` property

### Requirement: PilaresSection integrates into the home page after DestacadosSection
The `apps/web/src/pages/index.astro` SHALL render, in order inside the `<Layout>` slot: HeroBanner, PanelHome, SolutionSection, ServicesSection, DestacadosSection, then `<PilaresSection {...PILARES_SECTION_CONTENT} />` as the LAST section. The `PilaresSection` SHALL NOT replace any existing component; all six render on the home page in the documented order.

#### Scenario: Home page renders PilaresSection after DestacadosSection
- **WHEN** a visitor loads `/` (the home page)
- **THEN** the rendered HTML contains the PilaresSection `<section>` (with the "Comprometidos con la Optimización de Recursos" `<h2>` and the "Nuestros Pilares de Excelencia" `<h3>`)
- **AND** the PilaresSection `<section>` appears in the DOM AFTER the DestacadosSection `<section>`
- **AND** the PilaresSection `<section>` is the LAST `<section>` in the home page DOM

#### Scenario: DOM order is preserved: hero → panel → solutions → services → destacados → pilares
- **WHEN** the home page renders
- **THEN** the rendered HTML keeps the existing order of the first five sections (HeroBanner, PanelHome, SolutionSection, ServicesSection, DestacadosSection)
- **AND** the page outline is exactly 1 `<h1>`, 3 `<h2>`, 4 `<h3>` and 12 `<h4>` (PilaresSection adds its own `<h2>` + `<h3>`)

#### Scenario: DestacadosSection does not modify the other sections' rendered HTML
- **WHEN** the home page renders with all six components
- **THEN** the HeroBanner `<section>` carries the same set of classes and content it would carry when rendered alone
- **AND** the PanelHome `<section>` carries the same set of classes and content it would carry when rendered alone
- **AND** the SolutionSection `<section>` carries the same set of classes and content it would carry when rendered alone
- **AND** the ServicesSection `<section>` carries the same set of classes and content it would carry when rendered alone
- **AND** the DestacadosSection `<section>` carries the same set of classes and content it would carry when rendered alone