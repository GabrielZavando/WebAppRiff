# quotes-api Specification (delta)

## ADDED Requirements

### Requirement: POST /api/v1/quotes notifies contacto@somosriff.cl by email

Tras persistir la cotización en Firestore, el sistema SHALL enviar un correo con todos los campos de la solicitud (nombre, email, telefono, nombre_empresa, rut, mensaje) a `CONTACT_TO_EMAIL` (default `contacto@somosriff.cl`) a través del port `IEmailNotifier`. El envío SHALL ser awaitado: si falla, el endpoint SHALL responder HTTP 502 con envelope de error (la cotización ya quedó persistida y el usuario puede reintentar). La notificación no reemplaza la persistencia ni altera el DTO existente.

#### Scenario: Notificación tras persistir

- **WHEN** un POST sin autenticar a `/api/v1/quotes` es válido y `IEmailNotifier.sendEmail` resuelve
- **THEN** el sistema responde HTTP 201 con la cotización persistida (envelope)
- **AND** se envía un correo a `contacto@somosriff.cl` cuyo texto incluye nombre, email, telefono, nombre_empresa, rut y mensaje

#### Scenario: Fallo de notificación

- **WHEN** un POST válido a `/api/v1/quotes` persiste la cotización pero `IEmailNotifier.sendEmail` lanza
- **THEN** el sistema responde HTTP 502 con envelope de error
- **AND** la cotización ya quedó persistida en la colección `cotizaciones`

### Requirement: Honeypot anti-spam en POST /api/v1/quotes

El sistema SHALL tratar el campo `website` como honeypot en `POST /api/v1/quotes`: si viene con valor no vacío, el endpoint SHALL responder éxito simulado (201) **sin persistir ni enviar correo**, para no confirmar al bot. Si viene vacío o ausente, el flujo continúa con normalidad. El campo SHALL estar declarado en el DTO (requisito de `forbidNonWhitelisted`) con `@IsOptional()`, de modo que el payload sin el campo no falle la validación.

#### Scenario: Honeypot relleno se ignora silenciosamente

- **WHEN** un POST a `/api/v1/quotes` incluye `website: "http://spam.example"`
- **THEN** el sistema responde HTTP 201 con éxito simulado
- **AND** no se persiste ninguna cotización
- **AND** no se envía ningún correo

#### Scenario: Honeypot vacío no bloquea

- **WHEN** un POST a `/api/v1/quotes` incluye `website: ""` o no lo incluye
- **THEN** el endpoint persiste la cotización y notifica con normalidad

#### Scenario: Formulario previo sin el campo website (retrocompatibilidad)

- **WHEN** un frontend desplegado antes de este change envía `POST /api/v1/quotes` sin el campo `website` (payload solo con los campos originales del DTO)
- **THEN** el sistema responde HTTP 201 sin errores de validación (el campo es opcional)
- **AND** persiste la cotización y notifica con normalidad