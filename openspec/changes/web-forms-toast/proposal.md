# Proposal

## Why

Los formularios de contacto y cotización muestran hoy el resultado del envío en un bloque de texto inline con `role="status"` dentro del formulario (introducido en `2026-10-06-web-ux-contact-cotizacion-pagination`). Ese bloque es poco visible (queda al final del formulario, lejos del punto de atención del usuario), no es reutilizable y no permite un cierre explícito. Un toast de notificación no bloqueante — autocerrable y con botón de cierre — es el patrón acordado para dar feedback del resultado del envío de forma visible, consistente y reutilizable por ambos formularios.

## What Changes

- Nuevo componente Astro reutilizable `apps/web/src/components/Toast.astro`: toast de notificación con variantes `success` / `error`, iconos del set Lucide del proyecto, colores vía tokens de diseño (sin hex), posicionamiento fijo (`fixed`, no bloqueante, sin backdrop).
- Nuevo cliente JS `apps/web/src/lib/forms/formToastClient.ts` (`initFormToast`): muestra/oculta el toast, gestiona el autocierre a los 5 s, el cierre manual con el botón X y el reinicio del timer en cada nuevo resultado. Patrón de seams inyectables igual que `createScrollTopButton` / `initFormSubmit`.
- `initFormSubmit` (`formSubmitClient.ts`) pasa a **disparar un evento custom** (`CustomEvent` con `kind: 'success' | 'error'` y el mensaje en el `detail`) en lugar de escribir en el bloque inline `role="status"`. El contrato con `data-success-message` / `data-error-message` y las opciones `successMessage` / `errorMessage` se **preserva** (los mensajes siguen viniendo de ahí).
- El bloque inline `<p role="status" ...>` se **elimina** del DOM de `ContactForm.astro` y `CotizacionForm.astro` (no convive con el toast); el componente `Toast.astro` se renderiza en ambos formularios como hermano del `<form>`.
- Comportamiento preservado: el formulario se resetea en éxito y NO se resetea en error; honeypot, rate limit, timeout del fetch, idempotencia y validación nativa no cambian.
- Accesibilidad del toast: `role="status"` + `aria-live="polite"` para éxito, `role="alert"` + `aria-live="assertive"` para error, botón X con `aria-label` descriptivo; el foco se mantiene en el formulario (toast no bloqueante, no roba foco).
- Documentación: referencias de iconos del toast añadidas a `docs/design/style-guide/README.md`.

## Capabilities

### New Capabilities

- `ui-toast`: comportamiento duradero del toast de notificación reutilizable — componente Astro (`Toast.astro`) con variantes success/error, cliente JS (`initFormToast`) con autocierre, cierre manual y reinicio de timer, accesibilidad (roles ARIA, foco), tokens de diseño y posicionamiento fijo. Agnóstico de la página: cualquier formulario (hoy contacto y cotización) lo usa igual.

### Modified Capabilities

- `contact-page`: el requirement "ContactForm shows inline submit status" se renombra y modifica a "ContactForm renders the submit result as a toast notification" (el bloque inline `role="status"` se elimina; el resultado se refleja en el toast); el requirement "ContactForm submits via POST to a configurable action" se modifica (la referencia al bloque de estado inline pasa a ser el evento/notificación toast); el requirement "The form submit fetch is cancelled after 20 seconds" se modifica (la rama de error muestra el error en el toast, no en el bloque inline).
- `cotizacion-page`: los mismos tres requirements que en `contact-page` ("CotizacionForm shows inline submit status" → toast; "CotizacionForm submits via POST to /api/v1/quotes"; "The form submit fetch is cancelled after 20 seconds").

## Impact

- **Código frontend** (`apps/web/`):
  - `src/components/Toast.astro` (nuevo), `src/components/ContactForm.astro` y `src/components/CotizacionForm.astro` (eliminan el bloque inline, renderizan el toast).
  - `src/lib/forms/formSubmitClient.ts` (reemplaza `setStatus`/`[role="status"]` por dispatch del evento custom), `src/lib/forms/formToastClient.ts` (nuevo).
  - Tests: `formSubmitClient.test.ts`, `ContactForm.test.ts` (+ snapshot), `CotizacionForm.test.ts` (+ snapshot), `formToastClient.test.ts` (nuevo), `contacto.test.ts`, `cotizacion.test.ts`.
- **Docs**: `docs/design/style-guide/README.md` (referencias de iconos del toast).
- **Sin impacto**: backend, flujo de Resend, contrato de la API (`POST /api/v1/contacts`, `POST /api/v1/quotes`), dependencias npm (los iconos ya están en `@iconify-json/lucide`), honeypot/rate-limit/timeout/idempotencia.
