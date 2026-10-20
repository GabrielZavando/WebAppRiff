## ADDED Requirements

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
