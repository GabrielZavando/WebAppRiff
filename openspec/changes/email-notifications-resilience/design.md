## Context

El backend ya tiene el port `IEmailNotifier` y un adaptador Resend que usa `fetch`
nativo con timeout de 10 s. Las specs actuales (`contacts-api`, `quotes-api`) definen que
un fallo de `sendEmail` se propaga y el endpoint responde `502`. Eso produce dos problemas:

- En cotizaciones, la cotización ya se persistió pero el usuario ve un error.
- En contactos no hay persistencia: el lead se pierde.

El cliente está verificando el subdominio `send.somosriff.cl` en Resend para no tocar el
DNS principal. Mientras tanto, el envío debe seguir siendo no-op si no hay
`RESEND_API_KEY`, y el remitente debe poder cambiarse por entorno.

Restricciones del proyecto: TypeScript strict, arquitectura por capas
(domain/application/infrastructure), DI por tokens, TDD, logs en inglés y artefactos en
español.

## Goals / Non-Goals

**Goals:**

- Garantizar que un lead (contacto o cotización) se conserve aunque Resend falle.
- Hacer la notificación de correo *best-effort* desde la perspectiva del usuario: el
  endpoint responde éxito si el lead se persistió.
- Soportar un cuerpo HTML opcional en `EmailMessage` y una plantilla de marca Riff.
- Documentar la inyección de `RESEND_API_KEY` y el cambio de remitente al subdominio.

**Non-Goals:**

- Panel admin o API pública/privada para listar contactos (solo se persisten; la consulta
  queda para un change posterior).
- Reintentos, colas o backoff de correo (el fallo solo se loguea).
- Migrar datos históricos de contactos (no existían).
- Cambiar el adaptador a un SDK oficial de Resend (se mantiene `fetch` nativo).
- Cambiar DTOs, rutas, guards, rate limiting ni el envelope de respuesta.

## Decisions

### D1. Persistir contactos antes de notificar (nueva colección `contactos`)

`ContactService` deja de ser persistence-free. Antes de enviar el correo llama a un nuevo
port `IContactRepository.create(input)` implementado con Firestore, siguiendo el patrón de
`CotizacionRepository`.

- **Entidad `Contacto`:** `id`, `nombre`, `empresa`, `email`, `telefono`,
  `areasDeInteres: string[]`, `mensaje`, `creadoEn: Date`.
- **Contrato de respuesta:** se mantiene el recibo actual (`ContactSubmission` con los
  campos enviados), sin agregar `id`. Alternativa considerada: devolver el documento con
  `id`; se descartó para no alterar el contrato público del formulario.
- **Honeypot:** si está relleno, no se persiste y no se notifica (comportamiento actual).
- **Fallo de persistencia:** se propaga `500`. La persistencia es la fuente de verdad; si
  Firestore falla, no tiene sentido enviar un correo que deje el lead solo en un buzón.
  El cliente conserva el formulario y puede reintentar.

### D2. Correo best-effort en ambos servicios

Los servicios capturan el error del notificador con `try/catch`, lo registran con
`Logger.error` y **no lo re-lanzan**:

- `CotizacionService.create`: `repository.create` → `try { notify } catch { log }` →
  devolver la cotización (`201`).
- `ContactService.submit`: honeypot → `repository.create` → `try { notify } catch { log }`
  → devolver el recibo (`201`).

El port `IEmailNotifier` mantiene su contrato actual: el adaptador **sí lanza** ante fallo.
La decisión de tolerar el fallo vive en el consumidor, no en el adaptador. Alternativa
considerada: hacer que el adaptador nunca lance; se descartó porque ocultaría fallos y
rompería el contrato ya testeado (y otros consumidores futuros podrían necesitar saberlo).

Los logs usan `Logger.error` con un mensaje en inglés que incluye el tipo de lead y el
`id` persistido cuando aplica; nunca incluyen la API key ni el cuerpo completo.

### D3. HTML opcional sin romper el texto plano

- `EmailMessage` agrega `readonly html?: string`; `text` sigue siendo obligatorio.
- `buildLeadEmailMessage` devuelve ambos cuerpos: `text` con líneas `Label: value` y
  `html` generado por una plantilla compartida.
- `ResendEmailNotifier` agrega `html` al payload JSON **solo si está definido**; mantiene
  `text` siempre. Así los mensajes existentes no cambian.
- La plantilla vive en `email/application/lead-email-template.ts`: tablas con
  `role="presentation"`, estilos inline (los clientes de correo ignoran `<style>` en
  muchos casos), ancho máximo 600 px, header navy `#1F2D40`, barra/accentos teal
  `#41B3C4`, fondo claro y filas etiqueta/valor.
- **Seguridad:** todos los valores del formulario se escapan (`&`, `<`, `>`, `"`, `'`)
  antes de insertarse en el HTML para evitar inyección de markup.

### D4. Configuración por entorno y subdominio

- El adaptador sigue leyendo `RESEND_API_KEY` en tiempo de llamada; no requiere cambios
  de código para Secret Manager ni para el subdominio.
- El runbook de Cloud Run documenta crear el secreto, otorgar
  `roles/secretmanager.secretAccessor` a la service account de runtime y montarlo con
  `--update-secrets=RESEND_API_KEY=RESEND_API_KEY:latest`.
- El remitente se cambia solo con `CONTACT_FROM_EMAIL=notificaciones@send.somosriff.cl`
  una vez que Resend verifique `send.somosriff.cl`. `CONTACT_TO_EMAIL` no cambia.
- Sin `RESEND_API_KEY`, el adaptador sigue siendo no-op con warning: los leads se
  persisten pero no se notifican (observable en logs).

### D5. Logging y observabilidad

Se usa el `Logger` de NestJS en los servicios. El adaptador no se modifica en su política
de errores. Para diagnóstico se registra el `id` del documento persistido y el mensaje de
error (que ya está libre de secretos por diseño del adaptador).

## Risks / Trade-offs

- **[Inyección HTML desde campos del formulario]** → escapado centralizado en la
  plantilla y test unitario con payloads maliciosos.
- **[Correos se ven distintos según el cliente]** → layout de tabla y estilos inline;
  `text` se mantiene como fallback.
- **[Nueva colección con PII]** → acceso restringido a Firestore/consola; no se expone
  endpoint de lectura en este change. Documentar la colección en `data-model.md`.
- **[Fallo de Firestore en contactos]** → se propaga `500`; es preferible a confirmar un
  lead que no se guardó. Se cubre con test.
- **[Cambio de contrato observable: se elimina el `502`]** → es el objetivo del change;
  los frontends ya tratan `201` como éxito. Se documenta como **BREAKING** en la propuesta.
- **[Resend rechaza envíos si el subdominio no está verificado]** → con el nuevo
  comportamiento el lead no se pierde; el fallo queda en logs. La verificación DNS es un
  prerequisito operativo del cliente.
- **[Resend no configurado en staging]** → no-op con warning; útil para pruebas sin
  enviar correos reales.

## Migration Plan

1. Desplegar el código: la colección `contactos` se crea en el primer write; no hay
   migración de datos.
2. Verificar que sin `RESEND_API_KEY` ambos endpoints persisten y responden `201`.
3. Crear el secreto `RESEND_API_KEY` en Secret Manager y montarlo en Cloud Run según el
   runbook.
4. Verificar `send.somosriff.cl` en Resend (SPF/DKIM) y ajustar
   `CONTACT_FROM_EMAIL=notificaciones@send.somosriff.cl`.
5. Smoke test: enviar un contacto y una cotización; confirmar documento en Firestore y
   correo recibido.

**Rollback:** revertir el deploy. Los documentos ya escritos en `contactos` son aditivos y
no afectan el funcionamiento anterior; no se requiere borrar datos.

## Open Questions

Ninguna pendiente. La persistencia de contactos se confirmó como parte del alcance; el
listado admin de contactos queda explícitamente fuera.
