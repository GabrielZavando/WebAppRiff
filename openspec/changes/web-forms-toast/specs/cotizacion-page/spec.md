# cotizacion-page Specification (delta)

## MODIFIED Requirements

### Requirement: CotizacionForm renders the submit result as a toast notification

El cotizacion-form SHALL mostrar el resultado del envío en una notificación toast no bloqueante (capability `ui-toast`) en lugar del bloque de estado inline: el bloque inline `<p role="status">` SHALL eliminarse del DOM (no convive con el toast) y el formulario SHALL renderizar el toast oculto, listo para recibir el resultado. La notificación SHALL ser accesible para lectores de pantalla (semántica ARIA por variante) y SHALL usar los tokens de diseño existentes (sin `rounded*` ni `shadow*`). Mientras el envío está en curso, el botón de submit SHALL estar deshabilitado para evitar dobles envíos.

#### Scenario: Bloque de estado presente

- **WHEN** el CotizacionForm renderiza
- **THEN** dentro del `<form>` NO existe el bloque inline con `role="status"` y `aria-live="polite"` (eliminado, no convive con el toast)
- **AND** el formulario renderiza el toast (elemento raíz oculto, `hidden`) listo para recibir el resultado

#### Scenario: Botón deshabilitado durante el envío

- **WHEN** el formulario está enviándose
- **THEN** el `<button type="submit">` está deshabilitado (atributo `disabled`)
- **AND** tras la respuesta (éxito o error) vuelve a habilitarse

#### Scenario: Mensajes sin tokens prohibidos

- **WHEN** el toast muestra un mensaje de éxito o error
- **THEN** el contenido usa tokens de diseño del proyecto (sin literales hex)
- **AND** no contiene clases `rounded*` ni `shadow*`

### Requirement: CotizacionForm submits via POST to /api/v1/quotes

El cotizacion-form SHALL render un `<form method="post">` cuyo atributo `action` sea una URL absoluta, resuelta en el frontmatter a partir de la acción de la config (default `/api/v1/quotes`) y de `PUBLIC_API_URL` (default `http://localhost:3000/api/v1`), de modo que el fallback nativo sin JavaScript haga POST al origen de la API y no al del sitio estático en producción. El envío con JavaScript no cambia: el submit SHALL seguir interceptado por el runtime de la página (`formSubmitClient`), la validación HTML5 nativa se mantiene y el payload (incluido el honeypot `website`) se envía como JSON vía `fetch`; el resultado se refleja en una notificación toast (capability `ui-toast`) en lugar del bloque de estado inline. En éxito el formulario se limpia; en error los campos permanecen intactos y se muestra un mensaje claro.

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
- **THEN** se muestra un mensaje de confirmación en la notificación toast
- **AND** el formulario se resetea (campos vacíos)

#### Scenario: Envío fallido conserva los campos y muestra error

- **WHEN** el `fetch` responde 4xx/5xx o falla la red
- **THEN** se muestra un mensaje de error claro en la notificación toast
- **AND** los campos del formulario permanecen intactos (no se limpian)

#### Scenario: El fetch apunta a la URL base del backend, no al origen del sitio

- **WHEN** el formulario se envía vía `fetch` y el `action` es `/api/v1/quotes`
- **THEN** la petición se hace a la URL base de la API resuelta desde `PUBLIC_API_URL` (default `http://localhost:3000/api/v1`) más `/quotes`
- **AND** nunca se hace `fetch` a `/api/v1/quotes` contra el origen del sitio estático (que no expone la API en producción)

#### Scenario: El handler se enlaza en navegación cliente (View Transitions)

- **WHEN** la página `/cotizacion` se alcanza por navegación cliente tras un evento `astro:page-load` (no por carga completa)
- **THEN** el submit listener queda enlazado al `#cotizacion-form` que está en el DOM
- **AND** el envío es interceptado (no se produce una navegación nativa al `action`)

### Requirement: The form submit fetch is cancelled after 20 seconds

El envío vía `fetch` del runtime de formularios SHALL cancelarse automáticamente a los 20 s (por defecto) si el backend no responde, usando una señal de timeout (`AbortSignal.timeout`). La cancelación SHALL seguir la rama de error existente: mensaje de error en la notificación toast, botón de submit rehabilitado y formulario sin resetear.

#### Scenario: El timeout cancela el envío y muestra el error

- **WHEN** el `fetch` no responde dentro del plazo de cancelación (20 s por defecto)
- **THEN** la petición se cancela (no queda pendiente para el usuario)
- **AND** se muestra el mensaje de error en la notificación toast
- **AND** el botón de submit vuelve a habilitarse
- **AND** el formulario NO se resetea (los campos permanecen intactos)

## RENAMED Requirements

- FROM: ### Requirement: CotizacionForm shows inline submit status
- TO: ### Requirement: CotizacionForm renders the submit result as a toast notification
