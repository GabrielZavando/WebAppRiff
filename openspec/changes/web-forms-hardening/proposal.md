## Why

Los dos formularios públicos (`/contacto` y `/cotizacion`) quedaron con tres
ítems de deuda técnica registrados en la sección 11 del `tasks.md` del change
archivado `2026-10-06-web-ux-contact-cotizacion-pagination`: (1) el `action` del
`<form>` sigue siendo relativo, por lo que el fallback nativo sin JavaScript haría
POST contra el origen del sitio en producción (nginx en `somosriff.cl`, API en
`api.somosriff.cl`) y recibiría 404 — el `server.proxy` de `astro.config.mjs` solo
mitiga eso en dev; (2) `initFormSubmit` no es idempotente: dos invocaciones sobre
el mismo `<form>` registran dos listeners de `submit` y producirían un doble
`fetch` silencioso si se pierde la garantía actual de Astro 7.1.6
(`data-astro-rerun` / `data-astro-transition-persist`); (3) el `fetch` no tiene
timeout ni cobertura de test para cancelación, de modo que una petición colgada
deja el botón deshabilitado y al usuario sin feedback. Conviene cerrarlas ahora,
en un change acotado, mientras el contexto de ambos formularios está fresco.

## What Changes

- **`action` absoluto en el HTML renderizado**: `ContactForm.astro` y
  `CotizacionForm.astro` resuelven la acción relativa de la config contra
  `PUBLIC_API_URL` reutilizando `resolveFormSubmitUrl` (misma fuente de verdad
  que usa el envío con JavaScript). El fallback sin JS pasa a hacer POST al
  origen de la API en cualquier entorno; el camino con JS no cambia (un
  `action` absoluto ya se respeta tal cual).
- **`initFormSubmit` idempotente por nodo**: `WeakSet<HTMLFormElement>` a nivel
  de módulo en `formSubmitClient.ts`; segunda invocación sobre el mismo form es
  un no-op que devuelve un cleanup no-op, con test que falla hoy.
- **Timeout del `fetch`**: el envío se cancela a los 20 s
  (`AbortSignal.timeout`), entrando en la rama de error existente (mensaje
  inline, botón rehabilitado, formulario sin resetear). Se añade como
  comportamiento observable nuevo, con test que ejercita la cancelación
  (valor sobreescribible vía options para los tests).
- **Tests**: idempotencia (doble `initFormSubmit` → un único listener / un
  único `fetch`), acción absoluta renderizada con y sin `PUBLIC_API_URL`, y
  timeout/cancelación.

## Capabilities

### New Capabilities

_(ninguna)_

El comportamiento compartido del cliente de envío ya vive, por convención del
proyecto, duplicado en las dos capabilities de página (`contact-page` y
`cotizacion-page`): los requirements del `fetch`/URL base, del enlace del handler
en `astro:page-load`, del honeypot y del bloque de estado existen en ambas.
Crear una capability nueva (p. ej. `forms-submit-client`) obligaría a migrar
también los requirements existentes para no duplicarlos y a cambiar el patrón de
archive, fuera del alcance de este change acotado. Se reutilizan las dos
capabilities existentes.

### Modified Capabilities

- `contact-page`: el `<form>` renderizado pasa a llevar `action` absoluto
  resuelto desde `PUBLIC_API_URL` (default `http://localhost:3000/api/v1`),
  tanto en el componente como en la composición de la página; el enlace del
  handler de submit pasa a ser idempotente por nodo; el envío se cancela a los
  20 s con la rama de error existente.
- `cotizacion-page`: mismas tres modificaciones para `#cotizacion-form` y
  `action="/api/v1/quotes"`.

## Impact

- **Frontend** (`apps/web/src`):
  - `src/lib/forms/formSubmitClient.ts` — `WeakSet` de idempotencia + `signal`
    de timeout en el `fetch`.
  - `src/components/ContactForm.astro`, `src/components/CotizacionForm.astro` —
    frontmatter que resuelve `action` a URL absoluta.
  - Tests: `src/lib/forms/__tests__/formSubmitClient.test.ts`,
    `src/components/__tests__/ContactForm.test.ts`,
    `src/components/__tests__/CotizacionForm.test.ts`,
    `src/pages/__tests__/contacto.test.ts`, `src/pages/__tests__/cotizacion.test.ts`
    (afirmaciones de `action` y snapshots afectados).
- **Config**: `src/lib/config/contact-page.ts` y `src/lib/config/cotizacion-page.ts`
  mantienen `action` relativo (lectura legible en fuente); sin cambios.
- **Sin cambios** en backend, API, deploy ni `astro.config.mjs`
  (`server.proxy` se conserva tal cual para dev).
- **Fuera de alcance** (explícito): warnings de complejidad ciclomática de
  `buildProductsPageHref`/`parseProductsPageFilters`; `normalizeApiBaseUrl` sin
  scheme (limitación documentada y pineada); warning de `astro-icon`; EBADENGINE
  de Node; mejoras de UX de los formularios (modales, animaciones).
