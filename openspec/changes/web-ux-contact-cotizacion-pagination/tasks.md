## 1. Backend — Infraestructura de email (port / adapters)

- [x] 1.1 Test fallido: definir el contrato `EmailMessage` (`from`, `to[]`, `subject`, `text`) y el port `IEmailNotifier.sendEmail(message)` que lanza ante fallo (token `I_EMAIL_NOTIFIER`)
- [x] 1.2 Implementar `apps/backend/src/email/domain/iemail-notifier.ts` con el port y el token
- [x] 1.3 Test fallido: `NoopEmailNotifier` no envía y no loguea
- [x] 1.4 Implementar `apps/backend/src/email/infrastructure/noop-email-notifier.ts`
- [x] 1.5 Test fallido: `ResendEmailNotifier` — no-op con `Logger.warn` si `RESEND_API_KEY` está vacía; llama a `POST https://api.resend.com/emails`; lanza en no-2xx, en timeout (10 s) y sin filtrar la API key en errores
- [x] 1.6 Implementar `apps/backend/src/email/infrastructure/resend-email-notifier.ts` con `fetch` + `AbortSignal.timeout(10_000)`
- [x] 1.7 Implementar `apps/backend/src/email/email.module.ts` exponiendo el adaptador Resend vía token (inyectable por fake en tests)
- [x] 1.8 Registrar `EmailModule` en `app.module.ts`

## 2. Backend — Variables de entorno de email

- [x] 2.1 Actualizar `.env.example` (root y `apps/backend/.env.example`) con `RESEND_API_KEY`, `CONTACT_TO_EMAIL` (default `contacto@somosriff.cl`) y `CONTACT_FROM_EMAIL`
- [x] 2.2 Documentar en `.env.example` el paso de verificación del dominio `somosriff.cl` en Resend (DNS) antes de producción

## 3. Backend — Endpoint público POST /api/v1/contacts

- [x] 3.1 Test fallido: `ContactCreateDto` valida `nombre`, `empresa`, `email`, `telefono`, `mensaje`, `areasDeInteres[]` y declara el honeypot `website` (forbidNonWhitelisted)
- [x] 3.2 Implementar `apps/backend/src/contacts/infrastructure/contact-create.dto.ts` declarando `website` con `@IsOptional()` (honeypot evaluado como string vacío o ausente, sin romper la retrocompatibilidad con el frontend previo)
- [x] 3.3 Test fallido: `ContactService.create` — honeypot relleno → éxito simulado sin envío; vacío o ausente → delega en `IEmailNotifier` con todos los campos
- [x] 3.4 Implementar `apps/backend/src/contacts/application/contact.service.ts`
- [x] 3.5 Test fallido: `ContactController` — 201 con envelope en éxito; 400 de validación; 502 si el proveedor falla; honeypot silencioso; 429 bajo throttling
- [x] 3.6 Implementar `apps/backend/src/contacts/infrastructure/contact.controller.ts` con `@Throttle({ default: { limit: 5, ttl: 60_000 } })`
- [x] 3.7 Registrar `ContactsModule` en `app.module.ts`

## 4. Backend — Notificación y honeypot en POST /api/v1/quotes

- [x] 4.1 Test fallido: `CotizacionService.create` notifica por email tras persistir (con todos los campos) y propaga el fallo del notifier
- [x] 4.2 Implementar: inyectar `IEmailNotifier` en `CotizacionService` y notificar en `create`
- [x] 4.3 Test fallido: controller `POST /quotes` — honeypot `website` relleno → 201 simulado sin persistir ni enviar; fallo de notificación → 502
- [x] 4.4 Implementar: añadir `website` con `@IsOptional()` a `CotizacionCreateDto` y chequeo de honeypot en el controller/service

## 5. Backend — Docs y gate de verificación

- [x] 5.1 Actualizar `docs/api/api-spec.yml` con `POST /contacts` (contrato, honeypot y rate limiting) y la notificación por email en `POST /quotes`
- [x] 5.2 Ejecutar en `apps/backend`: `npm run lint`, `npm run typecheck` y `npm test` hasta verde

## 6. Frontend — Envío con fetch y estados inline en los formularios

- [x] 6.1 Test fallido: `apps/web/src/lib/forms/formSubmitClient.ts` — submit interceptado, payload JSON con honeypot, botón deshabilitado en vuelo, confirmación+reset en 2xx, error+conservación en no-2xx
- [x] 6.2 Implementar `formSubmitClient.ts` (función `initFormSubmit` reutilizable por ambos formularios)
- [x] 6.3 Test fallido: `ContactForm.astro` — renderiza campo honeypot `website` oculto y bloque `role="status"` `aria-live="polite"` dentro del form
- [x] 6.4 Implementar en `ContactForm.astro`: honeypot + bloque de estado (tokens existentes, sin `rounded*`/`shadow*`)
- [x] 6.5 Test fallido: `CotizacionForm.astro` — renderiza honeypot `website` oculto y bloque `role="status"` dentro del form
- [x] 6.6 Implementar en `CotizacionForm.astro`: honeypot + bloque de estado
- [x] 6.7 Conectar el cliente en `apps/web/src/pages/contacto.astro` y `apps/web/src/pages/cotizacion.astro` (script + `initFormSubmit`), verificar tokens de éxito/error existentes
- [x] 6.8 Regenerar/actualizar snapshots afectados de ContactForm y CotizacionForm

## 7. Frontend — CTA "CONTACTAR ASESOR" navega a /contacto

- [x] 7.1 Test fallido: `apps/web/src/pages/productos/[slug].astro` renderiza el anchor "CONTACTAR ASESOR" con `href="/contacto"` y sin `mailto:`
- [x] 7.2 Implementar: cambiar `href="mailto:contacto@somosriff.cl"` por `href="/contacto"` en `[slug].astro` (conservando clases/icono)

## 8. Frontend — Paginación con scroll al top

- [x] 8.1 Test fallido: el handler de click de paginación de `catalogClient.ts` invoca `window.scrollTo(0, 0)` tras el re-render, preservando los filtros (mocks de `window`/`history`)
- [x] 8.2 Implementar: llamada a `window.scrollTo(0, 0)` (instantánea) en el handler de los anchors de paginación de `initCatalog`

## 9. Verificación final

- [x] 9.1 Ejecutar en `apps/web`: `npm run lint`, `npm run typecheck` y `npm test` hasta verde
- [x] 9.2 Ejecutar `npx openspec validate --all --strict` y corregir cualquier desviación de los artefactos
- [x] 9.3 Revisión manual: envío de ambos formularios (éxito/error), CTA a `/contacto` y paginación con scroll al top en desktop y mobile

## 10. Correcciones detectadas en la verificación manual (bugs A/B/C)

Bug A (404 en ambos formularios): `astro.config.mjs` no declaraba `server.proxy`, y
`formSubmitClient` hacía `fetch` contra el `action` **relativo** (`/api/v1/...`), que
Astro (dev) y el sitio estático (prod) responden 404. Además el `<script>` de las páginas
no enlazaba el handler de forma fiable bajo View Transitions (`ClientRouter`).

- [x] 10.1 Artefactos primero: añadir a los deltas `contact-page` y `cotizacion-page` los scenarios del destino del `fetch` (URL base de la API), el enlace del handler vía `astro:page-load` y el requisito de asteriscos de obligatoriedad
- [x] 10.2 Extraer `normalizeApiBaseUrl` en `apps/web/src/lib/api/apiBaseUrl.ts` (puro, compartido Node/browser) y hacer `resolveApiBaseUrl` segura para el bundle de navegador
- [x] 10.3 Test fallido: `resolveFormSubmitUrl` (action relativo + base con/sin `/api/v1`, action absoluto, action vacío) y el destino del `fetch` en `initFormSubmit`
- [x] 10.4 Implementar `resolveFormSubmitUrl` en `formSubmitClient.ts` (lee `PUBLIC_API_URL`, default `http://localhost:3000/api/v1`) y hacer el `fetch` a esa URL
- [x] 10.5 Añadir `server.proxy` (`/api` → `http://localhost:3000`) a `apps/web/astro.config.mjs` para el fallback nativo sin JS en dev
- [x] 10.6 Enlazar el handler de ambos formularios en `document.addEventListener('astro:page-load', ...)` (funciona en carga inicial y en navegación cliente)
- [x] 10.7 Documentar `PUBLIC_API_URL` en `.env.example` (solo las vars `PUBLIC_*` llegan al navegador)

Bug B (botón "Enviar" siempre habilitado): síntoma de 10.6 (handler no enlazado en
/contacto) más respuestas 404 instantáneas; el estado `disabled` durante el vuelo ya
estaba implementado y ahora se cubre también para la rama de error.

- [x] 10.8 Tests: botón `disabled` durante el vuelo y rehabilitado tras éxito, tras respuesta no-2xx y tras fallo de red

Bug C (sin asteriscos en obligatorios): gap de UX no contemplado en el plan.

- [x] 10.9 Tests: asterisco `aria-hidden` en los labels obligatorios, nota de obligatoriedad y honeypot sin `required`, en ambos formularios
- [x] 10.10 Implementar asteriscos + nota en `ContactForm.astro` (5 obligatorios: nombre, empresa, email, telefono, mensaje)
- [x] 10.11 Alinear `CotizacionForm.astro` con `CotizacionCreateDto.required`: asteriscos en nombre, email, nombre_empresa, mensaje y **quitar `required`** de `telefono` y `rut` (opcionales en el DTO; el frontend era más estricto que el backend)
- [x] 10.12 Regenerar el snapshot de `ContactForm`
- [x] 10.13 Propagar `PUBLIC_API_URL` como build arg en `apps/web/Dockerfile` (el bundle del navegador solo recibe vars `PUBLIC_*`; sin esto el build de prod cae al default `http://localhost:3000/api/v1`) y documentarlo en `docs/deploy-standards.md` como Coolify Build Variable
- [x] 10.14 Tests de `normalizeApiBaseUrl` (trailing slash, sin sufijo, sin duplicar sufijo, vacío/blank, whitespace, valor por defecto, y el caso sin scheme como limitación documentada)

## 11. Deuda técnica conocida

Detectada durante la verificación manual y la ronda de preguntas. **No bloquea** el
cierre del change (no afecta el comportamiento verificado), pero queda registrada
para no perderse al archivar.

- [ ] **`action` absoluto en el frontmatter del form.** El atributo `action` sigue siendo
      relativo (`/api/v1/contacts`, `/api/v1/quotes`), así que en producción —sitio
      estático detrás de nginx en `somosriff.cl`, API en `api.somosriff.cl`— el
      fallback nativo sin JavaScript haría POST contra el origen equivocado y recibiría
      404. `server.proxy` en `astro.config.mjs` solo actúa en `astro dev`, por lo que
      solo mitiga ese caso en desarrollo. El camino con JavaScript no se ve afectado
      (`fetch` a la URL absoluta vía `PUBLIC_API_URL`). Solución cuando se aborde:
      construir el `action` absoluto en el frontmatter del componente.
- [ ] **Fragilidad bajo `data-astro-rerun` / `data-astro-transition-persist`.** Que el
      handler se enlace una sola vez depende hoy del comportamiento de Astro 7.1.6
      (`scriptsAlreadyRan` en `astro/dist/transitions/swap-functions.js`, que impide
      re-ejecutar un script ya ejecutado salvo `data-astro-rerun`) y de que cada
      navegación de View Transitions descarte el `<body>` anterior, de modo que
      `initFormSubmit` siempre liga a un nodo nuevo. `initFormSubmit` **no es
      idempotente**: dos llamadas sobre el mismo `<form>` registran dos listeners de
      `submit` (verificado empíricamente: 2 llamadas → 2 `addEventListener`), lo que
      produciría un doble `fetch` silencioso. Si alguien añade `data-astro-rerun` a los
      scripts de `contacto.astro`/`cotizacion.astro`, o `data-astro-transition-persist`
      al `<form>`, esa garantía se pierde. Sin cobertura de tests: no hay test que
      ejercite dos disparos de `astro:page-load`.
- [ ] **Timeout del `fetch` sin cobertura.** `formSubmitClient` cubre el fallo de red
      (`fetch` rechaza) y las respuestas no-2xx, pero no el caso de timeout por
      `AbortController`/señal de cancelación, que llega por la misma rama de rechazo
      pero por un motivo distinto.