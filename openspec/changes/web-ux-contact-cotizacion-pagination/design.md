## Context

El sitio público captura leads en `/contacto` y `/cotizacion`. Hoy:

- `ContactForm.astro:64` postea por submit nativo a `POST /api/v1/contacts`,
  endpoint que **no existe** en el backend (spec `contact-page` lo declara como
  "future backend endpoint"). El submit nativo navega y no ofrece mensajes
  inline de éxito/error.
- `CotizacionForm.astro:55` postea a `POST /api/v1/quotes` (sí existe,
  `cotizacion.controller.ts:35`). `CotizacionService.create` (cotizacion.service.ts:20)
  solo persiste en Firestore; nunca notifica por correo.
- No hay ninguna librería ni módulo de correo en `apps/backend/package.json` ni
  variables `SMTP_*`/`RESEND_*` en `.env.example`. El único patrón de salida
  HTTP existente es el webhook fire-and-forget `icatalog-change-notifier`
  (`webhook-catalog-change-notifier.ts`).
- La CTA "CONTACTAR ASESOR" (`productos/[slug].astro:86`) es un `mailto:`,
  no navega a `/contacto`.
- La paginación del catálogo es client-side (`catalogClient.ts:154-161`):
  intercepta el click, `pushState` y re-renderiza en sitio; **no** resetea el
  scroll. Los filtros ya se preservan vía `buildProductsPageHref`.

El throttler global ya está activo (`common.module.ts`) y el controller de
cotizaciones ya usa `@Throttle` por-endpoint (`QUOTES_THROTTLE`, 10/min).
La validación global usa `forbidNonWhitelisted` (`validation.config.ts`).

## Goals / Non-Goals

**Goals:**
- Enviar cada formulario de contacto y cotización a `contacto@somosriff.cl`
  mediante el proveedor Resend, detrás de un port `IEmailNotifier`.
- Implementar el endpoint público `POST /api/v1/contacts` (hoy inexistente) con
  rate limiting estricto y honeypot anti-spam.
- UX de formularios: envío con `fetch`, mensaje de éxito/error inline (aria-live),
  limpieza en éxito y conservación de campos en error.
- CTA "CONTACTAR ASESOR" → `/contacto`.
- Paginación: scroll al top tras el re-render, sin parpadeo, preservando filtros.
- `IEmailNotifier` no-op en dev/test y fake en tests; nunca correos reales en CI.

**Non-Goals:**
- Panel admin (Angular) — no se toca.
- Diseño visual de formularios, tarjetas ni paginación — solo comportamiento.
- Lógica de filtros de búsqueda — solo persistencia al paginar (ya existe).
- API de productos existente — sin cambios.
- Persistencia de contactos en Firestore: diferida como candidato post-MVP.
  La colección `contacts` (mismo patrón que `cotizaciones`) permitiría
  consultar leads desde el admin sin depender del correo. Se abordará en un
  change separado si el cliente lo pide. Las cotizaciones sí siguen
  persistiéndose (comportamiento existente).
- Autenticación en los endpoints públicos de formularios.
- Templates de correo avanzados: el correo es texto plano con todos los campos.

## Decisions

### D1. Proveedor de correo: Resend vía HTTP API (sin dependencia nueva)
El port `IEmailNotifier` se implementa con un adaptador HTTP que llama a la API
de Resend (`POST https://api.resend.com/emails`) usando `fetch` nativo (Node ≥24,
ya usado en `webhook-catalog-change-notifier.ts`). Sin `nodemailer`, sin SMTP.
**Alternativas descartadas**: SMTP+nodemailer (agrega infraestructura y
credenciales SMTP que operar), SendGrid (mismo esfuerzo, free tier menor).
**Rationale**: free tier suficiente, setup mínimo, sin servidor de correo.

### D2. Patrón port/adapter `IEmailNotifier` (espejo de `icatalog-change-notifier`)
- `apps/backend/src/email/domain/iemail-notifier.ts`: define `EmailMessage`
  (`from`, `to[]`, `subject`, `text`) y `IEmailNotifier.sendEmail(msg)` que
  **lanza en fallo** (a diferencia del notifier de catálogo, aquí el resultado
  determina la respuesta HTTP al usuario).
- `apps/backend/src/email/infrastructure/resend-email-notifier.ts`: adaptador
  real. **No-op con `Logger.warn` cuando `RESEND_API_KEY` está vacío** (local/dev
  sin config no falla). Timeout con `AbortSignal.timeout(10_000)`. El token
  nunca se loguea; en no-2xx lanza con `String(error)` genérico.
- `apps/backend/src/email/infrastructure/noop-email-notifier.ts`: no-op explícito
  para tests/inyección directa.
- Token `I_EMAIL_NOTIFIER` + `EmailModule` que expone el adaptador Resend en
  producción y permite inyectar un fake en tests (mismo estilo DI que
  `I_COTIZACION_REPOSITORY`).

### D3. Envío **awaitado** y semántica de fallo
El endpoint **espera** el resultado del envío antes de responder (no es
fire-and-forget). Si el envío falla, responde `502` con envelope de error:
el frontend muestra error y no limpia el formulario (criterio de aceptación).
En `/quotes` el orden es: persistir → notificar → responder. Si la notificación
falla tras persistir, se responde error; la cotización queda persistida (visible
en admin) y el usuario reintenta — se documenta el trade-off de duplicado en
Riesgos.

### D4. Nuevo endpoint `POST /api/v1/contacts`
Módulo `contacts/` siguiendo la estructura de `cotizaciones/`:
`application/contact.service.ts`, `infrastructure/contact.controller.ts`,
`infrastructure/contact-create.dto.ts`. Sin repository ni entidad persistida
(ver Non-Goals): el service valida el DTO, chequea el honeypot y delega en
`IEmailNotifier`.
- DTO `ContactCreateDto`: `nombre`, `empresa`, `email`, `telefono`, `mensaje`,
  `areasDeInteres: string[]` y `website: string` (honeypot, debe ir vacío).
  **Importante**: con `forbidNonWhitelisted` activo, el campo honeypot DEBE
  declararse en el DTO o el pipe global lo rechazaría con 400 antes de poder
  evaluarlo.
- Rate limiting: `@Throttle({ default: { limit: 5, ttl: 60_000 } })` (más
  estricto que los 10/min de `/quotes`), reutilizando el patrón de
  `cotizacion.controller.ts:26`.
- Registro en `app.module.ts`.

### D5. Honeypot anti-spam en ambos formularios
Campo oculto `website` (CSS oculto, `tabindex="-1"`, `autocomplete="off"`,
`aria-hidden="true"`) en `ContactForm.astro` y `CotizacionForm.astro`. El
backend rechaza la petición silenciosamente (200/201 con éxito simulado) cuando
el campo viene relleno, para no confirmar al bot. **Decisión de diseño**: se
valida igual en `/quotes` (mismo honeypot) — ambos formularios son superficie de
spam. El campo se declara en ambos DTOs.

### D6. Frontend: envío con `fetch` + estados inline
Los componentes de formulario son presentacionales ("dumb"); el JS vive en las
páginas (patrón de `index.astro` + `catalogClient`):
- Nuevo `apps/web/src/lib/forms/formSubmitClient.ts` con
  `initFormSubmit(config)` (o dos instancias pequeñas): intercepta `submit`
  (`preventDefault`), valida vía HTML5 nativo, POSTea JSON con `fetch` al
  `action` del formulario, deshabilita el botón mientras envía, y renderiza un
  bloque de estado inline.
- Los componentes ganan un contenedor de estado `<p role="status" aria-live="polite">`
  (u oculto hasta el primer resultado) con tokens de diseño existentes
  (`text-success`/`text-error` si existen, si no `text-text-2`/`text-primary`
  — **verificar tokens en apply**); sin `rounded*`/`shadow*`.
- Éxito → mensaje de confirmación + `reset()` del formulario.
  Error → mensaje claro + campos intactos.

### D7. CTA "CONTACTAR ASESOR" → `/contacto`
En `apps/web/src/pages/productos/[slug].astro:82-87`, cambiar
`href="mailto:contacto@somosriff.cl"` por `href="/contacto"`. Se conservan
clases, icono y texto. **No se toca** `ProductCard.astro` (no tiene ese botón) ni
`ServiceCard.astro` ("CONTACTAR A UN ESPECIALISTA" ya apunta a `/contacto`).
La variante `mailto:` sigue disponible vía ContactBar del propio `/contacto`.

### D8. Paginación con scroll al top
En `catalogClient.ts`, dentro del handler de click de los anchors de paginación
(`renderPaginationHtml`), tras `renderFromSearch(pageSearch)` se ejecuta
`window.scrollTo(0, 0)` (instantáneo, sin smooth-scroll para no pelear con
View Transitions y evitar salto visual). Alcance limitado al cambio de página;
los filtros ya se preservan (no requieren cambios).

### D9. Variables de entorno y documentación
Añadir a `.env.example` (root y `apps/backend/.env.example`):
- `RESEND_API_KEY=` (secreto, solo producción).
- `CONTACT_TO_EMAIL=contacto@somosriff.cl` (casilla destino; `EmailMessage.to`).
- `CONTACT_FROM_EMAIL=` (remitente verificado en Resend).
Documentar en el propio `.env.example` (y en `design.md` → apply) que el dominio
`somosriff.cl` debe verificarse en Resend (DNS record) antes de producción.

## Risks / Trade-offs

- [Fallo del proveedor tras persistir en `/quotes`] → Se responde `502`; el
  usuario reintenta y puede duplicar la cotización. **Mitigación**: el error se
  muestra con claridad; la duplicación es visible en admin y rara (window corta);
  un idempotency key queda como mejora futura.
- [Rate limit 5/min demasiado estricto para ráfagas legítimas] → Ventana de 60s
  razonable para uso humano; ajustable vía constante si hay falsos positivos.
- [Honeypot rompe accesibilidad o legítimos] → Patrón estándar: campo oculto
  visualmente pero no `display:none` según buenas prácticas; `aria-hidden` +
  `tabindex=-1`; los usuarios reales nunca lo ven.
- [Fuga de `RESEND_API_KEY`] → Secreto en Secret Manager (ops), nunca en logs ni
  en el repo; el adaptador es no-op si la variable está vacía.
- [Verificación de dominio pendiente en Resend] → Sin DNS verificado, Resend
  rechaza el envío; el error se loguea y el endpoint responde 502. **Mitigación**:
  documentar el paso DNS en `.env.example` y en el plan de deploy.
- [`forbidNonWhitelisted` vs honeypot] → Si el campo honeypot no está en el DTO,
  el pipe global responde 400. **Mitigación**: declararlo siempre en ambos DTOs.

## Migration Plan

1. **Backend primero** (deployable independiente): añadir `RESEND_API_KEY` y
   `CONTACT_TO_EMAIL` a Secret Manager y `.env.example`; desplegar módulos
   `contacts` + `email`. Con la key vacía el adaptador es no-op, así que el
   despliegue es retro-compatible (los endpoints responden igual pero sin correo).
2. **Verificar dominio** `somosriff.cl` en Resend (DNS) antes de activar la key.
3. **Frontend**: desplegar los clientes de formulario (fetch + estados), la CTA
   y el scroll al top.
4. **Rollback**: quitar `RESEND_API_KEY` del entorno → el adaptador vuelve a no-op
   (los formularios siguen funcionando sin correo); revertir el frontend
   restaurando el submit nativo y el `mailto`.

## Open Questions

- ¿Quién gestiona la verificación DNS de `somosriff.cl` en Resend (ops)? No
  bloquea el desarrollo: el adaptador es no-op sin key.
- Confirmar en apply qué tokens de color existen para estado éxito/error
  (`text-success`/`text-error` o equivalentes) antes de fijarlos en los clientes
  de formulario.
- Confirmar remitente (`from`) definitivo para el correo de notificación
  (default propuesto: `contacto@somosriff.cl` verificado en Resend).