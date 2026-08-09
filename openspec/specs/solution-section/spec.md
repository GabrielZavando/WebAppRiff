# solution-section Specification

## Purpose
TBD - created by archiving change solution-section. Update Purpose after archive.
## Requirements
### Requirement: SolutionSection renders the section header with eyebrow, headline, teal underline and description
The `solution-section` SHALL render an `<section>` as its outermost element containing a header block composed of: an eyebrow `<span>` (uppercase, NOT a heading) with the eyebrow text; a headline `<h3>` with the headline text styled with the navy `--color-secondary` token; a teal underline bar `<div>` (carrying `bg-primary`) directly beneath the headline; and a description `<p>` with the description text. The header block SHALL be composed in a responsive grid: `grid-cols-1 lg:grid-cols-2` (left half holds eyebrow+headline+bar, right half holds the description paragraph).

#### Scenario: Section is the outermost element
- **WHEN** the SolutionSection renders
- **THEN** the outermost element of the rendered HTML is a `<section>`
- **AND** the `<section>` is NOT nested inside another `<section>` produced by the component itself

#### Scenario: Eyebrow renders as a non-heading uppercase span
- **WHEN** the SolutionSection renders with `eyebrow="PORTAFOLIO"`
- **THEN** the header contains a `<span>` (or `<p>`) element whose visible text equals "PORTAFOLIO"
- **AND** the element carries a class expressing uppercase transformation (e.g. `uppercase`)
- **AND** the element is NOT any of `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`

#### Scenario: Headline renders as an h3 with navy color token
- **WHEN** the SolutionSection renders with `headline="Nuestras Soluciones"`
- **THEN** the header contains an `<h3>` element whose visible text equals "Nuestras Soluciones" verbatim
- **AND** the `<h3>` carries a class expressing the navy secondary color token (e.g. `text-secondary`)
- **AND** the `<h3>` uses the `font-heading` token family (e.g. `font-heading`)

#### Scenario: Teal underline bar renders directly beneath the headline
- **WHEN** the SolutionSection renders
- **THEN** the header contains a `<div>` element carrying classes expressing a short horizontal bar (e.g. `h-1` and `w-16`) and the teal primary background token (e.g. `bg-primary`)
- **AND** the `<div>` appears in the rendered HTML after the `<h3>` headline element

#### Scenario: Description renders as a paragraph
- **WHEN** the SolutionSection renders with `description="Sistemas integrales..."`
- **THEN** the header contains a `<p>` element whose visible text equals the description verbatim
- **AND** the `<p>` carries a class expressing the muted secondary text color token (e.g. `text-text-2`)

#### Scenario: Header layout is responsive: stacked on mobile, two columns on desktop
- **WHEN** the SolutionSection renders
- **THEN** the rendered header grid carries a class expressing a single column (e.g. `grid-cols-1`)
- **AND** the rendered header grid carries a class expressing two columns at the `lg` breakpoint (e.g. `lg:grid-cols-2`)

### Requirement: SolutionSection renders a responsive grid of solution cards
The `solution-section` SHALL render a grid of `solutions` cards sized responsively: 1 column on mobile (`< 640px`), 2 columns on tablet (`>= 640px` and `< 1024px`), and 4 columns on desktop (`>= 1024px`). The grid SHALL carry the Tailwind utility classes `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` and a consistent gap utility. Each card SHALL be a `<article>` (or equivalent semantic container) containing: a badge `<div>` with `bg-primary` holding a Lucide `<Icon>`; an `<Image>` from `astro:assets` with `loading="lazy"` and a descriptive `alt`; a `<h4>` title; a `<p>` description; and an `<a>` CTA with text "SABER MÁS" rendered as the design-system solid primary button (teal `bg-primary`, `text-white`, `hover:bg-primary-dark`, `px-6 py-3`) with a decorative arrow `<Icon name="lucide:arrow-right">` carrying `aria-hidden="true"` (POST-APPLY UPDATE: the CTA was originally a plain text link with `text-primary`; it was aligned with the solid-button pattern used by HeroBanner/Header/PanelHome CTAs).

#### Scenario: Card grid uses responsive column classes
- **WHEN** the SolutionSection renders with 4 solutions
- **THEN** the rendered card grid container carries `grid-cols-1`
- **AND** the rendered card grid container carries `sm:grid-cols-2`
- **AND** the rendered card grid container carries `lg:grid-cols-4`

#### Scenario: Grid renders exactly N cards matching the solutions prop length
- **WHEN** the SolutionSection renders with `solutions` of length 4
- **THEN** the card grid contains exactly 4 card containers
- **AND** each card container contains the badge, image, title, description and link elements described in the requirement

#### Scenario: Each card badge is a teal square with a Lucide icon
- **WHEN** the SolutionSection renders a card
- **THEN** the card contains a `<div>` carrying the `bg-primary` class
- **AND** that `<div>` contains an `<svg>` (rendered by `astro-icon` from a `lucide:*` name)
- **AND** the icon SVG is visible inside the badge (not `hidden`)

#### Scenario: Each card image uses astro:assets with lazy loading and descriptive alt
- **WHEN** the SolutionSection renders a card with a solution carrying `image` and `imageAlt` props
- **THEN** the card contains an `<img>` (or `<picture>`) rendered by `astro:assets` `<Image>` (or `<Picture>`)
- **AND** the element carries `loading="lazy"`
- **AND** the element carries an `alt` attribute matching the `imageAlt` prop value

#### Scenario: Each card title renders as an h4 with navy color token
- **WHEN** the SolutionSection renders a card with `title="Medición de Fluidos"`
- **THEN** the card contains an `<h4>` element whose visible text equals "Medición de Fluidos" verbatim
- **AND** the `<h4>` carries a class expressing the navy secondary color token (e.g. `text-secondary`)
- **AND** the `<h4>` uses the `font-heading` token family

#### Scenario: Each card description renders as a paragraph
- **WHEN** the SolutionSection renders a card with `description="..."`
- **THEN** the card contains a `<p>` element whose visible text equals the description verbatim
- **AND** the `<p>` carries a class expressing the muted secondary text color token (e.g. `text-text-2`)

#### Scenario: Each card CTA renders as a solid primary button with text SABER MÁS and a decorative arrow
- **WHEN** the SolutionSection renders a card with `href="/soluciones"` and `ctaLabel="SABER MÁS"`
- **THEN** the card contains an `<a>` element with the `href` attribute set to the solution's `href` value
- **AND** (POST-APPLY UPDATE) the `<a>` carries the design-system solid primary button pattern (same as the HeroBanner "VER SERVICIOS" CTA): a teal background token (e.g. `bg-primary`), white text (e.g. `text-white`), hover darkening (`hover:bg-primary-dark`), horizontal+vertical padding (`px-6`, `py-3`), `inline-flex items-center gap-1`, `font-heading font-semibold uppercase text-xs tracking-wide` and `transition-colors` — a plain text link without background (e.g. only `text-primary`) is NOT compliant
- **AND** the visible text of the `<a>` includes "SABER MÁS"
- **AND** the `<a>` contains an `<svg>` rendered by `astro-icon` from `lucide:arrow-right`
- **AND** the arrow `<svg>` carries `aria-hidden="true"` (it is decorative)

### Requirement: SolutionSection is a dumb presentational component
The `solution-section` SHALL be a dumb component: it SHALL NOT perform any data fetching (no `fetch`, no Firestore calls), SHALL NOT read `import.meta.env` directly, and SHALL NOT hold reactive state. All data (eyebrow, headline, description, solutions array) SHALL be received through typed props spread by the consuming page (`apps/web/src/pages/index.astro`).

#### Scenario: Component renders in isolation with all required props
- **WHEN** the SolutionSection is rendered via `AstroContainer.renderToString` with a complete `SolutionSectionProps` object containing 4 solutions
- **THEN** the rendered HTML contains the section header and exactly 4 cards
- **AND** the rendered HTML references the eyebrow, headline and description texts provided in the props

#### Scenario: Component frontmatter contains no import.meta.env access
- **WHEN** the source file `apps/web/src/components/SolutionSection.astro` is inspected
- **THEN** the frontmatter (between `---` fences) does NOT contain the literal string `import.meta.env`
- **AND** the frontmatter does NOT contain the literal string `fetch(`

### Requirement: SolutionSection consumes only canonical design tokens
The `solution-section` SHALL consume design tokens declared in `apps/web/src/styles/globals.css` (`bg-primary`, `bg-white`, `text-secondary`, `text-accent`, `text-text-2`, `text-primary`, `font-heading`, `shadow-*`). The component SHALL NOT use literal hex color values (e.g. `#41B3C4`) anywhere in its markup or class attributes. The component SHALL NOT use the deprecated `brand-*` tokens (e.g. `bg-brand-teal`, `text-brand-navy`).

#### Scenario: No literal hex color values in the rendered HTML
- **WHEN** the SolutionSection renders
- **THEN** the rendered HTML does NOT contain any substring matching the regex `/#[0-9a-fA-F]{3,8}/`

#### Scenario: No deprecated brand-* tokens in the rendered HTML
- **WHEN** the SolutionSection renders
- **THEN** the rendered HTML does NOT contain any substring matching the regex `/brand-(teal|navy|orange|gray)/`

#### Scenario: Eyebrow uses the accent color token (orange family)
- **WHEN** the SolutionSection renders
- **THEN** the eyebrow `<span>` carries a class expressing the accent color token (e.g. `text-accent` or `text-accent-dark` — the dark variant is the shipped default to meet WCAG AA Normal on white; see design.md § Decision 8 post-apply update)

### Requirement: SolutionSection preserves the home page heading outline
The `solution-section` SHALL render its headline as `<h3>` (NOT `<h1>` and NOT `<h2>`), since the home page already has a single `<h1>` (owned by HeroBanner) and a single `<h2>` (owned by PanelHome). Each card title SHALL be rendered as `<h4>`, subordinate to the section `<h3>`. The component SHALL NOT introduce any new `<h1>` or `<h2>` elements.

#### Scenario: Heading counts after rendering the section in isolation
- **WHEN** the SolutionSection renders in isolation (no other components present)
- **THEN** the rendered HTML contains exactly one `<h3>` (the section headline)
- **AND** the rendered HTML contains exactly N `<h4>` elements, where N equals the length of `solutions` prop
- **AND** the rendered HTML contains zero `<h1>` elements
- **AND** the rendered HTML contains zero `<h2>` elements

#### Scenario: Headline is reachable via assistive technology (not aria-hidden)
- **WHEN** the SolutionSection renders
- **THEN** the `<h3>` headline element does NOT carry `aria-hidden="true"`
- **AND** the `<h3>` headline element does NOT carry `tabindex="-1"`

### Requirement: SolutionSection uses astro-icon and astro:assets pipelines
The `solution-section` SHALL render all icons via `astro-icon` (using `<Icon name="lucide:..." />` from the Lucide icon set, stroke 2px, outline) and all images via `astro:assets` (using `<Image>` or `<Picture>` with the `sharp` service built into Astro). The component SHALL NOT install or import the deprecated `@astrojs/image` package. Card icons SHALL be drawn exclusively from the Lucide set.

#### Scenario: Card badges use Lucide icons from a constrained allowlist
- **WHEN** the SolutionSection renders a card with `icon: "gauge"`
- **THEN** the rendered SVG inside the badge has a class or `data-icon` attribute consistent with the Lucide `gauge` icon
- **AND** the badge does NOT contain an inline `<svg>` defined locally in the component (i.e. it is consumed via `astro-icon`)

#### Scenario: Images are processed by astro:assets (not raw <img src=...>)
- **WHEN** the SolutionSection renders a card
- **THEN** the card's image element carries a `src` attribute resolving to a hashed/optimized path (e.g. `/_astro/...` or `/.astro/...`) rather than a raw `apps/web/src/assets/img/...` path
- **AND** the image element carries `width` and `height` attributes (explicit dimensions, generated by `astro:assets`)

### Requirement: SolutionSection content is configured via a hardcoded constant
The `solution-section` content SHALL come from the `SOLUTION_SECTION_CONTENT` constant in `lib/config/solution-section.ts`, exported as `Readonly<SolutionSectionProps>`, containing exactly 4 solutions and the section header copy. The 4 solutions SHALL be, in render order: "Medición de Fluidos", "Tratamiento de Agua", "Productos Químicos", "Control y Accesorios". Each solution SHALL carry a `slug`, `title`, `description`, `image` (imported from `apps/web/src/assets/img/`), `imageAlt`, `icon` (one of the `SolutionIconName` allowlist) and `href` defaulting to `/soluciones`.

#### Scenario: SOLUTION_SECTION_CONTENT exposes the full set of props
- **WHEN** `SOLUTION_SECTION_CONTENT` is imported from `lib/config/solution-section`
- **THEN** it has the shape `{ readonly eyebrow: string; readonly headline: string; readonly description: string; readonly solutions: readonly Solution[] }`
- **AND** `eyebrow`, `headline` and `description` are non-empty strings
- **AND** `solutions` has length exactly 4

#### Scenario: Solutions carry the expected titles in render order
- **WHEN** `SOLUTIONS_DATA` (or `SOLUTION_SECTION_CONTENT.solutions`) is inspected
- **THEN** the titles in render order are exactly: "Medición de Fluidos", "Tratamiento de Agua", "Productos Químicos", "Control y Accesorios"

#### Scenario: All solutions use the generic /soluciones href by default
- **WHEN** `SOLUTIONS_DATA` is inspected
- **THEN** every element's `href` equals `"/soluciones"`

#### Scenario: Each solution carries a Lucide icon from the constrained allowlist
- **WHEN** `SOLUTIONS_DATA` is inspected
- **THEN** each element's `icon` is one of `"gauge"`, `"droplet"`, `"flask-conical"`, `"settings-2"`
- **AND** the icons in render order are exactly: `"gauge"`, `"droplet"`, `"flask-conical"`, `"settings-2"`

#### Scenario: Each solution carries a non-empty descriptive imageAlt
- **WHEN** `SOLUTIONS_DATA` is inspected
- **THEN** each element's `imageAlt` is a non-empty string describing the image content (not the title)

### Requirement: SolutionSection integrates into the home page after PanelHome
The `apps/web/src/pages/index.astro` SHALL render `<HeroBanner {...HERO_BANNER_CONTENT} />` followed by `<PanelHome {...PANEL_HOME_CONTENT} />` followed by `<SolutionSection {...SOLUTION_SECTION_CONTENT} />`, all inside the `<Layout>` slot. The SolutionSection SHALL NOT replace any existing component; all three render on the home page in the documented order.

#### Scenario: Home page renders HeroBanner, PanelHome and SolutionSection in order
- **WHEN** a visitor loads `/` (the home page)
- **THEN** the rendered HTML contains the HeroBanner `<section>` (with the hero `<h1>` headline)
- **AND** the rendered HTML contains the PanelHome `<section>` (with the panel `<h2>` headline)
- **AND** the rendered HTML contains the SolutionSection `<section>` (with the section `<h3>` headline and 4 `<h4>` card titles)
- **AND** (POST-APPLY UPDATE) the visible heading outline of the loaded page keeps exactly 1 `<h1>`, 2 `<h2>`, 1 `<h3>` and 4 `<h4>`; the count is performed over visible elements because the Astro Dev Toolbar (present in `astro preview`) appends hidden `<h1>` elements to the DOM that are NOT part of the page content

#### Scenario: DOM order is preserved: hero → panel → solutions
- **WHEN** the home page renders
- **THEN** the rendered HTML keeps the existing order: `<TopHeader />`, then `<header>` (site-header), then the SearchForm `<div role="search">`, then the HeroBanner `<section>`, then the PanelHome `<section>`, then the SolutionSection `<section>`
- **AND** the count of `<header>` elements in the document is still exactly one (no new landmark is introduced)

#### Scenario: SolutionSection does not modify HeroBanner or PanelHome rendered HTML
- **WHEN** the home page renders with all three components
- **THEN** the HeroBanner `<section>` carries the same set of classes and content it would carry when rendered alone
- **AND** the PanelHome `<section>` carries the same set of classes and content it would carry when rendered alone

