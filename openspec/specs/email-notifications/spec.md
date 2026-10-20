# email-notifications Specification

## Purpose
Port `IEmailNotifier` para el envío de notificaciones por correo (formularios de contacto y cotización): contrato del mensaje, adaptador HTTP con Resend, no-op en dev/test, comportamiento de fallo y configuración por entorno.

## Requirements

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

### Requirement: EmailMessage admite un cuerpo HTML opcional

El contrato `EmailMessage` SHALL incluir un campo opcional `html` de tipo `string`
además del campo obligatorio `text`. Cuando `html` está presente, el adaptador SHALL
enviarlo a Resend junto con `text`, de modo que los clientes sin soporte HTML usen el
texto plano como fallback. Cuando `html` está ausente, el payload SHALL seguir siendo
compatible con el comportamiento actual (solo `text`).

#### Scenario: Mensaje con HTML envía ambos cuerpos

- **WHEN** `sendEmail` recibe un `EmailMessage` con `html` no vacío
- **THEN** el payload HTTP a Resend incluye `text` y `html` con los valores del mensaje

#### Scenario: Mensaje sin HTML se mantiene retrocompatible

- **WHEN** `sendEmail` recibe un `EmailMessage` sin `html`
- **THEN** el payload HTTP a Resend incluye `text` y no incluye el campo `html`

### Requirement: Plantilla HTML de notificación de leads

El sistema SHALL proveer una plantilla HTML compartida para las notificaciones de
contacto y cotización, construida con estilos inline y layout de tabla para compatibilidad
con clientes de correo. La plantilla SHALL usar los colores de marca de Riff (teal
`#41B3C4` y navy `#1F2D40`) y SHALL renderizar cada campo del formulario como una fila
etiqueta/valor. Los valores provenientes del formulario SHALL escaparse antes de
insertarse en el HTML para evitar inyección de markup.

#### Scenario: Notificación de contacto renderiza los campos

- **WHEN** se construye la notificación HTML de un contacto con nombre, empresa, email,
  teléfono, áreas de interés y mensaje
- **THEN** el HTML contiene una fila con la etiqueta y el valor de cada campo
- **AND** el HTML contiene los colores de marca teal y navy

#### Scenario: Notificación de cotización renderiza los campos

- **WHEN** se construye la notificación HTML de una cotización con nombre, email,
  teléfono, empresa, RUT y mensaje
- **THEN** el HTML contiene una fila con la etiqueta y el valor de cada campo

#### Scenario: Los valores se escapan

- **WHEN** un campo del formulario contiene caracteres HTML como `<script>` o `&`
- **THEN** el HTML generado contiene esos caracteres escapados y no markup ejecutable

### Requirement: Configuración de Resend documentada para el despliegue

El runbook de Cloud Run SHALL documentar cómo inyectar `RESEND_API_KEY` como secreto
(Secret Manager) y SHALL documentar el cambio del remitente a
`notificaciones@send.somosriff.cl` mediante `CONTACT_FROM_EMAIL` una vez verificado el
subdominio `send.somosriff.cl` en Resend. El `.env.example` SHALL reflejar las variables
`RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` con sus valores de ejemplo.

#### Scenario: Runbook documenta la API key y el remitente

- **WHEN** se inspecciona `docs/runbooks/backend-staging-cloud-run.md`
- **THEN** contiene los pasos para crear/adjuntar el secreto `RESEND_API_KEY` a Cloud Run
- **AND** documenta que el remitente verificado debe ser un buzón del subdominio
  `send.somosriff.cl` configurado en `CONTACT_FROM_EMAIL`

#### Scenario: .env.example refleja las variables

- **WHEN** se inspecciona `apps/backend/.env.example`
- **THEN** incluye `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL`
- **AND** documenta el remitente de ejemplo `notificaciones@send.somosriff.cl`
