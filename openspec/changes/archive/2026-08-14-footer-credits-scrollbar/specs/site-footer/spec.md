## MODIFIED Requirements

### Requirement: Footer renders a responsive four-column grid

The `site-footer` SHALL render a grid of four columns inside the canonical container: the brand column, SERVICIOS column, EMPRESA column and the schedule column (now titled with the configurable `scheduleTitle` value, "Horario de Atención", rendered uppercase). The grid SHALL be responsive mobile-first: one column at the base breakpoint, two columns from the `md` breakpoint and four columns from the `lg` breakpoint (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`), with a consistent gap utility between columns.

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
- **AND** the output contains a column whose title label is the `scheduleTitle` prop value ("Horario de Atención"), rendered with the `uppercase` class so its visible text reads "HORARIO DE ATENCIÓN"
- **AND** the output does NOT contain the previous hardcoded literal "HORARIO TÉCNICO"

### Requirement: Link columns render headings and placeholder links

The `site-footer` SHALL render the SERVICIOS and EMPRESA columns, each composed of a column title label styled with the `font-heading` family, the primary teal color token and uppercase (a `<p>` element, NOT a heading — the footer must not alter the per-page heading outline) followed by exactly four `<a>` link items per column. Each link SHALL carry a placeholder `href="#"` (real routes are a future change), a `text-white/80` base color and a `hover:text-white` state. The SERVICIOS column SHALL list the real service offering: "Medición en Edificios", "Medición Industrial", "Obras y Proyectos" and "Tratamiento de Agua y Desalinización".

#### Scenario: SERVICIOS column renders title with teal uppercase label

- **WHEN** the footer renders with the default content
- **THEN** the output contains a `<p>` element with the visible text "SERVICIOS"
- **AND** that `<p>` element carries the `font-heading` class
- **AND** that `<p>` element carries the `text-primary` color class
- **AND** that `<p>` element carries an `uppercase` class
- **AND** the footer output does NOT contain any `<h2>` or `<h3>` element

#### Scenario: SERVICIOS column renders its four configured links

- **WHEN** the footer renders with the default content
- **THEN** the SERVICIOS column contains exactly 4 anchor elements with the texts "Medición en Edificios", "Medición Industrial", "Obras y Proyectos" and "Tratamiento de Agua y Desalinización"
- **AND** every SERVICIOS anchor declares `href="#"`
- **AND** the previous placeholder service labels ("Instalación de Medidores", "Control de Agua Caliente", "Puesta en Marcha Industrial", "Obras Civiles Hidráulicas") do NOT appear in the output

#### Scenario: EMPRESA column renders title and its four configured links

- **WHEN** the footer renders with the default content
- **THEN** the output contains a `<p>` element with the visible text "EMPRESA"
- **AND** the EMPRESA column contains exactly 4 anchor elements with the texts "Nuestra Historia", "Representaciones", "Proyectos de Éxito" and "Contacto Directo"
- **AND** every EMPRESA anchor declares `href="#"`

### Requirement: Schedule column renders business hours and 24/7 note

The `site-footer` SHALL render the schedule column containing: a column title label styled like the other columns, sourced from the `scheduleTitle` prop (configured value "Horario de Atención", rendered uppercase); the schedule entries as a definition list (`<dl>`) with one `<dt>` per entry (day range, white, semibold) followed by one or more `<dd>` blocks (each hour block, muted color token) so split-shift schedules are representable; and the 24/7 support note rendered with a `lucide:clock` icon (decorative, `aria-hidden="true"`) and text in the primary teal color token.

#### Scenario: Schedule column title comes from the configurable prop

- **WHEN** the footer renders with the default content
- **THEN** the schedule column title `<p>` element carries the visible text "HORARIO DE ATENCIÓN"
- **AND** that `<p>` element carries the `text-primary`, `font-heading` and `uppercase` classes
- **AND** the component does NOT contain a hardcoded "HORARIO TÉCNICO" literal

#### Scenario: Schedule entries render a day range followed by multiple hour blocks

- **WHEN** the footer renders with the default content
- **THEN** the schedule column contains a `<dl>` element
- **AND** the `<dl>` contains a `<dt>` with the text "Lunes a Jueves" followed by exactly two `<dd>` blocks with the texts "9:00 a 13:00 hrs." and "14:00 a 18:00 hrs.", in that order
- **AND** the `<dl>` contains a `<dt>` with the text "Viernes" followed by exactly two `<dd>` blocks with the texts "9:00 a 13:00 hrs." and "14:00 a 17:00 hrs.", in that order
- **AND** the `<dt>` carries the `text-white` and `font-semibold` classes
- **AND** every `<dd>` carries the `text-muted` class

#### Scenario: 24/7 support note renders with teal color and clock icon

- **WHEN** the footer renders with the default content
- **THEN** the schedule column contains the text "Soporte 24/7 disponible"
- **AND** the note carries the `text-primary` color class
- **AND** the note contains a `lucide:clock` icon rendered as an `<svg>` with `aria-hidden="true"`

### Requirement: Component is presentational with a typed props contract

The component SHALL NOT fetch data, import services or contain business logic beyond destructuring props; it SHALL render exclusively from props. The props SHALL be typed by `SiteFooterProps` with all fields `readonly`: `logoAlt`, `tagline`, `socialLinks` (reusing `SocialLink` from `@/lib/types/top-header`), `columns` (array of `FooterColumn` — `title` + `links` of `FooterLink`), `scheduleTitle` (string — the visible schedule column title, rendered uppercase), `schedule` (array of `FooterScheduleEntry` — `days` + `hours` as `readonly string[]` so a single day range can list one or more hour blocks) and `scheduleNote`. The component SHALL NOT use `any`. No column or schedule title SHALL be hardcoded inside the component.

#### Scenario: Props contract matches the config constant

- **WHEN** `SITE_FOOTER_CONTENT` is spread onto the component
- **THEN** the constant is assignable to `SiteFooterProps`
- **AND** the `scheduleTitle` field equals "Horario de Atención"
- **AND** every column title is `SERVICIOS` or `EMPRESA`
- **AND** every link in the content carries the placeholder `href="#"`
- **AND** every `FooterScheduleEntry.hours` is a `readonly string[]` of length 2

#### Scenario: Component has no data-fetching logic

- **WHEN** the component frontmatter is inspected
- **THEN** it only destructures `Astro.props` and imports types, config and `astro:assets`/`astro-icon`, without network calls or service imports
- **AND** the component frontmatter does NOT contain the literal string "HORARIO TÉCNICO"
