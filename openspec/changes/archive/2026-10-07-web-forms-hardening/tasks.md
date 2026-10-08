## 1. Idempotencia de `initFormSubmit` (TDD)

- [x] 1.1 Test fallido: extender el fake de `formSubmitClient.test.ts` para
      registrar una **lista** de listeners de `submit` por form (el fake actual
      sobrescribe un único slot y haría pasar el test sin el fix) y despachar a
      todos; `initFormSubmit(form)` dos veces sobre el mismo nodo + un `submit`
      → queda **un** listener registrado y se dispara **un único** `fetch`
- [x] 1.2 Test fallido: la segunda invocación devuelve un cleanup no-op —
      ejecutarlo no desvincula el listener registrado por la primera llamada
- [x] 1.3 Test fallido: `initFormSubmit` → `cleanup()` → `initFormSubmit` sobre
      el mismo form lo deja vinculado de nuevo con un único listener
- [x] 1.4 Implementar en `apps/web/src/lib/forms/formSubmitClient.ts`:
      `WeakSet<HTMLFormElement>` a nivel de módulo, early return con cleanup
      no-op si el form ya está vinculado, y cleanup de la primera llamada que
      además hace `delete` del set (design D3)

## 2. `action` absoluto en el frontmatter (TDD)

- [x] 2.1 Test fallido en `ContactForm.test.ts`: con `import.meta.env.PUBLIC_API_URL`
      borrada, el `<form>` renderizado tiene
      `action="http://localhost:3000/api/v1/contacts"`
- [x] 2.2 Test fallido en `ContactForm.test.ts`: con
      `import.meta.env.PUBLIC_API_URL = 'https://api.somosriff.cl/api/v1'` (y
      también sin el sufijo `/api/v1`) el `action` es
      `https://api.somosriff.cl/api/v1/contacts` — asignar/borrar la var en el
      test y en `afterEach` (patrón de `search-form.test.ts`)
- [x] 2.3 Test fallido en `ContactForm.test.ts`: `config.action` absoluta
      (`https://api.riff.cl/api/v1/contacts`) → se respeta tal cual en el HTML
- [x] 2.4 Test fallido en `CotizacionForm.test.ts`: mismos tres casos con
      `http://localhost:3000/api/v1/quotes` / `https://api.somosriff.cl/api/v1/quotes`
- [x] 2.5 Test fallido en `pages/__tests__/contacto.test.ts` y
      `pages/__tests__/cotizacion.test.ts`: la página renderizada contiene el
      `action` absoluto por defecto (reemplazar las afirmaciones actuales de
      `action="/api/v1/..."`)
- [x] 2.6 Implementar en los frontmatters de `ContactForm.astro` y
      `CotizacionForm.astro`: `const resolvedAction = resolveFormSubmitUrl(action)`
      sobre la acción de la config, usarlo en el `<form>` y actualizar el
      comentario que hoy dice `action={config.action}` (design D1/D2; la config
      y su test quedan intactos)
- [x] 2.7 Actualizar las afirmaciones preexistentes que esperaban `action`
      relativo en `ContactForm.test.ts` (casos "configurable action" y "custom
      action from config": la relativa custom se resuelve contra la base de la
      API) y regenerar el snapshot `ContactForm.test.ts.snap`

## 3. Timeout del `fetch` (TDD)

- [x] 3.1 Test fallido en `formSubmitClient.test.ts`: `initFormSubmit(form, { timeoutMs: 50 })`
      con un `fetch` fake que rechaza únicamente cuando se dispare la señal de
      abortación de su init → se muestra el mensaje de error en el bloque de
      estado, el botón de submit queda habilitado y el formulario **no** se
      resetea (la señal llega vía `AbortSignal.timeout` real; no usar fake
      timers)
- [x] 3.2 Test fallido en `formSubmitClient.test.ts`: verificar que `timeoutMs`
      no interfiere con el camino feliz (una respuesta 2xx rápida se resuelve
      normalmente sin ser abortada)
- [x] 3.3 Implementar en `formSubmitClient.ts`: constante
      `FORM_SUBMIT_TIMEOUT_MS = 20_000`, opción `timeoutMs` en
      `FormSubmitOptions` (marcada "For tests", procedente `apiBaseUrl`) y
      `signal` en el `fetch` con guard
      `typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(ms) : undefined`
      — la promesa rechazada cae en el `catch` existente, sin rama nueva
      (design D4)
- [x] 3.4 Confirmar que los tests de fallo de red, no-2xx y de botón
      deshabilitado existentes siguen en verde (la rama de error no cambia de
      comportamiento)

## 4. Verificación final

- [x] 4.1 En `apps/web`: `npm run lint`, `npm run typecheck` y `npm test` hasta
      verde (incluye los tests de specs tocados y el snapshot regenerado)
- [x] 4.2 `npx openspec validate --all --strict` sin errores ni warnings
- [x] 4.3 Revisión manual: en `/contacto` y `/cotizacion` con JS deshabilitado,
      el POST nativo sale hacia el `action` absoluto (origen de la API, no
      `localhost:4321`); con JS habilitado, un solo envío por submit y mensaje
      de error si la API no responde
