# cotizacion-page Specification

## Purpose
Página de cotización del sitio público: formulario con seis campos etiquetados, heading h1 'Datos del Requerimiento', submit POST a /api/v1/quotes, proceso en tres pasos y CTA de soporte.
## Requirements

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

El cotizacion-form SHALL render un `<form method="post">` cuyo atributo `action` sea una URL absoluta, resuelta en el frontmatter a partir de la acción de la config (default `/api/v1/quotes`) y de `PUBLIC_API_URL` (default `http://localhost:3000/api/v1`), de modo que el fallback nativo sin JavaScript haga POST al origen de la API y no al del sitio estático en producción. El envío con JavaScript no cambia: el submit SHALL seguir interceptado por el runtime de la página (`formSubmitClient`), la validación HTML5 nativa se mantiene, el payload (incluido el honeypot `website`) se envía como JSON vía `fetch` y el resultado se refleja en un bloque de estado inline accesible (`role="status"`, `aria-live="polite"`). En éxito el formulario se limpia; en error los campos permanecen intactos y se muestra un mensaje claro.

#### Scenario: Form method and action

- **WHEN** el CotizacionForm renderiza con la config por defecto y sin `PUBLIC_API_URL` definida
- **THEN** se renderiza un `<form>` con `method="post"`
- **AND** su atributo `action` es la URL absoluta por defecto `http://localhost:3000/api/v1/quotes`

#### Scenario: El action absoluto se deriva de PUBLIC_API_URL

- **WHEN** el CotizacionForm renderiza con `PUBLIC_API_URL=https://api.somosriff.cl/api/v1`
- **THEN** su atributo `action` es `https://api.somosriff.cl/api/v1/quotes`
- **AND** el sufijo `/api/v1` no aparece duplicado en la URL
- **AND** con `PUBLIC_API_URL=https://api.somosriff.cl` (sin el sufijo) el `action` resuelto es el mismo

#### Scenario: El fallback sin JavaScript hace POST al origen de la API

- **WHEN** el usuario envía el formulario con JavaScript deshabilitado
- **THEN** la petición nativa sale hacia el `action` absoluto (origen de la API), no hacia el origen del sitio estático

#### Scenario: RUT field is a real form field submitted to backend

- **WHEN** el formulario se envía
- **THEN** el valor del campo `rut` viaja en el payload JSON como `name="rut"`
- **AND** el backend lo persiste (cambio `backend-cotizaciones-rut` ya aplicado)

#### Scenario: Envío exitoso limpia el formulario y muestra confirmación

- **WHEN** el usuario envía el formulario y el `fetch` responde 2xx
- **THEN** se muestra un mensaje de confirmación en el bloque de estado inline
- **AND** el formulario se resetea (campos vacíos)

#### Scenario: Envío fallido conserva los campos y muestra error

- **WHEN** el `fetch` responde 4xx/5xx o falla la red
- **THEN** se muestra un mensaje de error claro en el bloque de estado inline
- **AND** los campos del formulario permanecen intactos (no se limpian)

#### Scenario: El fetch apunta a la URL base del backend, no al origen del sitio

- **WHEN** el formulario se envía vía `fetch` y el `action` es `/api/v1/quotes`
- **THEN** la petición se hace a la URL base de la API resuelta desde `PUBLIC_API_URL` (default `http://localhost:3000/api/v1`) más `/quotes`
- **AND** nunca se hace `fetch` a `/api/v1/quotes` contra el origen del sitio estático (que no expone la API en producción)

#### Scenario: El handler se enlaza en navegación cliente (View Transitions)

- **WHEN** la página `/cotizacion` se alcanza por navegación cliente tras un evento `astro:page-load` (no por carga completa)
- **THEN** el submit listener queda enlazado al `#cotizacion-form` que está en el DOM
- **AND** el envío es interceptado (no se produce una navegación nativa al `action`)

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

### Requirement: CotizacionForm renders a honeypot anti-spam field

El cotizacion-form SHALL render un campo honeypot `website` invisible para humanos (oculto vía CSS, `tabindex="-1"`, `autocomplete="off"`, `aria-hidden="true"`, sin label visible) con el fin de detectar envíos automatizados en el backend.

#### Scenario: Campo oculto presente

- **WHEN** el CotizacionForm renderiza con props por defecto
- **THEN** se renderiza un `<input name="website">` con clases de ocultamiento y `tabindex="-1"`
- **AND** el campo no tiene `<label>` visible asociado
- **AND** el campo tiene `autocomplete="off"` y `aria-hidden="true"`

### Requirement: CotizacionForm shows inline submit status

El cotizacion-form SHALL mostrar el resultado del envío en un bloque de estado inline dentro del formulario, accesible para lectores de pantalla (`role="status"`, `aria-live="polite"`) y con los tokens de diseño existentes (sin `rounded*` ni `shadow*`). Mientras el envío está en curso, el botón de submit SHALL estar deshabilitado para evitar dobles envíos.

#### Scenario: Bloque de estado presente

- **WHEN** el CotizacionForm renderiza
- **THEN** dentro del `<form>` hay un elemento con `role="status"` y `aria-live="polite"` listo para mostrar el resultado

#### Scenario: Botón deshabilitado durante el envío

- **WHEN** el formulario está enviándose
- **THEN** el `<button type="submit">` está deshabilitado (atributo `disabled`)
- **AND** tras la respuesta (éxito o error) vuelve a habilitarse

#### Scenario: Mensajes sin tokens prohibidos

- **WHEN** el bloque de estado muestra un mensaje de éxito o error
- **THEN** el contenido usa tokens de diseño del proyecto (sin literales hex)
- **AND** no contiene clases `rounded*` ni `shadow*`

### Requirement: CotizacionForm marks required fields visually and matches the DTO

El cotizacion-form SHALL indicar visualmente qué campos son obligatorios, de forma coherente con lo que exige el DTO del backend (`CotizacionCreateDto.required` = `nombre`, `email`, `nombre_empresa`, `mensaje`). Cada label de campo obligatorio SHALL llevar un asterisco `*` decorativo (`aria-hidden="true"`, token `text-accent`), el control SHALL conservar el atributo nativo `required`, y SHALL existir una nota visible que explique la convención del asterisco. Los campos opcionales en el DTO (`telefono`, `rut`) SHALL quedar sin `required` y sin asterisco, de modo que la validación del cliente no sea más estricta que la del backend. El honeypot `website` SHALL permanecer sin `required` ni asterisco.

#### Scenario: Asterisco en los campos obligatorios

- **WHEN** el CotizacionForm renderiza
- **THEN** los labels de `nombre`, `email`, `nombre_empresa` y `mensaje` contienen `<span aria-hidden="true">*</span>`
- **AND** sus controles mantienen el atributo `required`

#### Scenario: Los campos opcionales del DTO no se marcan

- **WHEN** el CotizacionForm renderiza
- **THEN** los inputs `telefono` y `rut` no tienen atributo `required`
- **AND** sus labels no llevan asterisco de obligatoriedad

#### Scenario: Nota de obligatoriedad

- **WHEN** el CotizacionForm renderiza
- **THEN** se muestra una nota indicando que los campos marcados con `*` son obligatorios

#### Scenario: El honeypot no se marca como obligatorio

- **WHEN** el CotizacionForm renderiza
- **THEN** el input `website` no tiene atributo `required`
- **AND** su label (oculto) no lleva asterisco de obligatoriedad

### Requirement: initFormSubmit binds a single submit handler per form node

`initFormSubmit` SHALL ser idempotente por nodo `<form>`: vincular el mismo elemento más de una vez SHALL registrar a lo sumo un listener de `submit`, de modo que un único envío dispare un único `fetch`. Las invocaciones repetidas sobre un nodo ya vinculado SHALL devolver un cleanup no-op (no desvinculan el handler registrado por la primera llamada); el cleanup devuelto por la primera llamada SHALL desvincular el handler y permitir volver a inicializar el form.

#### Scenario: Doble inicialización no duplica el envío

- **WHEN** `initFormSubmit` se invoca dos veces sobre el mismo `<form>` y luego se dispara un `submit`
- **THEN** queda registrado un único listener de `submit`
- **AND** el envío dispara un único `fetch` (un solo POST al backend)

#### Scenario: Las invocaciones repetidas devuelven un cleanup no-op

- **WHEN** `initFormSubmit` se invoca dos veces sobre el mismo `<form>` y se ejecuta el cleanup devuelto por la segunda invocación
- **THEN** el listener registrado por la primera invocación permanece activo

#### Scenario: El cleanup permite reinicializar el form

- **WHEN** se ejecuta el cleanup devuelto por la primera `initFormSubmit` y luego se vuelve a invocar `initFormSubmit` sobre el mismo form
- **THEN** el form queda vinculado de nuevo con un único listener de `submit`

### Requirement: The form submit fetch is cancelled after 20 seconds

El envío vía `fetch` del runtime de formularios SHALL cancelarse automáticamente a los 20 s (por defecto) si el backend no responde, usando una señal de timeout (`AbortSignal.timeout`). La cancelación SHALL seguir la rama de error existente: mensaje de error en el bloque de estado inline, botón de submit rehabilitado y formulario sin resetear.

#### Scenario: El timeout cancela el envío y muestra el error

- **WHEN** el `fetch` no responde dentro del plazo de cancelación (20 s por defecto)
- **THEN** la petición se cancela (no queda pendiente para el usuario)
- **AND** se muestra el mensaje de error en el bloque de estado inline
- **AND** el botón de submit vuelve a habilitarse
- **AND** el formulario NO se resetea (los campos permanecen intactos)
