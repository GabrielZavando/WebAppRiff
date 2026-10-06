# email-notifications Specification

## Purpose
Port `IEmailNotifier` para el envío de notificaciones por correo (formularios de contacto y cotización): contrato del mensaje, adaptador HTTP con Resend, no-op en dev/test, comportamiento de fallo y configuración por entorno.

## ADDED Requirements

### Requirement: IEmailNotifier envía mensajes de correo con destino y remitente configurados

El sistema SHALL exponer el port `IEmailNotifier` con un único método `sendEmail(message: EmailMessage): Promise<void>`, donde `EmailMessage` SHALL contener `from`, `to` (array), `subject` y `text`. El destinatario SHALL resolverse de la variable `CONTACT_TO_EMAIL` y el remitente de `CONTACT_FROM_EMAIL`; si `CONTACT_TO_EMAIL` no está definida, el default SHALL ser `contacto@somosriff.cl`.

#### Scenario: Destino por defecto

- **WHEN** no está definida `CONTACT_TO_EMAIL` y se construye la notificación de una solicitud
- **THEN** el destinatario es `contacto@somosriff.cl`

#### Scenario: El texto incluye todos los campos del formulario

- **WHEN** se notifica una solicitud de contacto con nombre, email, teléfono, empresa, áreas de interés y mensaje
- **THEN** el `text` del correo incluye todos esos campos con su etiqueta legible
- **AND** cuando se notifica una cotización, el `text` incluye además `nombre_empresa`, `rut` y `mensaje`

### Requirement: El adaptador Resend llama a la API por HTTP y lanza ante fallo

El adaptador concreto del port (en producción) SHALL enviar el correo vía la API HTTP de Resend usando `fetch` nativo con timeout acotado. SHALL lanzar cuando el proveedor responde no-2xx o la red falla, para que el endpoint pueda reflejar el fallo al usuario. La API key SHALL leerse de `RESEND_API_KEY` y SHALL nunca aparecer en logs ni en mensajes de error.

#### Scenario: Éxito del proveedor

- **WHEN** Resend responde 2xx
- **THEN** `sendEmail` resuelve sin error

#### Scenario: Error del proveedor

- **WHEN** Resend responde no-2xx o la red falla
- **THEN** `sendEmail` lanza una excepción
- **AND** el mensaje de error no contiene la API key

#### Scenario: Timeout acotado

- **WHEN** la llamada a Resend supera el timeout configurado (10 s)
- **THEN** `sendEmail` lanza en lugar de colgar el endpoint

### Requirement: Sin RESEND_API_KEY el adaptador es no-op con log

Cuando `RESEND_API_KEY` está vacía (dev/local sin configuración), el adaptador SHALL NO realizar ninguna llamada HTTP y SHALL loguear un warning. Esto garantiza que el entorno local y los despliegues sin credenciales funcionen sin fallar.

#### Scenario: No-op sin clave

- **WHEN** `RESEND_API_KEY` está vacía y se invoca `sendEmail`
- **THEN** no se realiza ninguna llamada HTTP
- **AND** se emite un log de warning indicando que el envío está desactivado

### Requirement: Tests y CI nunca disparan correos reales

El sistema SHALL permitir inyectar un fake del port `IEmailNotifier` en tests (DI con token, patrón del proyecto) que capture los envíos sin realizar llamadas de red. CI SHALL ejecutarse sin `RESEND_API_KEY`, por lo que nunca se envía un correo real durante la verificación.

#### Scenario: Tests inyectan fake

- **WHEN** un test provee un fake de `IEmailNotifier` vía el token `I_EMAIL_NOTIFIER`
- **THEN** los envíos se capturan en memoria y se pueden asertar
- **AND** no se realiza ninguna llamada real a Resend

#### Scenario: No-op explícito disponible

- **WHEN** un test o entorno necesita un no-op determinista
- **THEN** existe un `NoopEmailNotifier` inyectable que no envía y no loguea