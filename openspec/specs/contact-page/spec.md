# contact-page Specification

## Purpose
Página de contacto del sitio público: ContactHero con headline y palabra destacada, formulario con inputs etiquetados, checkboxes de áreas de interés, textarea y submit POST, y ContactBar con teléfono, email e iconos sociales.
## Requirements
### Requirement: ContactHero renders headline with highlighted word and subtitle
The contact-hero SHALL render a headline from the `headline` prop with the `highlightedWord` substring wrapped in a `<span class="text-primary">`, plus a `subtitle` rendered as a subordinate heading, following the same split logic as HeroBanner.

#### Scenario: Headline renders with highlighted span
- **WHEN** the ContactHero renders with `headline="Conecte con la Ingeniería de Precisión"` and `highlightedWord="Ingeniería de Precisión"`
- **THEN** the rendered HTML contains the full headline text
- **AND** the substring "Ingeniería de Precisión" is wrapped in a `<span class="text-primary">`

#### Scenario: Subtitle rendered
- **WHEN** the ContactHero renders with `subtitle` non-empty
- **THEN** a subtitle element is rendered containing the `subtitle` text

#### Scenario: Highlight absent when word not found
- **WHEN** the ContactHero renders with `highlightedWord` empty or not present in `headline`
- **THEN** no `<span class="text-primary">` is rendered
- **AND** the full `headline` is rendered as plain text

### Requirement: ContactForm renders the four text inputs with associated labels
The contact-form SHALL render text inputs for Nombre Completo, Empresa, Correo Electrónico and Teléfono, each with a visually associated `<label>` via `for`/`id` and `uppercase` label text.

#### Scenario: Inputs rendered with labels
- **WHEN** the ContactForm renders with default props
- **THEN** an `<input>` with `name="nombre"` is rendered
- **AND** an `<input>` with `name="empresa"` is rendered
- **AND** an `<input type="email">` with `name="email"` is rendered
- **AND** an `<input type="tel">` with `name="telefono"` is rendered
- **AND** each input has a `<label for>` pointing to its `id` with non-empty uppercase text

#### Scenario: Inputs carry placeholders
- **WHEN** the ContactForm renders with default config
- **THEN** the nombre input has `placeholder="Ej. Juan Pérez"` (or configured placeholder)
- **AND** the email input has an email-type placeholder
- **AND** the telefono input has a phone-type placeholder

### Requirement: ContactForm renders the areas-of-interest checkboxes grouped in a fieldset
The contact-form SHALL render the five areas of interest as checkboxes inside a single `<fieldset>` with a `<legend>` "Área de Interés", each checkbox having an associated `<label>`.

#### Scenario: Fieldset with legend and five checkboxes
- **WHEN** the ContactForm renders with `areas` containing five items
- **THEN** a `<fieldset>` element is rendered containing a `<legend>` with non-empty text
- **AND** exactly five `<input type="checkbox">` elements are rendered
- **AND** each checkbox has `name="areasDeInteres"` and a `<label>` associated via `for`/`id`
- **AND** the checkbox `value` attributes match the `id` of each area

#### Scenario: Areas come from the areas prop
- **WHEN** the ContactForm renders with `areas` containing `{ id: "medicion-fluidos", label: "Medición de Fluidos" }`
- **THEN** a checkbox with `value="medicion-fluidos"` is rendered
- **AND** its associated label text equals "Medición de Fluidos"

### Requirement: ContactForm renders the message textarea and submit button
The contact-form SHALL render a `<textarea>` for the message and a `<button type="submit">` labelled "ENVIAR MENSAJE" using the `bg-accent` token and a right-arrow icon.

#### Scenario: Textarea rendered
- **WHEN** the ContactForm renders with default props
- **THEN** a `<textarea name="mensaje">` is rendered with an associated `<label>` and a configured placeholder

#### Scenario: Submit button rendered with accent color
- **WHEN** the ContactForm renders with default config
- **THEN** a `<button type="submit">` is rendered inside the `<form>`
- **AND** its visible text contains "ENVIAR MENSAJE"
- **AND** the button carries a class containing `bg-accent`
- **AND** an arrow icon (decorative, `aria-hidden="true"`) is rendered inside the button

#### Scenario: Submit button spans the full form width, centered, with an elegant gap to the arrow
- **WHEN** the ContactForm renders with default config
- **THEN** the submit `<button>` carries a class containing `w-full`
- **AND** the button uses a centered flex layout (e.g. `justify-center`) so the text+icon group is centered in the button
- **AND** the button carries a `gap` utility (e.g. `gap-2`/`gap-3`) providing an elegant separation between the text and the arrow icon (icon not stuck to the text)
- **AND** the arrow icon (`lucide:arrow-right`, `aria-hidden="true"`) appears after the visible text in DOM order

### Requirement: ContactForm submits via POST to a configurable action

El contact-form SHALL render un `<form method="post">` cuyo atributo `action` sea una URL absoluta, resuelta en el frontmatter a partir de la acción de la config (default `/api/v1/contacts`) y de `PUBLIC_API_URL` (default `http://localhost:3000/api/v1`), de modo que el fallback nativo sin JavaScript haga POST al origen de la API y no al del sitio estático en producción. El envío con JavaScript no cambia: el submit SHALL seguir interceptado por el runtime de la página (`formSubmitClient`), la validación HTML5 nativa se mantiene y el payload (incluido el honeypot `website`) se envía como JSON vía `fetch`; el resultado se refleja en una notificación toast (capability `ui-toast`) en lugar del bloque de estado inline. En éxito el formulario se limpia; en error los campos permanecen intactos y se muestra un mensaje claro.

#### Scenario: Form method and action

- **WHEN** el ContactForm renderiza con la config por defecto y sin `PUBLIC_API_URL` definida
- **THEN** se renderiza un `<form>` con `method="post"`
- **AND** su atributo `action` es la URL absoluta por defecto `http://localhost:3000/api/v1/contacts`

#### Scenario: El action absoluto se deriva de PUBLIC_API_URL

- **WHEN** el ContactForm renderiza con `PUBLIC_API_URL=https://api.somosriff.cl/api/v1`
- **THEN** su atributo `action` es `https://api.somosriff.cl/api/v1/contacts`
- **AND** el sufijo `/api/v1` no aparece duplicado en la URL
- **AND** con `PUBLIC_API_URL=https://api.somosriff.cl` (sin el sufijo) el `action` resuelto es el mismo

#### Scenario: Action overridable via config

- **WHEN** el ContactForm renderiza con `config.action="https://api.riff.cl/api/v1/contacts"`
- **THEN** su atributo `action` es exactamente `https://api.riff.cl/api/v1/contacts`

#### Scenario: El fallback sin JavaScript hace POST al origen de la API

- **WHEN** el usuario envía el formulario con JavaScript deshabilitado
- **THEN** la petición nativa sale hacia el `action` absoluto (origen de la API), no hacia el origen del sitio estático

#### Scenario: Envío exitoso limpia el formulario y muestra confirmación

- **WHEN** el usuario envía el formulario y el `fetch` responde 2xx
- **THEN** se muestra un mensaje de confirmación en la notificación toast
- **AND** el formulario se resetea (campos vacíos)

#### Scenario: Envío fallido conserva los campos y muestra error

- **WHEN** el `fetch` responde 4xx/5xx o falla la red
- **THEN** se muestra un mensaje de error claro en la notificación toast
- **AND** los campos del formulario permanecen intactos (no se limpian)

#### Scenario: El fetch apunta a la URL base del backend, no al origen del sitio

- **WHEN** el formulario se envía vía `fetch`
- **THEN** la petición se hace a la URL resuelta desde `PUBLIC_API_URL` (default `http://localhost:3000/api/v1`) más la ruta del endpoint, sin duplicar `/api/v1`
- **AND** nunca se hace `fetch` a una ruta `/api/*` contra el origen del sitio estático (que no expone la API en producción)

#### Scenario: El `action` absoluto se respeta tal cual

- **WHEN** el `config.action` es una URL absoluta (ej. `https://api.riff.cl/api/v1/contacts`)
- **THEN** el `fetch` se hace exactamente a esa URL
- **AND** el `action` renderizado en el HTML es esa misma URL

#### Scenario: El handler se enlaza en navegación cliente (View Transitions)

- **WHEN** la página `/contacto` se alcanza por navegación cliente tras un evento `astro:page-load` (no por carga completa)
- **THEN** el submit listener queda enlazado al `#contact-form` que está en el DOM
- **AND** el envío es interceptado (no se produce una navegación nativa al `action`)

#### Scenario: El honeypot viaja en el payload

- **WHEN** el formulario se envía vía `fetch`
- **THEN** el payload JSON incluye el campo oculto `website` (habitualmente vacío)

### Requirement: ContactBar renders phone, email and social icons
The contact-bar SHALL render a clickable phone (`tel:`), a clickable email (`mailto:`) and social network icons, consuming the same contact source as TopHeader/Footer. The email displayed and linked SHALL be `contacto@somosriff.cl` (MODIFIED in `web-home-contact-tweaks`: was `contacto@riff.cl`).

#### Scenario: Phone and email clickable
- **WHEN** the ContactBar renders with `phone="+56 2 29079067"` and `email="contacto@somosriff.cl"`
- **THEN** an anchor with `href="tel:+56229079067"` is rendered
- **AND** an anchor with `href="mailto:contacto@somosriff.cl"` is rendered
- **AND** the email anchor's visible text equals `contacto@somosriff.cl`

#### Scenario: Social icons rendered when configured
- **WHEN** the ContactBar renders with social links present
- **THEN** a `<nav aria-label="Redes sociales">` (or equivalent) renders one anchor per configured social link
- **AND** each anchor carries `aria-label` and `rel="noopener noreferrer"` and `target="_blank"`

### Requirement: ContactForm and ContactBar use flat design tokens
The contact components SHALL NOT use `rounded*` or `shadow*` classes in their static state, and SHALL use the project design tokens (`text-primary`, `bg-accent`, `bg-bg`, `text-secondary`, etc.).

#### Scenario: No rounded or shadow classes
- **WHEN** the ContactForm or ContactBar renders
- **THEN** the rendered HTML contains no class containing `rounded`
- **AND** the rendered HTML contains no class containing `shadow`

#### Scenario: Accent button uses token
- **WHEN** the ContactForm renders the submit button
- **THEN** the button carries `bg-accent` (no literal hex color)

### Requirement: ContactForm is keyboard accessible with native semantics
The contact-form SHALL be operable with the keyboard using native HTML form semantics: Tab cycles through controls, Enter submits from inputs, and each control has an associated label.

#### Scenario: Labels programmatically associated
- **WHEN** the ContactForm renders
- **THEN** every `<input>` and the `<textarea>` has an associated `<label>` via `for`/`id`
- **AND** every checkbox has an associated `<label>` via `for`/`id`

#### Scenario: Submit button relies on visible text
- **WHEN** the ContactForm renders the submit button
- **THEN** the button's accessible name is its visible text (no extra `aria-label` required)

### Requirement: Contact page composes the three components
The `/contacto` page SHALL render `ContactHero`, `ContactForm` and `ContactBar` inside `Layout` with `hero={false}` and `showSearch={false}`, wrapped in a solid blue (`bg-secondary`) background, with `Layout.astro` modified only to support the `showSearch` prop.

#### Scenario: Page renders all three components
- **WHEN** `apps/web/src/pages/contacto.astro` is built
- **THEN** the rendered HTML contains the contact hero headline
- **AND** the rendered HTML contains the contact form (`<form method="post">`)
- **AND** the rendered HTML contains the contact bar with the phone anchor
- **AND** the page content is wrapped in a solid blue background (`bg-primary-deep`, token `#006874`)

#### Scenario: Page hides the hero image and the global search form
- **WHEN** `contacto.astro` is rendered
- **THEN** the page passes `hero={false}` to `Layout` so NO `banner_home.webp` background image is rendered
- **AND** the page passes `showSearch={false}` to `Layout` so the global `SearchForm` (`role="search"`) is NOT rendered on this page

#### Scenario: Contact form is presented inside a full-width white box on the blue background
- **WHEN** the ContactForm renders on the contact page
- **THEN** the `<form>` carries a class containing `bg-white`
- **AND** the `<form>` does NOT carry `max-w-3xl` (it spans the full content width of the page container, the same width and side margins as the site header)
- **AND** the form is wrapped in `container mx-auto px-4 sm:px-6 lg:px-8` (not full-bleed beyond the container)

### Requirement: Contact page renders a solid blue background without a hero image
The `/contacto` page SHALL render with a solid blue background behind the contact content and SHALL NOT render the `banner_home.webp` hero image (the page passes `hero={false}` to `Layout`).

#### Scenario: Solid blue background present, no banner image
- **WHEN** `contacto.astro` is rendered
- **THEN** the page content wrapper carries a class containing `bg-primary-deep` (solid `#006874`, the deep-teal token)
- **AND** the rendered HTML does NOT contain the `banner_home.webp` image reference

### Requirement: Contact page hides the global search form
The `/contacto` page SHALL NOT render the global `SearchForm` (the `role="search"` landmark managed by `Layout.astro`); it passes `showSearch={false}` to Layout.

#### Scenario: Global search form absent on the contact page
- **WHEN** `contacto.astro` is rendered
- **THEN** the rendered HTML does NOT contain an element with `role="search"`
- **AND** the rendered HTML does NOT contain the search submit button text "BUSCAR"

### Requirement: Contact bar sits below the form, aligned to the page content width, on the same background
The `ContactBar` SHALL render below the `ContactForm` (after it in DOM order) on the contact page, using the same blue background as the page (`bg-primary-deep` / `#006874`) — NOT a distinct dark footer strip — and SHALL align to the full content width of the page using the same `container mx-auto px-4 sm:px-6 lg:px-8` as the site header and the form (NOT a narrower `max-w-3xl` strip).

#### Scenario: Contact bar rendered below the form on the same background
- **WHEN** `contacto.astro` is rendered
- **THEN** the `ContactBar` markup appears after the `ContactForm` (`<form>`) in DOM order
- **AND** the contact bar does NOT carry a `bg-secondary-dark` (distinct dark footer) class
- **AND** the contact bar is NOT constrained to `max-w-3xl` (it uses `container mx-auto` aligned to the full page content width)

### Requirement: Contact page rhythm — small hero↔form gap and a primary divider above the contact bar
The `/contacto` page SHALL separate the hero (headline + subtitle) from the form by a small gap (~16px on mobile, ~32px on desktop) rather than the components' own large vertical paddings, and SHALL render a 1px divider in the primary color (`#41B3C4`) above the contact bar (phone/email/socials) that spans the full width of the form and carries equivalent padding above and below to separate the two content blocks.

#### Scenario: Small gap between hero and form
- **WHEN** `contacto.astro` is rendered
- **THEN** a spacer element with classes `h-4 sm:h-8` (16px mobile / 32px desktop) is rendered between the hero (`<h1>`) and the `<form>`
- **AND** the `ContactHero` section carries `pb-0` (no large bottom padding)
- **AND** the `ContactForm` wrapper does NOT carry a large top padding (no `pt-12`/`pt-16`)

#### Scenario: Primary divider above the contact bar, full width, equivalent padding
- **WHEN** the `ContactBar` renders
- **THEN** the first child of its content container is a divider element carrying `border-t` and `border-primary` (1px line in `--color-primary` = `#41B3C4`)
- **AND** the divider carries equivalent vertical padding such as `my-4 sm:my-8` (16/32px above and below)
- **AND** the divider appears in DOM order before the phone/email/social anchors (separating the upper block from the lower block)

### Requirement: Contact bar aligns phone/email to the left and social icons to the right
The `ContactBar` content SHALL lay out as a horizontal row on `sm+` screens using `justify-between`: a left group containing the phone and email anchors pinned to the left edge of the container, and the social `<nav>` pinned to the right edge. On mobile the items SHALL stack left-aligned. The phone and email SHALL be wrapped in a single left group element and the social nav SHALL be a sibling after it.

#### Scenario: Phone/email grouped on the left, social icons on the right
- **WHEN** the `ContactBar` renders with social links configured
- **THEN** the content container carries `sm:justify-between` (and NOT `justify-center`)
- **AND** the phone anchor and the email anchor are wrapped in the same left-group element (a single ancestor before the social nav)
- **AND** the social `<nav aria-label="Redes sociales">` is a sibling that appears after the phone/email left group (right side)

### Requirement: ContactForm renders a honeypot anti-spam field

El contact-form SHALL render un campo honeypot `website` invisible para humanos (oculto vía CSS, `tabindex="-1"`, `autocomplete="off"`, `aria-hidden="true"`, sin label visible) con el fin de detectar envíos automatizados en el backend.

#### Scenario: Campo oculto presente

- **WHEN** el ContactForm renderiza con props por defecto
- **THEN** se renderiza un `<input name="website">` con clases de ocultamiento (no `display:none` sobre un contenedor visible) y `tabindex="-1"`
- **AND** el campo no tiene `<label>` visible asociado
- **AND** el campo tiene `autocomplete="off"` y `aria-hidden="true"`

### Requirement: ContactForm renders the submit result as a toast notification

El contact-form SHALL mostrar el resultado del envío en una notificación toast no bloqueante (capability `ui-toast`) en lugar del bloque de estado inline: el bloque inline `<p role="status">` SHALL eliminarse del DOM (no convive con el toast) y el formulario SHALL renderizar el toast oculto, listo para recibir el resultado. La notificación SHALL ser accesible para lectores de pantalla (semántica ARIA por variante) y SHALL usar los tokens de diseño existentes (sin `rounded*` ni `shadow*`). Mientras el envío está en curso, el botón de submit SHALL estar deshabilitado para evitar dobles envíos.

#### Scenario: Bloque de estado presente

- **WHEN** el ContactForm renderiza
- **THEN** dentro del `<form>` NO existe el bloque inline con `role="status"` y `aria-live="polite"` (eliminado, no convive con el toast)
- **AND** el formulario renderiza el toast (elemento raíz oculto, `hidden`) listo para recibir el resultado

#### Scenario: Botón deshabilitado durante el envío

- **WHEN** el formulario está enviándose
- **THEN** el `<button type="submit">` está deshabilitado (atributo `disabled`)
- **AND** tras la respuesta (éxito o error) vuelve a habilitarse

#### Scenario: Mensajes sin tokens prohibidos

- **WHEN** el bloque de estado muestra un mensaje de éxito o error
- **THEN** el contenido usa tokens de diseño del proyecto (sin literales hex)
- **AND** no contiene clases `rounded*` ni `shadow*`

### Requirement: ContactForm marks required fields visually

El contact-form SHALL indicar visualmente qué campos son obligatorios, de forma coherente con lo que exige el DTO del backend (`ContactCreateDto.required` = `nombre`, `empresa`, `email`, `telefono`, `mensaje`). Cada label de campo obligatorio SHALL llevar un asterisco `*` decorativo (`aria-hidden="true"`, token `text-accent`), el control SHALL conservar el atributo nativo `required`, y SHALL existir una nota visible que explique la convención del asterisco. El honeypot `website` SHALL permanecer sin `required` ni asterisco.

#### Scenario: Asterisco en los campos obligatorios

- **WHEN** el ContactForm renderiza
- **THEN** los labels de `nombre`, `empresa`, `email`, `telefono` y `mensaje` contienen `<span aria-hidden="true">*</span>`
- **AND** sus controles mantienen el atributo `required`

#### Scenario: Nota de obligatoriedad

- **WHEN** el ContactForm renderiza
- **THEN** se muestra una nota indicando que los campos marcados con `*` son obligatorios

#### Scenario: El honeypot no se marca como obligatorio

- **WHEN** el ContactForm renderiza
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

El envío vía `fetch` del runtime de formularios SHALL cancelarse automáticamente a los 20 s (por defecto) si el backend no responde, usando una señal de timeout (`AbortSignal.timeout`). La cancelación SHALL seguir la rama de error existente: mensaje de error en la notificación toast, botón de submit rehabilitado y formulario sin resetear.

#### Scenario: El timeout cancela el envío y muestra el error

- **WHEN** el `fetch` no responde dentro del plazo de cancelación (20 s por defecto)
- **THEN** la petición se cancela (no queda pendiente para el usuario)
- **AND** se muestra el mensaje de error en la notificación toast
- **AND** el botón de submit vuelve a habilitarse
- **AND** el formulario NO se resetea (los campos permanecen intactos)

