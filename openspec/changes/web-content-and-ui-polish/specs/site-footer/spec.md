# Spec Delta — site-footer

## REMOVED Requirements

### Requirement: Link columns render headings and placeholder links
**Reason**: Los enlaces placeholder `href="#"` quedaron obsoletos: todas las páginas destino ya existen y el cliente pidió apuntar las columnas a rutas reales. El enlace "Proyectos de Éxito" no tiene página destino y se elimina (decisión del usuario, 2026-10-24).
**Migration**: Sustituido por el requirement "Link columns render column labels and real internal routes" (ver ADDED), que conserva el estilo de los títulos de columna y define las rutas internas reales.

## ADDED Requirements

### Requirement: Link columns render column labels and real internal routes
The `site-footer` SHALL render the SERVICIOS and EMPRESA columns, each composed of a column title label styled with the `font-heading` family, the primary teal color token and uppercase (a `<p>` element, NOT a heading — the footer must not alter the per-page heading outline). Los enlaces SHALL apuntar a rutas internas reales del sitio: la columna SERVICIOS SHALL contener exactamente 4 enlaces — "Medición en Edificios" → `/servicios#medicion-en-edificios`, "Medición Industrial" → `/servicios#medicion-industrial`, "Obras y Proyectos" → `/servicios#obras-y-proyectos` y "Tratamiento de Agua y Desalinización" → `/servicios#tratamiento-de-agua` (slugs 1:1 con `SERVICIOS_FIELD_SECTION` de `/servicios`); la columna EMPRESA SHALL contener exactamente 3 enlaces — "Nuestra Historia" → `/nosotros#historia`, "Representaciones" → `/representaciones` y "Contacto Directo" → `/contacto`. El enlace "Proyectos de Éxito" SHALL eliminarse (sin página destino). Cada enlace conserva el estilo `text-white/80` base y `hover:text-white`. Los enlaces sociales externos (Facebook, Instagram, LinkedIn; X sin URL configurada no renderiza) provienen de `getContactInfo()` y no cambian.

#### Scenario: SERVICIOS column renders title with teal uppercase label

- **WHEN** the footer renders with the default content
- **THEN** the output contains a `<p>` element with the visible text "SERVICIOS"
- **AND** that `<p>` element carries the `font-heading` class
- **AND** that `<p>` element carries the `text-primary` color class
- **AND** that `<p>` element carries an `uppercase` class
- **AND** the footer output does NOT contain any `<h2>` or `<h3>` element

#### Scenario: SERVICIOS column deep-links to the four field-service anchors

- **WHEN** the footer renders with the default content
- **THEN** the SERVICIOS column contains exactly 4 anchor elements with the texts "Medición en Edificios", "Medición Industrial", "Obras y Proyectos" and "Tratamiento de Agua y Desalinización"
- **AND** sus `href` son, en orden, `/servicios#medicion-en-edificios`, `/servicios#medicion-industrial`, `/servicios#obras-y-proyectos` y `/servicios#tratamiento-de-agua`
- **AND** ningún anchor de la columna declara `href="#"`

#### Scenario: EMPRESA column renders its three real internal links

- **WHEN** the footer renders with the default content
- **THEN** the output contains a `<p>` element with the visible text "EMPRESA"
- **AND** la columna EMPRESA contiene exactamente 3 anchor elements: "Nuestra Historia" con `href="/nosotros#historia"`, "Representaciones" con `href="/representaciones"` y "Contacto Directo" con `href="/contacto"`
- **AND** el enlace "Proyectos de Éxito" ya no está presente en el footer
- **AND** ningún anchor de la columna declara `href="#"`

#### Scenario: Social external links remain valid and unchanged

- **WHEN** the footer renders con las URLs sociales configuradas
- **THEN** los anchors sociales conservan `target="_blank"`, `rel="noopener noreferrer"` y `aria-label` con el nombre de la red
- **AND** las URLs provienen de `getContactInfo()` sin modificaciones en este change

## MODIFIED Requirements

### Requirement: Component is presentational with a typed props contract

The component SHALL NOT fetch data, import services or contain business logic beyond destructuring props; it SHALL render exclusively from props. The props SHALL be typed by `SiteFooterProps` with all fields `readonly`: `logoAlt`, `tagline`, `socialLinks` (reusing `SocialLink` from `@/lib/types/top-header`), `columns` (array of `FooterColumn` — `title` + `links` of `FooterLink`), `scheduleTitle` (string — the visible schedule column title, rendered uppercase), `schedule` (array of `FooterScheduleEntry` — `days` + `hours` as `readonly string[]` so a single day range can list one or more hour blocks) and `scheduleNote`. The component SHALL NOT use `any`. No column or schedule title SHALL be hardcoded inside the component. Los `href` de `FooterLink` SHALL ser rutas internas reales (o URLs sociales completas); el config SHALL NOT declarar placeholders `href="#"`.

#### Scenario: Props contract matches the config constant

- **WHEN** `SITE_FOOTER_CONTENT` is spread onto the component
- **THEN** the constant is assignable to `SiteFooterProps`
- **AND** the `scheduleTitle` field equals "Horario de Atención"
- **AND** every column title is `SERVICIOS` or `EMPRESA`
- **AND** la columna SERVICIOS tiene 4 links y la columna EMPRESA 3 links, todos con `href` internos reales (sin `href="#"`)
- **AND** every `FooterScheduleEntry.hours` is a `readonly string[]` of length 2

#### Scenario: Component has no data-fetching logic

- **WHEN** the component frontmatter is inspected
- **THEN** it only destructures `Astro.props` and imports types, config and `astro:assets`/`astro-icon`, without network calls or service imports
- **AND** the component frontmatter does NOT contain the literal string "HORARIO TÉCNICO"
