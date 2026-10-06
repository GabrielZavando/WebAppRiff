# cotizacion-page Specification (delta)

## MODIFIED Requirements

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

- **WHEN** el formulario se envía vía `fetch`
- **THEN** la petición se hace a la URL resuelta desde `PUBLIC_API_URL` (default `http://localhost:3000/api/v1`) más el endpoint del formulario, sin duplicar `/api/v1`
- **AND** nunca se hace `fetch` a `/api/v1/quotes` contra el origen del sitio estático (que no expone la API en producción)

#### Scenario: El handler se enlaza en navegación cliente (View Transitions)

- **WHEN** la página `/cotizacion` se alcanza por navegación cliente tras un evento `astro:page-load` (no por carga completa)
- **THEN** el submit listener queda enlazado al `#cotizacion-form` que está en el DOM
- **AND** el envío es interceptado (no se produce una navegación nativa al `action`)

### Requirement: Cotizacion page composes the three components in a two-column layout

The `/cotizacion` page SHALL render CotizacionForm, CotizacionProcess, and CotizacionSupport inside Layout with a two-column grid layout on desktop (form left, sidebar right) and stacked layout on mobile.

#### Scenario: Page renders all three components

- **WHEN** `apps/web/src/pages/cotizacion.astro` is built
- **THEN** the rendered HTML contains the cotizacion form (`<form method="post">` con `action` absoluto hacia `POST /api/v1/quotes`, p. ej. `action="http://localhost:3000/api/v1/quotes"` sin `PUBLIC_API_URL` definida)
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

## ADDED Requirements

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
