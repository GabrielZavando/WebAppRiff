## Why

El envío de notificaciones por correo es síncrono y bloqueante: si Resend falla, el
usuario recibe un error aunque la cotización ya quedó persistida, y en contacto el
mensaje se pierde porque no hay persistencia previa. Además, el adaptador actual solo
envía texto plano, lo que da una presentación pobre a los leads.

Necesitamos que el correo sea una notificación *best-effort*: el lead se conserva
siempre y el usuario recibe una respuesta de éxito, mientras los fallos de entrega
quedan registrados para diagnóstico.

## What Changes

- **Contactos:** persistir cada contacto en Firestore (`contactos`) antes de notificar.
  El correo pasa a ser best-effort: si Resend falla, se loguea con `Logger.error` y el
  endpoint responde éxito con el contacto guardado.
- **Cotizaciones:** capturar el fallo del notificador, loguearlo con `Logger.error` y
  responder `201` con la cotización ya persistida (hoy responde `502`).
- Extender `EmailMessage` con un campo opcional `html`.
- Adaptador Resend: enviar `html` cuando esté presente, manteniendo `text` como
  fallback (compatibilidad con clientes de correo sin HTML).
- Crear una plantilla HTML profesional y simple para las notificaciones, usando los
  colores de marca de Riff (teal `#41B3C4` / navy `#1F2D40`).
- Documentar en el runbook de Cloud Run cómo inyectar `RESEND_API_KEY` como secreto y
  cómo cambiar el remitente a `notificaciones@send.somosriff.cl` una vez verificado el
  subdominio en Resend.
- **BREAKING (contrato observable):** `POST /api/v1/contacts` y `POST /api/v1/quotes`
  dejan de devolver `502` cuando falla el correo. Pasan a devolver `201` con el lead
  persistido. No cambian rutas, DTOs ni códigos de validación.

## Capabilities

### New Capabilities

Ninguna. La persistencia de contactos se incorpora como comportamiento del endpoint
existente `contacts-api`, no como una capability nueva.

### Modified Capabilities

- `email-notifications`: `EmailMessage` admite `html` opcional; el adaptador envía HTML
  cuando está presente. Se mantiene la semántica del port (lanza ante fallo) y se
  documenta la configuración de remitente/subdominio.
- `contacts-api`: el endpoint persiste el contacto en Firestore antes de notificar y,
  ante fallo del correo, responde `201` en lugar de `502`.
- `quotes-api`: ante fallo del correo, responde `201` con la cotización persistida en
  lugar de `502`.

## Impact

- **Código backend:**
  - `apps/backend/src/contacts/` (nueva entidad, repositorio Firestore, servicio y
    módulo; hoy no persiste).
  - `apps/backend/src/cotizaciones/application/cotizacion.service.ts`.
  - `apps/backend/src/email/domain/iemail-notifier.ts`,
    `apps/backend/src/email/infrastructure/resend-email-notifier.ts`,
    `apps/backend/src/email/application/` (plantilla HTML).
- **Firestore:** nueva colección `contactos` (además de la existente `cotizaciones`).
- **Tests:** unitarios de servicios y adaptador, contract test del port, e2e de ambos
  endpoints.
- **Documentación:** `docs/runbooks/backend-staging-cloud-run.md`,
  `apps/backend/.env.example`, `.env.example` y `docs/data-model/data-model.md`
  (nueva colección).
- **Sin cambios** en DTOs, rutas, guards ni rate limiting.
