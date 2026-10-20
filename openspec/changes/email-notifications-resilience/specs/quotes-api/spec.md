## MODIFIED Requirements

### Requirement: POST /api/v1/quotes notifies contacto@somosriff.cl by email

Tras persistir la cotización en Firestore, el sistema SHALL enviar un correo con todos los campos de la solicitud (nombre, email, telefono, nombre_empresa, rut, mensaje) a `CONTACT_TO_EMAIL` (default `contacto@somosriff.cl`) a través del port `IEmailNotifier`. El envío SHALL ser awaitado, pero su fallo NO SHALL propagarse al cliente: si la notificación lanza, el sistema SHALL registrar el error con `Logger.error` y SHALL responder HTTP 201 con la cotización ya persistida, para que el usuario reciba confirmación y pueda confiar en que su solicitud quedó registrada. La notificación no reemplaza la persistencia ni altera el DTO existente, y el error registrado no SHALL exponer la API key ni secretos.

#### Scenario: Notificación tras persistir

- **WHEN** un POST sin autenticar a `/api/v1/quotes` es válido y `IEmailNotifier.sendEmail` resuelve
- **THEN** el sistema responde HTTP 201 con la cotización persistida (envelope)
- **AND** se envía un correo a `contacto@somosriff.cl` cuyo texto incluye nombre, email, telefono, nombre_empresa, rut y mensaje

#### Scenario: Fallo de notificación

- **WHEN** un POST válido a `/api/v1/quotes` persiste la cotización pero `IEmailNotifier.sendEmail` lanza
- **THEN** el sistema registra el fallo con `Logger.error`
- **AND** responde HTTP 201 con la cotización persistida en el envelope
- **AND** la cotización permanece persistida en la colección `cotizaciones`
- **AND** el error registrado no expone la API key ni secretos
