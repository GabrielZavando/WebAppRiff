# cotizacion-page Specification (delta)

## MODIFIED Requirements

### Requirement: CotizacionForm submits via POST to /api/v1/quotes

El cotizacion-form SHALL render un `<form method="post">` con `action` fijado a `/api/v1/quotes`, consumido por el endpoint backend existente. El submit SHALL ser interceptado por el runtime de la página (`formSubmitClient`): la validación HTML5 nativa se mantiene, el payload (incluido el honeypot `website`) se envía como JSON vía `fetch` y el resultado se refleja en un bloque de estado inline accesible (`role="status"`, `aria-live="polite"`). En éxito el formulario se limpia; en error los campos permanecen intactos y se muestra un mensaje claro.

#### Scenario: Form method and action

- **WHEN** el CotizacionForm renderiza con la config por defecto
- **THEN** se renderiza un `<form>` con `method="post"`
- **AND** su atributo `action` es `/api/v1/quotes`

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

## ADDED Requirements

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