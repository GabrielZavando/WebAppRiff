# Tasks

> TDD: cada tarea de implementación escribe primero el test fallido (RED) y
> luego el código que lo hace pasar (GREEN). Referencias: specs de
> `ui-toast` (contrato) y design.md D1–D10 (cómo).

## 1. Componente Toast.astro (capability ui-toast)

- [x] 1.1 RED: crear `apps/web/src/components/__tests__/Toast.test.ts` con AstroContainer: variante success (icono `lucide:circle-check`, mensaje prop, raíz oculto `hidden`, `role="status"` + `aria-live="polite"`), variante error (icono `lucide:circle-alert`, mensaje, `role="alert"` + `aria-live="assertive"`), botón X en esquina superior derecha con `aria-label="Cerrar notificación"` e icono `aria-hidden`, **región aria-live pre-existente y VACÍA en el HTML inicial** (render por defecto `<Toast />`: la raíz con `role`/`aria-live`/`hidden` ya existe en el markup y el contenido del mensaje está vacío — sin montaje al vuelo), y sin hex ni `rounded*`/`shadow*` en el markup (usar `stripComments` como en ContactForm.test.ts). Verificar que falla (el componente no existe).
- [x] 1.2 GREEN: implementar `apps/web/src/components/Toast.astro` (props `variant: 'success' | 'error'` default `'success'` y `message: string` default `''`; raíz con `data-form-toast`, `data-variant`, `data-state="hidden"`, `hidden`; ambos iconos con visibilidad por `data-[variant=...]`; colores vía tokens Tailwind de los scales success/error; fade-in keyframes scoped ~200 ms, design.md D4/D5/D10). Verificar: `npm run test -- web` (workspaces) o `npx vitest run src/components/__tests__/Toast.test.ts` en apps/web pasa.

## 2. Cliente del toast formToastClient.ts

- [x] 2.1 RED: crear `apps/web/src/lib/forms/__tests__/formToastClient.test.ts` (Node puro con seams inyectables, patrón createScrollTopButton.test.ts): muestra el toast con variante/mensaje/role/state según el `detail` del evento `riff:form-result` (éxito y error), autocierre a los 5 s con fake timers (`vi.useFakeTimers`) y `timeoutMs` inyectable, un nuevo resultado reinicia el timer (cancela el pendiente), click en X cancela el autocierre y oculta, **no acumulación de listeners: el listener se registra UNA SOLA VEZ a nivel de módulo (no por mount) — doble inicialización y re-inicialización tras cleanup (simulando navegaciones ida/vuelta) registran a lo sumo un listener en todo momento, mismo tipo de bug que el WeakSet `boundForms` de web-forms-hardening**, cleanup desvincula y permite re-inicializar, sin `[data-form-toast]` en el DOM es no-op. Verificar que falla (el módulo no existe).
- [x] 2.2 GREEN: implementar `apps/web/src/lib/forms/formToastClient.ts`: constante exportada `FORM_RESULT_EVENT = 'riff:form-result'`, `initFormToast(options?: { timeoutMs?: number; target?: ... })` con delegación en `document`, guard idempotente persistente, resolución del root `[data-form-toast]` en el momento del evento, semántica de timer clear+restart (design.md D6/D7). Verificar: tests del paso 2.1 en verde.

## 3. initFormSubmit publica el resultado como evento

- [x] 3.1 RED: actualizar `apps/web/src/lib/forms/__tests__/formSubmitClient.test.ts`: reemplazar las aserciones de escritura en `[role="status"]` por aserciones de dispatch — envío 2xx dispara `riff:form-result` sobre el `<form>` con `detail.kind = "success"` y `detail.message` desde `data-success-message`/opciones; no-2xx/fallo de red/timeout dispara con `kind = "error"` y mensaje desde `data-error-message`/opciones; form.reset() solo en éxito (preservado); sin toast en el DOM el envío funciona igual. Verificar que falla.
- [x] 3.2 GREEN: modificar `apps/web/src/lib/forms/formSubmitClient.ts`: eliminar `setStatus`, el lookup `[role="status"]` y la manipulación de `classList`; despachar el `CustomEvent` con `bubbles: true` tras resolver la respuesta (design.md D2). Verificar: todos los tests de formSubmitClient en verde (reset en éxito / sin reset en error / botón / timeout / idempotencia preservados).

## 4. Integración en los formularios

- [x] 4.1 RED: actualizar `apps/web/src/components/__tests__/ContactForm.test.ts` y `CotizacionForm.test.ts`: el toast (elemento raíz `data-form-toast` oculto) se renderiza como hermano del `<form>`; el bloque inline `<p role="status" ... data-form-status>` ya NO está en el DOM; `data-success-message` / `data-error-message` siguen en el `<form>`. Actualizar snapshots (`ContactForm.test.ts.snap`, `CotizacionForm.test.ts.snap` si existe). Verificar que falla.
- [x] 4.2 GREEN: renderizar `Toast.astro` en `ContactForm.astro` y `CotizacionForm.astro` (hermano del `<form>`, fuera de él) y eliminar el bloque inline de estado de ambos. Verificar: tests de componentes y de página (`contacto.test.ts`, `cotizacion.test.ts`) en verde.
- [x] 4.3 Verificación de integración del evento end-to-end en los seams del proyecto: con `initFormSubmit` + `initFormToast` sobre un form fake (dispatch de submit con fetch mock 2xx → el toast client recibe el evento y muestra; no-2xx → variante error), verificar que el contrato form↔toast funciona sin acoplarse al DOM (test de integración en `formToastClient.test.ts` o test dedicado). Verificar en verde.

- [x] 4.4 Conectar `initFormToast()` en las páginas (corrección post-planning: el componente es presentacional y nadie invocaba el registro en producción): RED — añadir a `formToastClient.test.ts` un test de fuente que verifique en `contacto.astro` y `cotizacion.astro` la importación de `initFormToast`, la invocación `initFormToast();` exactamente una vez y que el callback de `astro:page-load` NO contiene `initFormToast` (registro único a nivel de módulo, design.md D6). GREEN — añadir la importación y la llamada `initFormToast()` FUERA del listener de `astro:page-load` (con comentario breve) en el `<script>` de ambas páginas. Verificar: tests en verde y `npm run typecheck -w @riff/web`.

## 5. Documentación

- [x] 5.1 Documentar las referencias de iconos del toast en `docs/design/style-guide/README.md` (añadir/confirmar `circle-check` como éxito de toast, `circle-alert` como error, `x` como cierre) y verificar con `npx vitest run src/styles/__tests__/icon-catalog.test.ts` en apps/web (no debe romper el catálogo).

## 6. Verificación final (integración)

- [x] 6.1 Ejecutar `make ci` (gate completo: openspec-validate + lint + typecheck + test + audit) y verificar que pasa sin warnings nuevos de astro-icon en el build.
- [x] 6.2 Ejecutar `npx openspec validate --all --strict` y verificar que los deltas de `ui-toast`, `contact-page` y `cotizacion-page` son válidos.
