# Spec Delta — solution-section

## MODIFIED Requirements

### Requirement: SolutionSection renders the section header with eyebrow, headline, teal underline and description
The `solution-section` SHALL render an `<section>` as its outermost element containing a header block composed of: an eyebrow `<span>` (uppercase, NOT a heading) with the eyebrow text; a headline `<h3>` with the headline text styled with the navy `--color-secondary` token; a teal underline bar `<div>` (carrying `bg-primary`) directly beneath the headline; and a description `<p>` with the description text. The header block SHALL be composed in a responsive grid: `grid-cols-1 lg:grid-cols-2` (left half holds eyebrow+headline+bar, right half holds the description paragraph). El titular por defecto de la sección en el home SHALL ser "Nuestros Productos" (renombrado desde "Nuestras Soluciones"); el resto del encabezado (eyebrow, subrayado teal, descripción) no cambia.

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
- **WHEN** the SolutionSection renders with `headline="Nuestros Productos"`
- **THEN** the header contains an `<h3>` element whose visible text equals "Nuestros Productos" verbatim
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

#### Scenario: Home headline reads "Nuestros Productos"
- **WHEN** la página `/` renderiza `<SolutionSection {...SOLUTION_SECTION_CONTENT} />`
- **THEN** el `<h3>` de la sección muestra exactamente "Nuestros Productos"
- **AND** ningún elemento de la sección muestra el texto "Nuestras Soluciones"

### Requirement: SolutionSection content is configured via a hardcoded constant and deep-links to /servicios
The `solution-section` content SHALL come from `SOLUTION_SECTION_CONTENT` in `lib/config/solution-section.ts`, exported as `Readonly<SolutionSectionProps>`, with exactly four solutions and the section header copy. El `headline` de la sección SHALL ser "Nuestros Productos" (el titular "Nuestras Soluciones — Portafolio Técnico" de `/servicios` pertenece a otra página y SHALL NOT modificarse). Each solution SHALL carry `slug`, `title`, `description`, `image`, `imageAlt`, `icon` and an `href` deep-linking to its `/servicios` portfolio anchor (`/servicios#solucion-*`). The anchor ids SHALL stay 1:1 with the `SolucionPortafolio.id` values in the `/servicios` config.

#### Scenario: SOLUTION_SECTION_CONTENT exposes the full set of props
- **WHEN** `SOLUTION_SECTION_CONTENT` is imported from `lib/config/solution-section`
- **THEN** it has the shape `{ readonly eyebrow: string; readonly headline: string; readonly description: string; readonly solutions: readonly Solution[] }`
- **AND** `eyebrow`, `headline` and `description` are non-empty strings
- **AND** `solutions` has length exactly 4

#### Scenario: SOLUTION_SECTION_CONTENT pins the renamed headline
- **WHEN** `SOLUTION_SECTION_CONTENT` is inspected
- **THEN** `headline` equals "Nuestros Productos"
- **AND** `eyebrow` sigue siendo "PORTAFOLIO" y `description` conserva su texto actual

#### Scenario: Solutions carry the expected titles in render order
- **WHEN** `SOLUTIONS_DATA` (or `SOLUTION_SECTION_CONTENT.solutions`) is inspected
- **THEN** the titles in render order are exactly: "Medición de Fluidos", "Tratamiento de Agua", "Productos Químicos", "Control y Accesorios"

#### Scenario: Each solution deep-links to its /servicios portfolio anchor
- **WHEN** `SOLUTIONS_DATA` is inspected
- **THEN** the `href` values in render order are exactly: `/servicios#solucion-medicion-fluidos`, `/servicios#solucion-tratamiento-agua`, `/servicios#solucion-productos-quimicos`, `/servicios#solucion-control-accesorios`
- **AND** no solution `href` equals the generic `/soluciones` path

#### Scenario: Each solution carries a Lucide icon from the constrained allowlist
- **WHEN** `SOLUTIONS_DATA` is inspected
- **THEN** each element's `icon` is one of `"gauge"`, `"droplet"`, `"flask-conical"`, `"settings-2"`
- **AND** the icons in render order are exactly: `"gauge"`, `"droplet"`, `"flask-conical"`, `"settings-2"`

#### Scenario: Each solution carries a non-empty descriptive imageAlt
- **WHEN** `SOLUTIONS_DATA` is inspected
- **THEN** each element's `imageAlt` is a non-empty string describing the image content (not the title)
