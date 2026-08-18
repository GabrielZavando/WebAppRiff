## ADDED Requirements

### Requirement: CotizacionForm renders six form fields with associated labels
The cotizacion-form SHALL render text inputs for Nombre Completo, Correo Electrónico, Teléfono, Nombre de la Empresa, RUT de la Empresa, and a textarea for Mensaje, each with a visually associated `<label>` via `for`/`id` and uppercase label text.

#### Scenario: Inputs rendered with labels
- **WHEN** the CotizacionForm renders with default props
- **THEN** an `<input>` with `name="nombre"` is rendered
- **AND** an `<input type="email">` with `name="email"` is rendered
- **AND** an `<input type="tel">` with `name="telefono"` is rendered
- **AND** an `<input>` with `name="empresa"` is rendered
- **AND** an `<input>` with `name="rut"` is rendered
- **AND** each input has a `<label for>` pointing to its `id` with non-empty uppercase text

#### Scenario: Inputs carry placeholders
- **WHEN** the CotizacionForm renders with default config
- **THEN** the nombre input has `placeholder="Ej. Juan Pérez"`
- **AND** the email input has `placeholder="juan.perez@empresa.com"`
- **AND** the telefono input has `placeholder="+56 9 1234 5678"`
- **AND** the empresa input has `placeholder="Empresa S.A."`
- **AND** the rut input has `placeholder="12.345.678-9"`

#### Scenario: Form fields layout on desktop
- **WHEN** the CotizacionForm renders on `lg+` screens
- **THEN** the form fields are arranged in a two-column grid (`md:grid-cols-2`)
- **AND** the Nombre Completo and Correo Electrónico fields are on the same row
- **AND** the Teléfono and Nombre de la Empresa fields are on the same row
- **AND** the RUT de la Empresa field spans the full width
- **AND** the Mensaje textarea spans the full width

### Requirement: CotizacionForm renders the page heading "Datos del Requerimiento" as h1
The cotizacion-form SHALL render a page-level heading "Datos del Requerimiento" as an `<h1>` element (the page owns the single h1; the sidebar cards use `<h2>`), colored with the `text-primary-dark` token (project token for `#2E9AAD`).

#### Scenario: Heading rendered as h1
- **WHEN** the CotizacionForm renders
- **THEN** a `<h1>` element is rendered containing the text "Datos del Requerimiento"

#### Scenario: Heading uses the primary-dark token color
- **WHEN** the CotizacionForm renders
- **THEN** the `<h1>` carries a class containing `text-primary-dark` (the project token for `#2E9AAD`; no literal hex)

### Requirement: CotizacionForm renders the message textarea and submit button
The cotizacion-form SHALL render a `<textarea>` for the message and a `<button type="submit">` labelled "ENVIAR SOLICITUD" using the `bg-accent` token and a right-arrow icon.

#### Scenario: Textarea rendered
- **WHEN** the CotizacionForm renders with default props
- **THEN** a `<textarea name="mensaje">` is rendered with an associated `<label>` and placeholder "Describa los requerimientos técnicos de su proyecto..."

#### Scenario: Submit button rendered with accent color
- **WHEN** the CotizacionForm renders with default config
- **THEN** a `<button type="submit">` is rendered inside the `<form>`
- **AND** its visible text contains "ENVIAR SOLICITUD"
- **AND** the button carries a class containing `bg-accent`
- **AND** an arrow icon (decorative, `aria-hidden="true"`) is rendered inside the button

#### Scenario: Submit button spans the full form width
- **WHEN** the CotizacionForm renders with default config
- **THEN** the submit `<button>` carries a class containing `w-full`

### Requirement: CotizacionForm submits via POST to /api/v1/quotes
The cotizacion-form SHALL render a `<form method="post">` with `action` set to `/api/v1/quotes`, ready to be consumed by the existing backend endpoint.

#### Scenario: Form method and action
- **WHEN** the CotizacionForm renders with default config
- **THEN** a `<form>` element is rendered with `method="post"`
- **AND** its `action` attribute equals `/api/v1/quotes`

#### Scenario: RUT field is a real form field submitted to backend
- **WHEN** the form is submitted
- **THEN** the `rut` field value is included in the form data as `name="rut"`
- **AND** the backend will persist it via the separate change `backend-cotizaciones-rut` (this change only renders the field)

### Requirement: CotizacionProcess renders three process steps
The cotizacion-process SHALL render a card with a question-mark icon, the title "Proceso de Cotización", and three numbered steps (Recepción, Evaluación Técnica, Propuesta), each with a bold step title and a description paragraph.

#### Scenario: Card rendered with title and icon
- **WHEN** the CotizacionProcess renders with default props
- **THEN** a card element is rendered with a question-mark circle icon
- **AND** a title "Proceso de Cotización" is rendered
- **AND** the card has a light teal background (`bg-primary-light` or `bg-primary-100`)

#### Scenario: Three steps rendered
- **WHEN** the CotizacionProcess renders with `steps` containing three items
- **THEN** three step elements are rendered
- **AND** step 1 has title "Recepción" and description "Un ingeniero evaluará sus requerimientos técnicos en un plazo máximo de 24 horas hábiles."
- **AND** step 2 has title "Evaluación Técnica" and description about onsite visit or technical meeting
- **AND** step 3 has title "Propuesta" and description about formal proposal delivery

#### Scenario: Steps are rendered with explicit ordinal numbers
- **WHEN** the CotizacionProcess renders
- **THEN** the rendered steps show the ordinals "1. Recepción", "2. Evaluación Técnica", "3. Propuesta"

#### Scenario: Steps separated by visual dividers
- **WHEN** the CotizacionProcess renders
- **THEN** each step is separated by a subtle divider or spacing

### Requirement: CotizacionSupport renders a support CTA card
The cotizacion-support SHALL render a card with the title "¿Necesita soporte inmediato?", a description paragraph, a phone icon, and the phone number "+56 2 29079067" as a clickable `tel:` link.

#### Scenario: Card rendered with dark teal background
- **WHEN** the CotizacionSupport renders with default props
- **THEN** a card element is rendered with `bg-primary-deep` background
- **AND** the text color is white (`text-white`)

#### Scenario: Phone number is clickable
- **WHEN** the CotizacionSupport renders with `phone="+56 2 29079067"`
- **THEN** an anchor with `href="tel:+56229079067"` is rendered
- **AND** the phone number is visible as clickable text

#### Scenario: Support card has a phone icon
- **WHEN** the CotizacionSupport renders
- **THEN** a phone icon (Lucide `lucide:phone`) is rendered next to the phone number

### Requirement: Cotizacion page composes the three components in a two-column layout
The `/cotizacion` page SHALL render CotizacionForm, CotizacionProcess, and CotizacionSupport inside Layout with a two-column grid layout on desktop (form left, sidebar right) and stacked layout on mobile.

#### Scenario: Page renders all three components
- **WHEN** `apps/web/src/pages/cotizacion.astro` is built
- **THEN** the rendered HTML contains the cotizacion form (`<form method="post" action="/api/v1/quotes">`)
- **AND** the rendered HTML contains the process steps card
- **AND** the rendered HTML contains the support card

#### Scenario: Desktop layout is two columns
- **WHEN** the cotizacion page renders on `lg+` screens
- **THEN** the form occupies the left column (`lg:col-span-2`)
- **AND** the sidebar (process + support cards) occupies the right column

#### Scenario: Mobile layout is stacked
- **WHEN** the cotizacion page renders on screens smaller than `lg`
- **THEN** the form renders first in DOM order
- **AND** the sidebar renders below the form

#### Scenario: Page hides the hero image and the global search form
- **WHEN** `cotizacion.astro` is rendered
- **THEN** the page passes `hero={false}` to Layout so NO hero background image is rendered
- **AND** the page passes `showSearch={false}` to Layout so the global `SearchForm` is NOT rendered

### Requirement: Cotizacion page uses flat design tokens
The cotizacion page components SHALL NOT use `rounded*` or `shadow*` classes, and SHALL use the project design tokens (`bg-white`, `border-border`, `bg-primary-deep`, `bg-accent`, `text-secondary`, `font-heading`).

#### Scenario: No rounded or shadow classes
- **WHEN** the CotizacionForm, CotizacionProcess, or CotizacionSupport renders
- **THEN** the rendered HTML contains no class containing `rounded`
- **AND** the rendered HTML contains no class containing `shadow`

#### Scenario: Accent button uses token
- **WHEN** the CotizacionForm renders the submit button
- **THEN** the button carries `bg-accent` (no literal hex color)

### Requirement: CotizacionForm is keyboard accessible with native semantics
The cotizacion-form SHALL be operable with the keyboard using native HTML form semantics: Tab cycles through controls, Enter submits from inputs, and each control has an associated label.

#### Scenario: Labels programmatically associated
- **WHEN** the CotizacionForm renders
- **THEN** every `<input>` and the `<textarea>` has an associated `<label>` via `for`/`id`

#### Scenario: Submit button relies on visible text
- **WHEN** the CotizacionForm renders the submit button
- **THEN** the button's accessible name is its visible text (no extra `aria-label` required)
