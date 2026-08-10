# site-footer Specification

## Purpose
Global footer of the public site (`apps/web`, Astro SSG) rendered by `Layout.astro` on every page — dark navy full-bleed shell (`bg-secondary-dark`), brand column (logo image + tagline + social icons shared with `TopHeader`), two link columns (SERVICIOS, EMPRESA) with placeholder `href="#"`, technical schedule column with 24/7 support note, and a copyright bar with location and a scroll-to-top teal button; strictly flat design (no `rounded*`, no `shadow*`).
## Requirements
### Requirement: Footer renders as a full-bleed dark section with canonical container

The `site-footer` SHALL render a `<footer>` element as its outermost element, spanning the full viewport width with the dark navy background token `bg-secondary-dark`. The footer SHALL contain a single inner container using the canonical container utilities (`mx-auto px-4 sm:px-6 lg:px-8` and the `max-w-7xl` constraint expressed by the `container` utility). The main content zone SHALL carry vertical padding utilities (`py-16 md:py-24`).

#### Scenario: Footer is the outermost element

- **WHEN** the footer renders
- **THEN** the outermost element of the rendered HTML is a `<footer>` element
- **AND** the `<footer>` element is NOT nested inside another `<footer>` element produced by the component itself

#### Scenario: Footer uses the dark navy background token

- **WHEN** the footer renders
- **THEN** the `<footer>` opening tag carries the `bg-secondary-dark` class
- **AND** the rendered HTML does NOT contain the lighter `bg-bg` utility on the footer's outermost element

#### Scenario: Footer uses the canonical container for inner width

- **WHEN** the footer renders
- **THEN** the footer contains an inner `<div>` carrying the `container` class (or the equivalent `mx-auto px-4 sm:px-6 lg:px-8` plus `max-w-7xl` constraint)

#### Scenario: Footer carries vertical padding utilities

- **WHEN** the footer renders
- **THEN** the main content zone carries a mobile vertical padding class (e.g. `py-16`)
- **AND** the main content zone carries a larger vertical padding class at the `md` breakpoint (e.g. `md:py-24`)

### Requirement: Footer renders a responsive four-column grid

The `site-footer` SHALL render a grid of four columns inside the canonical container: the brand column, SERVICIOS column, EMPRESA column and HORARIO TÉCNICO column. The grid SHALL be responsive mobile-first: one column at the base breakpoint, two columns from the `md` breakpoint and four columns from the `lg` breakpoint (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`), with a consistent gap utility between columns.

#### Scenario: Grid uses responsive column classes

- **WHEN** the footer renders
- **THEN** the grid container carries the `grid-cols-1` class
- **AND** the grid container carries the `md:grid-cols-2` class
- **AND** the grid container carries the `lg:grid-cols-4` class
- **AND** the grid container carries a gap utility (e.g. `gap-10`)

#### Scenario: Grid contains the four expected columns

- **WHEN** the footer renders with the default content
- **THEN** the output contains a brand column (logo + tagline + social icons)
- **AND** the output contains a column titled "SERVICIOS"
- **AND** the output contains a column titled "EMPRESA"
- **AND** the output contains a column titled "HORARIO TÉCNICO"

### Requirement: Brand column shows logo image, tagline and social icons

The `site-footer` SHALL render a brand column as the first grid cell containing: the existing header logo image (`logo-web.webp`) via `astro:assets` `<Image>` with a descriptive `alt` attribute (falling back to "Riff" when not provided) and `loading="lazy"`; the brand tagline paragraph styled with the muted text token; and the configured social links rendered as Lucide icons (`lucide:facebook`, `lucide:twitter`, `lucide:instagram`, `lucide:linkedin`) with `aria-label` per network, `target="_blank"` and `rel="noopener noreferrer"`. Only social networks with a configured URL SHALL render.

#### Scenario: Logo image renders via astro assets with lazy loading

- **WHEN** the footer renders
- **THEN** the brand column contains an `<img>` element rendered via `astro:assets` from `logo-web.webp`
- **AND** the image declares `loading="lazy"`
- **AND** the image carries a non-empty `alt` attribute

#### Scenario: Tagline renders with the muted color token

- **WHEN** the footer renders with the default content
- **THEN** the brand column contains a paragraph with the text "Innovación tecnológica en la gestión de fluidos desde 1979."
- **AND** the paragraph carries a muted text color class (e.g. `text-muted`)

#### Scenario: Only configured social links render

- **WHEN** the footer renders with two of the four social URLs configured
- **THEN** the brand column contains exactly two social anchor elements
- **AND** each rendered social anchor carries a Lucide icon and an `aria-label` matching the network name
- **AND** each rendered social anchor declares `target="_blank"` and `rel="noopener noreferrer"`

### Requirement: Link columns render headings and placeholder links

The `site-footer` SHALL render the SERVICIOS and EMPRESA columns, each composed of a column title label styled with the `font-heading` family, the primary teal color token and uppercase (a `<p>` element, NOT a heading — the footer must not alter the per-page heading outline) followed by exactly four `<a>` link items per column. Each link SHALL carry a placeholder `href="#"` (real routes are a future change), a `text-white/80` base color and a `hover:text-white` state.

#### Scenario: SERVICIOS column renders title with teal uppercase label

- **WHEN** the footer renders with the default content
- **THEN** the output contains a `<p>` element with the visible text "SERVICIOS"
- **AND** that `<p>` element carries the `font-heading` class
- **AND** that `<p>` element carries the `text-primary` color class
- **AND** that `<p>` element carries an `uppercase` class
- **AND** the footer output does NOT contain any `<h2>` or `<h3>` element

#### Scenario: SERVICIOS column renders its four configured links

- **WHEN** the footer renders with the default content
- **THEN** the SERVICIOS column contains exactly 4 anchor elements with the texts "Instalación de Medidores", "Control de Agua Caliente", "Puesta en Marcha Industrial" and "Obras Civiles Hidráulicas"
- **AND** every SERVICIOS anchor declares `href="#"`

#### Scenario: EMPRESA column renders title and its four configured links

- **WHEN** the footer renders with the default content
- **THEN** the output contains a `<p>` element with the visible text "EMPRESA"
- **AND** the EMPRESA column contains exactly 4 anchor elements with the texts "Nuestra Historia", "Representaciones", "Proyectos de Éxito" and "Contacto Directo"
- **AND** every EMPRESA anchor declares `href="#"`

### Requirement: Schedule column renders business hours and 24/7 note

The `site-footer` SHALL render the HORARIO TÉCNICO column containing: a column title label styled like the other columns; the schedule entries as a definition list (`<dl>`) with one `<dt>` (day range, white, semibold) and one `<dd>` (hours, muted color token) per entry; and a 24/7 support note rendered with a `lucide:clock` icon (decorative, `aria-hidden="true"`) and text in the primary teal color token.

#### Scenario: Schedule entries render day range and hours

- **WHEN** the footer renders with the default content
- **THEN** the schedule column contains a `<dl>` element
- **AND** the `<dl>` contains a `<dt>` with the text "Lunes a Jueves" and a matching `<dd>` with the text "09:00 a 18:00"
- **AND** the `<dl>` contains a `<dt>` with the text "Viernes" and a matching `<dd>` with the text "09:00 a 17:00"

#### Scenario: 24/7 support note renders with teal color and clock icon

- **WHEN** the footer renders with the default content
- **THEN** the schedule column contains the text "Soporte 24/7 disponible"
- **AND** the note carries the `text-primary` color class
- **AND** the note contains a `lucide:clock` icon rendered as an `<svg>` with `aria-hidden="true"`

### Requirement: Copyright bar shows copyright, location and scroll-to-top button

The `site-footer` SHALL render a bottom bar separated from the main zone by a horizontal divider (a `<div>` with `border-t` and a low-opacity white border, e.g. `border-white/10`). The bar SHALL contain: the copyright notice ("© 2024 RIFF SPA. TODOS LOS DERECHOS RESERVADOS.") styled with the muted color token and uppercase; the location text ("SANTIAGO, CHILE") styled with the muted color token and uppercase; and a square teal button (`bg-primary`, `text-white`) with a `lucide:arrow-up` icon, `aria-label="Volver arriba"` and a `data-scroll-top` attribute.

#### Scenario: Copyright text renders muted and uppercase

- **WHEN** the footer renders with the default content
- **THEN** the bottom bar contains the text "© 2024 RIFF SPA. TODOS LOS DERECHOS RESERVADOS."
- **AND** the copyright text carries the `text-muted` color class
- **AND** the copyright text carries an `uppercase` class

#### Scenario: Location renders muted and uppercase

- **WHEN** the footer renders with the default content
- **THEN** the bottom bar contains the text "SANTIAGO, CHILE"
- **AND** the location text carries the `text-muted` color class
- **AND** the location text carries an `uppercase` class

#### Scenario: Scroll-to-top button renders with teal background and arrow icon

- **WHEN** the footer renders
- **THEN** the bottom bar contains a `<button>` element carrying the `data-scroll-top` attribute
- **AND** the button carries the `bg-primary` and `text-white` classes
- **AND** the button carries `aria-label="Volver arriba"`
- **AND** the button contains a `lucide:arrow-up` icon rendered as an `<svg>`

### Requirement: Scroll-to-top script navigates smoothly to the top

The `site-footer` SHALL ship an inline client script (same pattern as `Header.astro`) that attaches a click handler to every element with the `data-scroll-top` attribute; on click, the handler SHALL scroll the window to the top with `behavior: 'smooth'`.

#### Scenario: Script targets data-scroll-top elements

- **WHEN** the component source is inspected
- **THEN** it contains an inline `<script>` tag
- **AND** the script queries `[data-scroll-top]` elements
- **AND** the script calls `window.scrollTo` with `top: 0` and `behavior: 'smooth'`

### Requirement: Component is presentational with a typed props contract

The component SHALL NOT fetch data, import services or contain business logic beyond destructuring props; it SHALL render exclusively from props. The props SHALL be typed by `SiteFooterProps` with all fields `readonly`: `logoAlt`, `tagline`, `socialLinks` (reusing `SocialLink` from `@/lib/types/top-header`), `columns` (array of `FooterColumn` — `title` + `links` of `FooterLink`), `schedule` (array of `FooterScheduleEntry` — `days` + `hours`) and `scheduleNote`. The component SHALL NOT use `any`.

#### Scenario: Props contract matches the config constant

- **WHEN** `SITE_FOOTER_CONTENT` is spread onto the component
- **THEN** the constant is assignable to `SiteFooterProps`
- **AND** every column title is `SERVICIOS` or `EMPRESA`
- **AND** every link in the content carries the placeholder `href="#"`

#### Scenario: Component has no data-fetching logic

- **WHEN** the component frontmatter is inspected
- **THEN** it only destructures `Astro.props` and imports types, config and `astro:assets`/`astro-icon`, without network calls or service imports

### Requirement: Flat design tokens are used

The component SHALL use only the project's design tokens: `bg-secondary-dark` for the footer background, `text-white` for the logo/labels, `text-primary` for column titles and the 24/7 note, `text-muted` for the tagline, schedule hours and copyright, `text-white/80` for links, and `border-white/10` for the divider. The component SHALL NOT use `rounded*` utilities (radius is 0, flat design) and SHALL NOT use `shadow*` utilities in its static state.

#### Scenario: No radius or shadow utilities are used

- **WHEN** the footer markup is rendered
- **THEN** no `rounded*` class is present in the footer markup
- **AND** no `shadow*` class is present in the footer markup

#### Scenario: No brand-* classes are used

- **WHEN** the component source is inspected
- **THEN** it does not reference any obsolete `bg-brand-*`, `text-brand-*` or `border-brand-*` class

