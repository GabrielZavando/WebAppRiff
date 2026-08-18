# services-page Specification

## Purpose
TBD - created by archiving change servicios-page. Update Purpose after archive.
## Requirements
### Requirement: ServicesHero renders headline with highlighted word and subtitle
The services-hero SHALL render a headline from the `headline` prop with the `highlightedWord` substring wrapped in a `<span class="text-accent">`, plus a `subtitle` rendered as a subordinate paragraph, following the same split logic as HeroBanner/ContactHero via `splitHeadline()`.

#### Scenario: Headline renders with highlighted span
- **WHEN** the ServicesHero renders with `headline="Servicios Especializados en Precisión y Control"` and `highlightedWord="Precisión"`
- **THEN** the rendered HTML contains the full headline text
- **AND** the substring "Precisión" is wrapped in a `<span class="text-accent">`

#### Scenario: Subtitle rendered
- **WHEN** the ServicesHero renders with `subtitle` non-empty
- **THEN** a subtitle element is rendered containing the `subtitle` text

#### Scenario: Highlight absent when word not found
- **WHEN** the ServicesHero renders with `highlightedWord` empty or not present in `headline`
- **THEN** no `<span class="text-accent">` is rendered
- **AND** the full `headline` is rendered as plain text

#### Scenario: Hero section is transparent over the home banner image
- **WHEN** the ServicesHero renders
- **THEN** the section carries NO `bg-secondary-dark` class and NO own background class (it is transparent, overlaying the `Layout` banner image)
- **AND** the headline carries `text-white`
- **AND** no `rounded*` or `shadow*` classes appear in the static markup

### Requirement: ServiceCard renders number, sector, title and image
The service-card SHALL render an index `number`, a `sector` label, a `title` and an `image` (via `astro:assets`), with the image position controlled by the `imagePosition` prop (`left` or `right`) and a responsive layout (image stacked on mobile, side-by-side from `md+`). The short `description` field was removed (post-apply): the only prose on a card is the optional `intro` lead-in paragraph (when present) followed by the optional `bullets` check-list.

#### Scenario: Number formatted as two digits
- **WHEN** the ServiceCard renders with `number={1}`
- **THEN** the rendered HTML contains the text "01"
- **AND** the number carries a class containing `text-primary`

#### Scenario: Sector label rendered in primary uppercase
- **WHEN** the ServiceCard renders with `sector="SECTOR INDUSTRIAL"`
- **THEN** a `<span>` (or `<p>`) with text "SECTOR INDUSTRIAL" is rendered
- **AND** it carries classes `text-primary` and `uppercase`

#### Scenario: Title rendered as h2
- **WHEN** the ServiceCard renders with `title="Medición Industrial"`
- **THEN** an `<h2>` element containing "Medición Industrial" is rendered

#### Scenario: Image renders with descriptive alt and lazy loading
- **WHEN** the ServiceCard renders with `image` metadata and `imageAlt` text
- **THEN** an `<img>` (emitted by `astro:assets`) with `alt` equal to `imageAlt` is rendered
- **AND** the image element carries `loading="lazy"`

#### Scenario: Image position left (default)
- **WHEN** the ServiceCard renders with `imagePosition="left"`
- **THEN** the image element appears before the text content in DOM order on `md+` layouts (no `flex-row-reverse` wrapper class)

#### Scenario: Image position right reverses order
- **WHEN** the ServiceCard renders with `imagePosition="right"`
- **THEN** the wrapper carries a class containing `md:flex-row-reverse` (image after text on `md+`)

### Requirement: ServiceCard renders optional bullets with check icons
The service-card SHALL render an optional `bullets` list as a `<ul>` where each item shows a `lucide:check` icon (decorative, `aria-hidden="true"`) in the primary color and the bullet text.

#### Scenario: Bullets rendered when provided
- **WHEN** the ServiceCard renders with `bullets={["Precisión: ±0.5%", "Integración: SCADA/PLC"]}`
- **THEN** a `<ul>` is rendered containing exactly two `<li>` elements
- **AND** each `<li>` contains the corresponding bullet text
- **AND** a `lucide:check` icon (decorative, `aria-hidden="true"`) is rendered inside the list

#### Scenario: No bullets when absent
- **WHEN** the ServiceCard renders without a `bullets` prop (or empty array)
- **THEN** no `<ul>` of bullets is rendered

### Requirement: ServiceCard renders optional tags as pills
The service-card SHALL render an optional `tags` list as a row of pills, each pill a `<span>` with `border border-border` and `text-text-2`.

#### Scenario: Tags rendered when provided
- **WHEN** the ServiceCard renders with `tags={["Ingeniería Conceptual", "Diseño de Detalle"]}`
- **THEN** exactly two pill `<span>` elements are rendered
- **AND** each pill carries `border` and `border-border` classes
- **AND** the pill text matches the tag labels

#### Scenario: No tags when absent
- **WHEN** the ServiceCard renders without a `tags` prop (or empty array)
- **THEN** no pill elements are rendered

### Requirement: ServiceCard renders an optional intro paragraph
The service-card SHALL render an optional `intro` paragraph (string) as the first prose block above the `bullets` list, when the prop is provided. The `intro` is the lead-in copy that precedes the check-list (e.g. "Nuestro servicio incluye:"). It is rendered as a `<p>` with the muted body styling (`text-text-2`). The short `description` field no longer exists, so `intro` is the only paragraph rendered before the bullets.

#### Scenario: Intro rendered when provided
- **WHEN** the ServiceCard renders with `intro="Optimizamos el consumo de agua en comunidades y edificios con la instalación y renovación de medidores de agua caliente. Nuestro servicio incluye:"`
- **THEN** a `<p>` element is rendered containing that exact intro text
- **AND** that `<p>` appears before the `bullets` `<ul>` in document order

#### Scenario: No intro when absent
- **WHEN** the ServiceCard renders without an `intro` prop
- **THEN** no `<p>` with the intro copy is rendered (no prose paragraph is rendered, since the short `description` field was removed)

### Requirement: ServiceCard renders CTA button to contact page with accent color
The service-card SHALL render a CTA `<a>` pointing to `/contacto` with the visible text "CONTACTAR A UN ESPECIALISTA", using the `bg-accent` token and a right-arrow icon.

#### Scenario: CTA rendered with accent color and link
- **WHEN** the ServiceCard renders with default props
- **THEN** an `<a href="/contacto">` is rendered
- **AND** its visible text contains "CONTACTAR A UN ESPECIALISTA"
- **AND** the anchor carries a class containing `bg-accent`
- **AND** an arrow icon (decorative, `aria-hidden="true"`) is rendered inside the anchor

### Requirement: ServiceCard uses flat design tokens
The service-card SHALL NOT use `rounded*` or `shadow*` classes in its static state, and SHALL use the project design tokens (`text-primary`, `bg-white`, `border-border`, `bg-accent`, `text-secondary`, etc.).

#### Scenario: No rounded or shadow classes
- **WHEN** the ServiceCard renders
- **THEN** the rendered HTML contains no class containing `rounded`
- **AND** the rendered HTML contains no class containing `shadow`

#### Scenario: Card surface uses white background with border
- **WHEN** the ServiceCard renders
- **THEN** the card root element carries `bg-white` and `border` and `border-border` classes

### Requirement: Services page composes hero and four alternating cards over the home banner
The `/servicios` page SHALL render `ServicesHero` and exactly four `ServiceCard` components inside `Layout` with `hero` and the `heroImage` prop set to `tratamiento-agua.webp` (overriding the `Layout` default `banner_home.webp`), so `Layout` renders that image full-bleed with a `bg-secondary/80` color overlay behind the transparent header/search and `ServicesHero`, with the header/search changing to their solid color on scroll exactly like the home page. The cards use `bg-bg` as the surface behind them, with alternating `imagePosition` (`left` for cards 1 and 3, `right` for cards 2 and 4). Cards 01 (`Medición en Edificios`), 02 (`Medición Industrial`) and 03 (`Obras y Proyectos`) SHALL each render an `intro` paragraph followed by a `bullets` check-list (card 03 now uses bullets instead of tags); card 04 (`Tratamiento de Agua y Desalinización`) SHALL remain unchanged with only its `bullets` list (no `description`, no `intro`).

#### Scenario: Page renders hero and four cards
- **WHEN** `apps/web/src/pages/servicios.astro` is built
- **THEN** the rendered HTML contains the services hero headline
- **AND** the rendered HTML contains exactly four `<h2>` service titles
- **AND** the rendered HTML contains four `astro:assets` `<img>` elements

#### Scenario: Page renders the tratamiento-agua hero image with overlay
- **WHEN** `servicios.astro` is rendered
- **THEN** the page passes `hero` to `Layout` AND passes `heroImage` with `tratamiento-agua.webp`, so `tratamiento-agua.webp` IS rendered as the full-bleed background image with the `bg-secondary/80` overlay
- **AND** `banner_home.webp` is NOT rendered on the servicios page
- **AND** the transparent header/search become solid on scroll (same behavior as the home page)

#### Scenario: Alternating image positions
- **WHEN** `servicios.astro` is rendered with the four services in order
- **THEN** the first card (`Medición en Edificios`) and the third card (`Obras y Proyectos`) render without `md:flex-row-reverse` (image left)
- **AND** the second card (`Medición Industrial`) and the fourth card (`Tratamiento de Agua y Desalinización`) render with `md:flex-row-reverse` (image right)

#### Scenario: Cards 01-03 render intro paragraph and check-list, card 04 unchanged
- **WHEN** `servicios.astro` is rendered
- **THEN** card 01 (`Medición en Edificios`) contains an `intro` paragraph beginning with "Optimizamos el consumo de agua" and a `<ul>` of eight bullets
- **AND** card 02 (`Medición Industrial`) contains an `intro` paragraph beginning with "Ofrecemos soluciones especializadas" and a `<ul>` of eight bullets
- **AND** card 03 (`Obras y Proyectos`) contains an `intro` paragraph beginning with "Desarrollamos infraestructura" and a `<ul>` of four bullets (no tag pills)
- **AND** card 04 (`Tratamiento de Agua y Desalinización`) contains only its existing bullet list (no `description`, no `intro` paragraph)

#### Scenario: Card section uses neutral background
- **WHEN** `servicios.astro` is rendered
- **THEN** the section wrapping the four cards carries a class containing `bg-bg`

