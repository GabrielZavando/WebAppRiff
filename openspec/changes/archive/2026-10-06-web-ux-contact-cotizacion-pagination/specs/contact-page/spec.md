# contact-page Specification (delta)

## MODIFIED Requirements

### Requirement: ContactForm submits via POST to a configurable action

El contact-form SHALL render un `<form method="post">` con `action` tomado de la config (default `/api/v1/contacts`), consumido por el endpoint backend existente. El submit SHALL ser interceptado por el runtime de la página (`formSubmitClient`): la validación HTML5 nativa se mantiene, el payload (incluido el honeypot `website`) se envía como JSON vía `fetch` y el resultado se refleja en un bloque de estado inline accesible (`role="status"`, `aria-live="polite"`). En éxito el formulario se limpia; en error los campos permanecen intactos y se muestra un mensaje claro.

#### Scenario: Form method and action

- **WHEN** el ContactForm renderiza con la config por defecto
- **THEN** se renderiza un `<form>` con `method="post"`
- **AND** su atributo `action` es igual a la acción configurada (default `/api/v1/contacts`)

#### Scenario: Action overridable via config

- **WHEN** el ContactForm renderiza con `config.action="/api/v1/contacts"`
- **THEN** el `action` del `<form>` es `/api/v1/contacts`

#### Scenario: Envío exitoso limpia el formulario y muestra confirmación

- **WHEN** el usuario envía el formulario y el `fetch` responde 2xx
- **THEN** se muestra un mensaje de confirmación en el bloque de estado inline
- **AND** el formulario se resetea (campos vacíos)

#### Scenario: Envío fallido conserva los campos y muestra error

- **WHEN** el `fetch` responde 4xx/5xx o falla la red
- **THEN** se muestra un mensaje de error claro en el bloque de estado inline
- **AND** los campos del formulario permanecen intactos (no se limpian)

#### Scenario: El fetch apunta a la URL base del backend, no al origen del sitio

- **WHEN** el formulario se envía vía `fetch` y el `action` es una ruta relativa (ej. `/api/v1/contacts`)
- **THEN** la petición se hace a la URL base de la API resuelta desde `PUBLIC_API_URL` (default `http://localhost:3000/api/v1`) más la ruta del `action` sin duplicar `/api/v1`
- **AND** nunca se hace `fetch` a una ruta `/api/*` contra el origen del sitio estático (que no expone la API en producción)

#### Scenario: El `action` absoluto se respeta tal cual

- **WHEN** el `config.action` es una URL absoluta (ej. `https://api.riff.cl/api/v1/contacts`)
- **THEN** el `fetch` se hace exactamente a esa URL

#### Scenario: El handler se enlaza en navegación cliente (View Transitions)

- **WHEN** la página `/contacto` se alcanza por navegación cliente tras un evento `astro:page-load` (no por carga completa)
- **THEN** el submit listener queda enlazado al `#contact-form` que está en el DOM
- **AND** el envío es interceptado (no se produce una navegación nativa al `action`)

#### Scenario: El honeypot viaja en el payload

- **WHEN** el formulario se envía vía `fetch`
- **THEN** el payload JSON incluye el campo oculto `website` (habitualmente vacío)

## ADDED Requirements

### Requirement: ContactForm renders a honeypot anti-spam field

El contact-form SHALL render un campo honeypot `website` invisible para humanos (oculto vía CSS, `tabindex="-1"`, `autocomplete="off"`, `aria-hidden="true"`, sin label visible) con el fin de detectar envíos automatizados en el backend.

#### Scenario: Campo oculto presente

- **WHEN** el ContactForm renderiza con props por defecto
- **THEN** se renderiza un `<input name="website">` con clases de ocultamiento (no `display:none` sobre un contenedor visible) y `tabindex="-1"`
- **AND** el campo no tiene `<label>` visible asociado
- **AND** el campo tiene `autocomplete="off"` y `aria-hidden="true"`

### Requirement: ContactForm shows inline submit status

El contact-form SHALL mostrar el resultado del envío en un bloque de estado inline dentro del formulario, accesible para lectores de pantalla (`role="status"`, `aria-live="polite"`) y con los tokens de diseño existentes (sin `rounded*` ni `shadow*`). Mientras el envío está en curso, el botón de submit SHALL estar deshabilitado para evitar dobles envíos.

#### Scenario: Bloque de estado presente

- **WHEN** el ContactForm renderiza
- **THEN** dentro del `<form>` hay un elemento con `role="status"` y `aria-live="polite"` listo para mostrar el resultado

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