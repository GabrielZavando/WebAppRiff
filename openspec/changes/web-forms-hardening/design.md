## Context

El change archivado `2026-10-06-web-ux-contact-cotizacion-pagination` dejó tres
ítems de deuda técnica en su `tasks.md` sección 11 que este change cierra:

1. **`action` relativo** en `ContactForm.astro` / `CotizacionForm.astro`
   (`/api/v1/contacts`, `/api/v1/quotes`): el fallback nativo sin JavaScript en
   producción haría POST al origen del sitio (nginx en `somosriff.cl`) y recibiría
   404; `server.proxy` en `astro.config.mjs` solo actúa en `astro dev`. El camino
   con JS ya es correcto: `formSubmitClient` resuelve la URL contra
   `PUBLIC_API_URL` vía `resolveFormSubmitUrl`.
2. **`initFormSubmit` no es idempotente**: dos llamadas sobre el mismo `<form>`
   registran dos listeners de `submit` → doble `fetch` silencioso. Hoy solo no
   ocurre porque cada navegación de View Transitions descarta el `<body>` y los
   scripts de Astro se ejecutan una sola vez (salvo `data-astro-rerun`); es una
   fragilidad latente sin cobertura de tests.
3. **`fetch` sin timeout y sin test de cancelación**: `formSubmitClient.test.ts`
   cubre fallo de red y no-2xx, pero no timeout/abortación. Un `fetch` colgado
   deja el botón deshabilitado y al usuario sin feedback.

Estado actual relevante:

- `formSubmitClient.ts` (`apps/web/src/lib/forms/`): `resolveFormSubmitUrl`
  (pura, lee `import.meta.env.PUBLIC_API_URL` **en tiempo de llamada**, default
  `http://localhost:3000/api/v1`), `initFormSubmit` con cleanup que desvincula.
- `apps/web/src/lib/api/apiBaseUrl.ts`: `normalizeApiBaseUrl` (garantiza el
  sufijo `/api/v1`, limitación "sin scheme" documentada y pineada — no tocar).
- Tests con Astro container (`experimental_AstroContainer`) para componentes y
  páginas; patrón de testeo de env en `search-form.test.ts` (asignar/borrar
  `import.meta.env.X` y leer en call time).
- Config de ambos formularios guarda `action` **relativo**
  (`lib/config/contact-page.ts`, `lib/config/cotizacion-page.ts`) con test que
  afirma ese valor.
- Specs: `contact-page` y `cotizacion-page` duplican por convención los
  requirements compartidos del cliente de envío (URL del fetch, enlace del
  handler en `astro:page-load`, honeypot, bloque de estado).

## Goals / Non-Goals

**Goals:**

- El HTML renderizado de ambos formularios lleva `action` absoluto hacia el
  origen de la API (misma URL que usa el `fetch` con JS).
- `initFormSubmit` es idempotente por nodo de form, con tests que fallan antes
  del fix.
- El `fetch` se cancela a los 20 s y la cancelación se cubre con test.
- Todos los tests de `apps/web` quedan en verde (lint, typecheck, tests) y
  `npx openspec validate --all --strict` pasa.

**Non-Goals:**

- Warnings de complejidad ciclomática de `buildProductsPageHref` (13) y
  `parseProductsPageFilters` (12) → change propio.
- `normalizeApiBaseUrl` sin scheme → limitación documentada y pineada; no se
  cambia.
- Warning de `astro-icon` (`src/icons/` inexistente) y EBADENGINE de Node 22
  local vs `>=24` → cosmético / entorno.
- Mejoras de UX de formularios (modales, animaciones) → change posterior.
- Backend, API, deploy y `astro.config.mjs` quedan intactos.

## Decisions

### D1 — El `action` absoluto se construye en el frontmatter de los componentes

**Decisión**: resolver en `ContactForm.astro` y `CotizacionForm.astro`:
`const resolvedAction = resolveFormSubmitUrl(action)` y usar `resolvedAction`
en el `<form>`. `config.action` en `lib/config/*` sigue siendo la ruta relativa
legible en fuente; el JS y el fallback sin JS terminan en la misma URL porque
ambos pasan por la misma función pura.

**Por qué el componente y no otra capa** (alternativas consideradas):

- **Page frontmatter** (`contacto.astro` / `cotizacion.astro`): sería la
  "composition root", pero exige reescribir el spread de props en ambas páginas
  (`config: { ...config, action: resolve... }`, ~6 líneas duplicadas) y crea
  divergencia: el requirement de spec dice "*el ContactForm renderiza …*"; si la
  resolución vive en la página, el componente renderizado aislado daría `action`
  relativo y la página `action` absoluto — dos respuestas distintas para el mismo
  requirement. Además, cualquier consumidor futuro del componente tendría que
  acordarse de resolver.
- **Módulo de config** (`contact-page.ts` / `cotizacion-page.ts`): precedente
  existe (`search-form.ts` lee `import.meta.env`), pero `CONTACT_FORM_CONFIG`
  es un objeto constante evaluado a load de módulo, no una función: el patrón de
  test del proyecto (mutar `import.meta.env` y leer en call time) no aplicaría
  sin `vi.resetModules`, y el test de config que afirma `action === '/api/v1/contacts'`
  se rompería sin ganar nada. La config además es *contenido*; la URL de API es
  infraestructura.
- **Duplicar la lógica de resolución en cada página/compónente**: prohibido por
  el criterio de "detectar patrones repetidos"; se reutiliza
  `resolveFormSubmitUrl`.

**Compromiso aceptado**: los componentes dejan de ser 100 % "dumb" respecto al
env (hoy ningún `.astro` lee `import.meta.env`). Se documenta en el comentario
de cada componente: el copy/props siguen viniendo de la config; lo único que el
componente resuelve es el destino del submit, con una helper pura compartida.

### D2 — Reutilizar `resolveFormSubmitUrl` sin extraerlo

`resolveFormSubmitUrl` vive en `formSubmitClient.ts` (módulo del cliente) y se
importará desde el frontmatter SSR. Es segura hoy: su top-level solo declara
constantes (sin acceso a `document`/`window`), y el módulo ya es la fuente de
verdad de "¿a dónde va este submit?".

- *Alternativa*: extraer la helper a `lib/api/apiBaseUrl.ts` o a un módulo
  `lib/forms/resolveFormSubmitUrl.ts` puro. Mejor capa, pero mueve funciones y
  tests dentro de un change que debe ser acotado. Se deja como follow-up si el
  cliente crece.
- *Restricción derivada*: `formSubmitClient.ts` debe permanecer con top-level
  puro (código de navegador solo dentro de funciones) mientras el componente lo
  importe.

### D3 — Idempotencia con `WeakSet` a nivel de módulo

En `formSubmitClient.ts`:

```ts
const boundForms = new WeakSet<HTMLFormElement>();
```

`initFormSubmit(form)` → si `boundForms.has(form)`, retorna `() => {}`
(no-op). Si no: `boundForms.add(form)`, agrega el listener y retorna el cleanup
existente **más** `boundForms.delete(form)` (así `init → cleanup → init` sigue
funcionando; es el contrato que ya afirma el test actual de cleanup).

Por qué `WeakSet` y no data-attribute en el DOM: sin mutar el HTML renderizado
(los snapshots y los tests de markup no cambian), sin riesgo de colisión con
atributos `data-*` de Astro (`data-astro-rerun`/`data-astro-transition-persist`),
y la clave se recolecta con el nodo (sin fuga si el `<body>` se descarta).

**Detalle crítico de TDD**: el fake de test actual guarda **un solo**
`submitHandler` (`addEventListener` lo sobrescribe), así que un test de doble
init que solo afirmara "un fetch" pasaría *sin* el fix. El test fallido debe
extender el fake para registrar una **lista** de listeners y despachar a todos
(imitando el DOM real): pre-fix → 2 listeners → 2 fetch → test rojo; post-fix →
1 fetch → verde.

### D4 — El timeout entra en este change (no es solo cobertura de tests)

**Decisión**: añadir cancelación a los 20 s con `AbortSignal.timeout`:

```ts
const FORM_SUBMIT_TIMEOUT_MS = 20_000;
// en handleSubmit:
signal: AbortSignal.timeout(options.timeoutMs ?? FORM_SUBMIT_TIMEOUT_MS)
```

La promesa rechazada cae en el `catch` **existente** → mensaje de error inline,
botón rehabilitado, formulario sin resetear (exactamente el escenario agregado
en las specs).

- *Por qué y no solo test*: sin timeout, un `fetch` colgado (LB/proxy colgado,
  red inestable) deja el botón `disabled` para siempre y al usuario sin
  mensaje — un hueco real de UX en producción. El cambio son ~3 líneas en el
  archivo que ya se está tocando; agregar solo el test dejaría el bug documentado
  pero presente.
- *Valor 20 s*: el peor caso del backend ≈ cold start de Cloud Run + notifier
  Resend con `AbortSignal.timeout(10_000)` (tarea 1.6 archivada) + escritura en
  Firestore. 20 s deja margen para no abortar pedidos que el backend sí
  completaría (un abort = usuario que reintenta = lead duplicado; el throttler
  limita a 5 req/min pero no deduplica), a la vez que acota el colgado.
- *Mecanismo*: `AbortSignal.timeout` en vez de `AbortController` + `setTimeout`
  manual (menos código, autolimpieza, soportado en Node ≥17.3 y navegadores
  modernos; el proyecto exige Node ≥24).
- *Testeabilidad*: opción `timeoutMs` en `FormSubmitOptions` (precedente:
  `apiBaseUrl`, marcada "For tests"). El test usa `timeoutMs: 10` + un `fetch`
  fake que rechaza al dispararse la señal → sin fake timers (los timers internos
  de `AbortSignal.timeout` no los controla `vi.useFakeTimers`).
- *Guard*: `typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(ms) : undefined`
  para no romper el envío en navegadores viejos sin `AbortSignal.timeout`
  (allí `TypeError` dentro del `try` dejaría el submit sin enviar). Sin guard,
  Safari <16 pierde el envío JS; con guard, solo pierde el timeout.

### D5 — Specs duplicados en ambas capabilities (sin capability nueva)

Idempotencia y timeout se especifican igual en `contact-page` y
`cotizacion-page`, siguiendo la convención existente: los requirements
compartidos del cliente (fetch/URL, handler en `astro:page-load`, honeypot,
bloque de estado) ya viven duplicados en ambas specs para que cada capability
sea autocontenida. Crear `forms-submit-client` obligaría a migrar requirements
existentes de dos specs (y a cambiar el patrón de archive) para un change
acotado → fuera de alcance (justificado en `proposal.md`).

El `action` absoluto se especifica como **MODIFIED** del requirement de submit
de cada página (el usuario observable cambia: el HTML lleva URL absoluta y el
fallback sin JS apunta a la API); idempotencia y timeout como **ADDED**
requirements nuevos.

## Risks / Trade-offs

- **[Tests de `action` rotos]** — `ContactForm.test.ts`, `CotizacionForm.test.ts`,
  `contacto.test.ts`, `cotizacion.test.ts` y el snapshot de `ContactForm` afirman
  `action="/api/v1/..."`. → Actualizar afirmaciones al default absoluto
  (`http://localhost:3000/api/v1/...` en entorno de test sin `PUBLIC_API_URL`),
  regenerar el snapshot y añadir el caso con `import.meta.env.PUBLIC_API_URL`
  definida (asignar + borrar en `afterEach`, patrón `search-form.test.ts`).
- **[Test de idempotencia en verde sin el fix]** — por el fake de un solo
  handler. → Diseñar el fake con lista de listeners y despacho a todos (D3);
  verificar que el test roja antes de implementar.
- **[Timeout corto ⇒ lead duplicado]** — abortar un pedido que el backend iba a
  completar lleva al usuario a reintentar. → 20 s con margen sobre el peor caso
  del backend (D4); la rama de error ya informa y conserva los campos.
- **[Navegadores sin `AbortSignal.timeout`]** — el envío JS dejaría de funcionar
  si se llamara a una API inexistente. → Guard con fallback a `signal: undefined`.
- **[Acoplamiento SSR → módulo de cliente]** — si `formSubmitClient.ts`
  incorpora código de navegador en top-level, el build SSR se rompe. →
  Restricción documentada (D2); extraer a módulo puro si el cliente crece.
- **[`PUBLIC_API_URL` ausente en un build de prod]** — el `action` (y ya hoy el
  `fetch` con JS) caerían al default `http://localhost:3000/api/v1`. Es un riesgo
  preexistente, ya cubierto: `apps/web/Dockerfile` declara el ARG con default y
  `docs/deploy-standards.md` documenta la Coolify Build Variable (tarea 10.13
  archivada). Este change no empeora nada: JS y no-JS apuntan al mismo sitio.
- **[`server.proxy` deja de ser la única red de seguridad del fallback en dev]**
  → el action absoluto también funciona en dev; el proxy se conserva tal cual.

## Migration Plan

Sin migración de datos ni cambios de API. El `action` se resuelve en build
(SSG): desplegar es reconstruir la imagen de `apps/web` con las mismas variables
(`PUBLIC_API_URL` ya propagada). Rollback: revert del commit y rebuild.

## Open Questions

- Ninguna abierta. Pendiente menor explícito (no bloquea): extraer
  `resolveFormSubmitUrl` a un módulo puro compartido SSR/cliente si el cliente
  de formularios sigue creciendo (D2).
