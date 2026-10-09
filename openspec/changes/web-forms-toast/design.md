# Design

## Context

Ver proposal.md — Why. Estado actual relevante (observado en el código):

- `apps/web/src/lib/forms/formSubmitClient.ts`: `initFormSubmit` resuelve los mensajes desde las opciones (`successMessage`/`errorMessage`) o de los atributos `data-success-message` / `data-error-message` del `<form>` (contrato establecido) y los escribe en el bloque `[role="status"]` dentro del form (`setStatus`: `textContent` + clases `text-success`/`text-error`). Resetea el form en 2xx, conserva campos en error, deshabilita el submit en vuelo, timeout 20 s (`AbortSignal.timeout`), binding idempotente por nodo form.
- `ContactForm.astro` / `CotizacionForm.astro`: bloque inline `<p role="status" aria-live="polite" class="mt-4 font-body text-sm" data-form-status></p>` dentro del `<form>`, y `data-success-message` / `data-error-message` en el `<form>`.
- Las páginas (`contacto.astro`, `cotizacion.astro`) vinculan `initFormSubmit` en `astro:page-load`.

Hallazgos del sistema de diseño (investigación):

- **Iconos**: el mecanismo real es `astro-icon` + `@iconify-json/lucide` vía `<Icon name="lucide:...">` (documentado en `astro.config.mjs` y en el catálogo `docs/design/style-guide/README.md`; `icon-catalog.test.ts` fuerza el prefijo `lucide:`). **No existe** `apps/web/src/icons/`: el warning de astro-icon ("no encuentra la carpeta src/icons/") es preexistente e inocuo — astro-icon busca ahí iconos locales por defecto, pero el proyecto consume los sets de iconify, así que la carpeta no es necesaria. Nombres canónicos documentados: `close` → `lucide:x`, `error` → `lucide:circle-alert`; nota del README: los alias antiguos (`alert-circle`, `x-circle`) aún resuelven pero se usan los canónicos. Iconos verificados como disponibles en el `@iconify-json/lucide` instalado: `circle-check`, `circle-alert`, `x`.
- **Tokens**: Tailwind v4 vía `@theme` en `globals.css`: scales `success` (`--color-success` #25D366, `-dark`, `-light` #E4F8EC), `error` (`--color-error` #E0453A, `-dark`, `-light` #FCE9E7); fuentes `font-heading` (Montserrat) y `font-body` (Open Sans). Flat design estricto: sin `rounded*` ni `shadow*`.
- **Overlays existentes**: WhatsApp FAB global (`fixed bottom-6 right-6 z-20`), header sticky group `z-30` (su overlay móvil `z-40` y toggle `z-50` quedan atrapados dentro del stacking context del shell `z-30`), contenido de página ≤ `z-10`. Precedente de delegación en `document` con seams inyectables: `createScrollTopButton.ts` (listener único en `document`, que persiste entre body swaps de View Transitions; resuelve el elemento en el momento del evento; testable en Node puro).

## Goals / Non-Goals

Goals:

- Un toast reutilizable y agnóstico de la página, con variantes success/error, que reemplace el bloque inline en ambos formularios.
- Mantener intacto el contrato de mensajes (`data-success-message` / `data-error-message` / opciones) y el comportamiento del envío (reset en éxito, sin reset en error).
- Desacoplar `formSubmitClient` del DOM del toast.

Non-Goals:

- No resolver el warning de astro-icon sobre `src/icons/` (follow-up documentado; no es necesario para este cambio).
- No tocar backend, Resend, honeypot, rate limit, timeout del fetch ni idempotencia.
- No crear modales/backdrop ni animaciones elaboradas.
- No tocar asteriscos ni lógica de `required`.

## Decisions

### D1 — Nueva capability `ui-toast`

El toast es un componente de UI reutilizable, agnóstico de la página, que hoy consumen contacto y cotización (y podrían consumir formularios futuros). Sus requirements no pertenecen a `contact-page` ni a `cotizacion-page`, que describen la composición de cada página. Se crea `specs/ui-toast/spec.md` (ADDED) y se modifican las dos capabilities de página solo donde sus requirements mencionan el bloque inline. Alternativa descartada: extender los specs de página con el componente duplicado (duplicaría requisitos y rompería la reutilización).

### D2 — Comunicación initFormSubmit ↔ Toast: evento custom

**Elección**: `initFormSubmit` despacha un `CustomEvent('riff:form-result', { detail: { kind: 'success' | 'error', message }, bubbles: true })` sobre el `<form>` tras resolver la respuesta. El cliente del toast escucha en `document` (delegación) y consume el `detail`.

**Alternativas evaluadas**:

1. *Callback `onResult` en `FormSubmitOptions`*: obligaría a las páginas a resolver el DOM del toast y a pasar el wiring; acopla página ↔ toast y duplica lógica en cada página.
2. *Seguir escribiendo en `[role="status"]` dentro del toast*: `setStatus` solo escribe texto; no puede cambiar `role`/`aria-live`/icono/variante. Requeriría que `initFormSubmit` conozca el DOM del toast (acoplamiento que se quiere evitar).
3. *Evento custom (elegido)*: mantiene el contrato data-* intacto (los mensajes siguen resolviéndose igual y viajan en `detail`), desacopla el runtime del DOM del toast, y encaja con el precedente de delegación en `document` del proyecto (`createScrollTopButton`, D2 de ese change: el listener en `document` persiste entre body swaps de View Transitions y resuelve elementos en el momento del evento).

Notas: `CustomEvent` es global en Node ≥ 20 (entorno de tests, sin jsdom); el nombre del evento se fija como constante exportada (`FORM_RESULT_EVENT = 'riff:form-result'`) para tests y reutilización.

**Convención de CustomEvent en el repo**: `riff:form-result` introduce la **primera** convención de eventos custom del repo (verificado: no existe ningún `CustomEvent` ni nombre de evento custom en `apps/` ni `packages/`; el único `dispatchEvent` es un test de Angular en `apps/admin` que despacha un evento nativo `Event('submit')`). Justificación del prefijo: se sigue la recomendación estándar (MDN) de namespacing de eventos custom con un prefijo de marca (`riff:`) para evitar colisiones con nombres de eventos nativos y de scripts de terceros; no existía convención previa que respetar.

### D3 — Mecanismo de iconos: astro-icon + `@iconify-json/lucide`

**Elección**: iconos vía `<Icon name="lucide:...">`, el mecanismo ya establecido en todo el proyecto (catálogo documentado, test de catálogo, SSR en build). Iconos del toast:

| Uso | Icono | Precedente |
| --- | --- | --- |
| Éxito | `lucide:circle-check` | variante circular de check (canónico actual; `lucide:check-circle` ya se usa en `ProductSpecifications.astro`) |
| Error | `lucide:circle-alert` | documentado en el catálogo como `error` |
| Cierre (X) | `lucide:x` | documentado en el catálogo como `close` (Header) |

**Alternativas descartadas**:

- *SVG inline*: duplicaría el set ya existente y rompería la convención de catálogo (ningún motivo para desviarse).
- *Sprite local / carpeta `src/icons/`*: es el mecanismo de iconos locales de astro-icon, pero el proyecto no lo usa; activarlo solo para el toast introduciría una segunda vía de iconos y seguiría dejando el warning (que es inocuo).
- *Otros sets iconify*: prohibidos por el catálogo (set único Lucide, excepciones de marca documentadas).

Follow-up documentado (fuera de alcance): silenciar el warning de astro-icon sobre `src/icons/` creando la carpeta vacía o configurando `iconDir` — no es necesario para usar los sets de iconify.

### D4 — Estructura del componente y aplicación de la variante

`Toast.astro` — componente tonto (presentacional), props:

- `variant?: 'success' | 'error'` (default `'success'`) — variante inicial del render SSG.
- `message?: string` (default `''`) — mensaje inicial (en runtime lo sobreescribe el cliente). **La región de anuncios se renderiza VACÍA en el HTML inicial**: en la integración con los formularios el componente se renderiza sin mensaje (`<Toast />` con defaults), de modo que la región `role`/`aria-live` existe vacía y pre-existente desde el SSG y solo cambia de contenido al recibir el evento (nunca se monta el componente al vuelo).

**Elección de variante en runtime**: el markup renderiza **ambos iconos** (check y alerta) y el cliente solo alterna atributos en el elemento raíz: `data-variant="success" | "error"`, `data-state="hidden" | "visible"`, `role`, `aria-live`, `hidden` y el texto del mensaje (`[data-toast-message]`). La visibilidad de cada icono y los colores se resuelven por CSS con utilidades Tailwind v4 de variante de dato (`data-[variant=error]:hidden`, `data-[variant=success]:bg-success-light`, `data-[variant=error]:bg-error-light`, etc.), sin manipular el DOM de los iconos desde JS.

**Alternativas descartadas**: clases condicionales gestionadas por JS (`classList.add/remove`, como el `setStatus` actual) — mueve la lógica de presentación al cliente y duplica listas de clases; dos toasts (uno por variante) — duplica markup y live regions.

Marcador de contrato: el elemento raíz lleva `data-form-toast` (análogo a `[data-scroll-top]`); es lo que `initFormToast` resuelve. No se necesita prop `id`: hay un solo form (y un solo toast) por página, y el evento se consume por delegación.

### D5 — Posicionamiento y z-index

**Elección**: `fixed top-6 right-6 z-40` en el elemento raíz (fuera del shell del header). El toast queda por encima del contenido (≤ `z-10`), del FAB de WhatsApp (`z-20`) y del header sticky group (`z-30`, cuyo overlay `z-40`/toggle `z-50` están atrapados en el stacking context del shell), de modo que nunca queda ocluido al hacer scroll.

**Alternativas descartadas**: `bottom-6 right-6` choca con el FAB de WhatsApp (global en Layout); `z-20`/`z-30` dejarían el toast bajo el header sticky al hacer scroll. **Trade-off aceptado y documentado**: con el menú móvil abierto, un toast disparado quedaría por encima del overlay del menú; es imposible en la práctica (el overlay bloquea la interacción con el formulario, luego no puede haber envío — y por tanto toast — con el menú abierto).

### D6 — Arquitectura del cliente del toast

Nuevo `apps/web/src/lib/forms/formToastClient.ts` con `initFormToast(options?): () => void`, siguiendo el patrón de seams inyectables de `createScrollTopButton` / `initFormSubmit` (testable en Node puro, sin jsdom):

- **Seams inyectables**: `target` (superficie con `addEventListener`/`removeEventListener`; default `document` en browser) y `timeoutMs` (default `5000`, siguiendo el patrón `timeoutMs` ya existente en `FormSubmitOptions`).
- **Delegación en `document`**: un listener para `riff:form-result` y un listener de `click` (delegación del botón X vía `closest('[data-form-toast] ...')`). El listener en `document` persiste entre body swaps de View Transitions; el root del toast se resuelve en el momento del evento (`document.querySelector('[data-form-toast]')`), igual que `createScrollTopButton` resuelve `[data-scroll-top]` en el click.
- **Idempotencia — listener registrado UNA SOLA VEZ a nivel de módulo**: guard con flag booleana a nivel de módulo (el script del toast es un módulo bundlado que el navegador ejecuta una vez por sesión; la flag sobrevive navegaciones ida/vuelta de View Transitions porque el módulo no se re-ejecuta). Inicializar más de una vez es no-op (devuelve cleanup no-op, mismo patrón que `initFormSubmit`) y el cleanup resetea la flag para permitir re-inicialización. Es el mismo tipo de bug que resolvió el WeakSet `boundForms` de `initFormSubmit` (idempotencia, `web-forms-hardening`), adaptado a un binding global único (el toast se bindea a `document`, no a un nodo form, así que una flag booleana es el análogo correcto). Cubierto por test de no acumulación (doble init y re-init tras cleanup: a lo sumo un listener en todo momento).
- **Wiring en producción (corrección post-planning, 2026-10-09)**: las páginas `/contacto` y `/cotizacion` invocan `initFormToast()` **UNA SOLA VEZ a nivel de módulo** — dentro del `<script>` existente que ya importa `initFormSubmit`, FUERA del listener de `astro:page-load`. El guard de módulo hace que la invocación sea un registro único por sesión: las invocaciones repetidas (ambos scripts de página, navegaciones ida/vuelta) son no-op. El listener en `document` sobrevive los body swaps de View Transitions y el root del toast se resuelve en el momento del evento, así que el registro no se pierde ni se acumula entre navegaciones. Corrige el gap detectado manualmente: el componente es presentacional (sin script propio) y nadie invocaba `initFormToast()` en producción, por lo que el toast nunca aparecía. Registrado en las páginas (y no como `<script>` dentro de `Toast.astro`) por explicitud y por calzar con el wiring existente de `initFormSubmit` en el mismo script; el wiring como script del componente queda como opción futura si se quieren más consumidores del toast.
- **Si no hay toast en el DOM**: no-op en el envío (el evento se publica igual; el toast simplemente no se muestra).

**Alternativa descartada**: registrar el listener **dentro** de `astro:page-load` en cada página — re-vincularía listeners en `document`/`window` en cada navegación (apilamiento de listeners); el registro único vive a nivel de módulo (top-level), con el guard como seguro.

### D7 — Timer de autocierre y reinicio

- Al recibir un resultado: cancelar cualquier timer pendiente (`clearTimeout`), aplicar variante/mensaje/semántica, mostrar, y programar un nuevo `setTimeout(hide, timeoutMs)`. Esto garantiza el reinicio del timer en cada nuevo envío/resultado (no queda cierre pendiente del toast anterior).
- Click en X: cancelar el timer pendiente y ocultar.
- Al dispararse: ocultar (`hidden`) y limpiar el timer.
- Timeout inyectable (`timeoutMs`, default `5000`) para tests con fake timers (`vi.useFakeTimers`), siguiendo el patrón de `FormSubmitOptions.timeoutMs`.

### D8 — Accesibilidad

- **Semántica por variante**: success → `role="status"` + `aria-live="polite"`; error → `role="alert"` + `aria-live="assertive"`. El cliente actualiza `role`/`aria-live` junto con la variante antes de actualizar el contenido.
- **Foco**: se mantiene en el formulario; el toast no recibe foco ni mueve el foco (notificación no bloqueante; los live regions no requieren foco para anunciarse).
- **Botón X**: `aria-label="Cerrar notificación"`; icono decorativo (`aria-hidden="true"`).
- **Ocultamiento**: atributo `hidden` (retira el elemento del árbol de accesibilidad), no `opacity-0` (que dejaría el contenido anunciado).
- **Región aria-live pre-existente y VACÍA (confirmado)**: la región de anuncios (raíz con `role`/`aria-live`) existe VACÍA en el HTML inicial — el toast se renderiza por SSG (oculto, `<Toast />` con defaults, sin mensaje) y nunca se monta al vuelo; el contenido solo cambia al recibir el evento, de modo que los lectores de pantalla tienen la región registrada antes del anuncio. Cubierto por test: la región vive pre-existente y vacía en el render inicial (task 1.1).
- **Caveat documentado**: cambiar `role`/`aria-live` dinámicamente es menos fiable en algunos lectores que una live region predeclarada con semántica fija; se mitiga porque la región ya está registrada desde el SSG antes de cualquier cambio de contenido y el cambio de `role` ocurre antes de actualizar el texto. Fallback si QA detecta problemas de anuncio con NVDA/VoiceOver (follow-up): dos live regions predeclaradas y vacías (una `status`/`polite`, otra `alert`/`assertive`) con semántica fija desde el SSG, rellenando la que corresponda.

### D9 — Dónde se renderiza el Toast

**Elección**: dentro de `ContactForm.astro` y `CotizacionForm.astro`, como hermano del `<form>` (fuera del `<form>`, tras `</form>`, dentro del wrapper del componente). El posicionamiento es `fixed`, así que su ubicación en el DOM es irrelevante visualmente.

**Justificación**: los formularios son componentes tontos dueños de su feedback → el toast va co-localizado con ellos; las páginas no cambian (componente agnóstico de página, reutilizable igual por cualquier formulario futuro). Fuera del `<form>` para no tocar `serializeForm` (no hay interferencia con `form.elements`) y eliminar cualquier sutileza del botón X dentro del form. **Alternativa descartada**: renderizarlo en `contacto.astro` / `cotizacion.astro` — añadiría wiring en dos páginas y acoplaría página ↔ toast.

### D10 — Animaciones mínimas

**Elección**: fade-in sutil al aparecer (keyframes scoped en `Toast.astro`: opacity + ligero translateY, ~200 ms ease-out; el navegador la reproduce al retirarse `hidden`) y ocultamiento instantáneo vía `hidden`. Coherente con el proyecto (el único transition precedent en componentes es `transition-colors`/`duration-*` del header).

**Alternativas descartadas**: transiciones de salida con `data-state` + visibility/opacity-delay (más complejas por el `hidden`, sin beneficio acorde al alcance "animaciones mínimas").

## Risks / Trade-offs

- [aria-live/role dinámicos menos fiables en algunos lectores] → la región vive en el DOM desde el SSG (oculta) antes de cualquier cambio; cambio de role antes de actualizar contenido; verificación manual NVDA/VoiceOver como follow-up de QA.
- [Toast z-40 sobre el overlay del menú móvil si se disparara con el menú abierto] → imposible en la práctica (el overlay bloquea la interacción con el form); riesgo aceptado y documentado en D5.
- [Timer de autocierre que sobrevive una navegación View Transitions] → oculta un nodo ya desvinculado (no-op visual inocuo); el root se resuelve en el momento del evento para el siguiente resultado.
- [Evento custom sin precedente en el proyecto] → contrato fijado como constante exportada y cubierto por tests del evento (formSubmitClient) y del cliente del toast (formToastClient); patrón de delegación con precedente directo en `createScrollTopButton`.
- [Doble listener si el script del toast se re-ejecuta tras navegación] → guard idempotente persistente (D6) + test de doble inicialización.

## Migration Plan

- Sitio estático: deploy por el pipeline normal (Coolify/Cloud Run). Sin migraciones de datos ni cambios de API; el backend sigue devolviendo 2xx/errores igual.
- Rollback: revert del deploy (no hay cambios de infraestructura ni de esquema).
- Compatibilidad: el fallback nativo sin JavaScript no cambia (ya hoy el bloque inline solo se llena con JavaScript; el toast también requiere JS — sin regresión).

## Open Questions

Ninguna. El warning de astro-icon sobre `src/icons/` quedó documentado como follow-up fuera de alcance (D3); no afecta al approach ni al breakdown.
