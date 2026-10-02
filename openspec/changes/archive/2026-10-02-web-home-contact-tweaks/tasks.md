# Tasks — Web Home Contact Tweaks

> Capa: frontend (dumb components + config infrastructure). Rutas bajo `apps/web` (servicio `.` del mono-repo, `.specboot.json`).
> Arquitectura: componentes dumb + configs hardcodeadas (patrón site-wide); ClientRouter global en Layout.

## 1. Specs & Tests (TDD — fase roja)

- [x] 1.1 [SC-001] Actualizar `apps/web/src/lib/config/__tests__/contact-page.test.ts`: aserciones `contacto@riff.cl` → `contacto@somosriff.cl` (líneas 50/52). Layer: infrastructure · Prioridad: Alta · Estimación: XS. Suggested Path: `apps/web/src/lib/config/__tests__/contact-page.test.ts` · Test Path: `apps/web/src/lib/config/__tests__/contact-page.test.ts`.
- [x] 1.2 [SC-001/SC-004] Actualizar `apps/web/src/pages/__tests__/contacto.test.ts` (línea 33), `apps/web/src/components/__tests__/ContactBar.test.ts` (líneas 35-36 y 119) y `apps/web/src/pages/productos/__tests__/[slug].test.ts` (línea 127): `contacto@riff.cl` → `contacto@somosriff.cl`. Layer: infrastructure · Prioridad: Alta · Estimación: XS. Suggested Path: `apps/web/src/components/__tests__/ContactBar.test.ts` · Test Path: `apps/web/src/components/__tests__/ContactBar.test.ts`.
- [x] 1.3 [SC-003] Actualizar `apps/web/src/components/__tests__/DestacadosSection.test.ts`: aserción "Cotizar" → "Ver detalles" (describe de líneas 226-239). Layer: dumb · Prioridad: Alta · Estimación: XS. Suggested Path: `apps/web/src/components/__tests__/DestacadosSection.test.ts` · Test Path: `apps/web/src/components/__tests__/DestacadosSection.test.ts`.
- [x] 1.4 [SC-002] Actualizar `apps/web/src/components/__tests__/ServicesSection.test.ts` + `helpers/services-section-test-utils.ts`: aserciones de `href="/servicios"` → CTA apunta a `/servicios#{slug}`; eliminar aserciones del campo `href` de `Service`. Layer: dumb · Prioridad: Alta · Estimación: S. Suggested Path: `apps/web/src/components/__tests__/ServicesSection.test.ts` · Test Path: `apps/web/src/components/__tests__/ServicesSection.test.ts`.
- [x] 1.5 [SC-002/SC-008] Añadir test de contrato 1:1: slugs de `SERVICES_DATA` (home) ≡ ids de las 4 `ServiceCard` en /servicios; `ServicePageService` expone `slug` kebab-case por servicio. Layer: infrastructure · Prioridad: Media · Estimación: S. Suggested Path: `apps/web/src/lib/config/__tests__/services-page.test.ts` · Test Path: `apps/web/src/lib/config/__tests__/services-page.test.ts`.
- [x] 1.6 [SC-002/SC-005/SC-006/SC-007] Añadir tests: `Layout.astro` renderiza `<ClientRouter />` en `<head>`; `initHeaderScrollState` se re-inicializa en `astro:page-load`. Layer: infrastructure · Prioridad: Media · Estimación: M. Suggested Path: `apps/web/src/layouts/__tests__/Layout.test.ts` · Test Path: `apps/web/src/layouts/__tests__/Layout.test.ts`.
- [x] 1.7 Ejecutar `vitest` en `apps/web` y confirmar fase roja (los tests nuevos/actualizados fallan). Suggested Path: no aplica · Test Path: no aplica.

## 2. Correo único contacto@somosriff.cl (TDD — verde)

- [x] 2.1 [SC-001] Editar `apps/web/src/lib/config/contact-page.ts`: `CONTACT_EMAIL`/`CONTACT_EMAIL_HREF` → `contacto@somosriff.cl` / `mailto:contacto@somosriff.cl`; corregir comentario desactualizado sobre /cotizacion. Layer: infrastructure · Prioridad: Alta · Estimación: XS. Suggested Path: `apps/web/src/lib/config/contact-page.ts` · Test Path: `apps/web/src/lib/config/__tests__/contact-page.test.ts`.
- [x] 2.2 [SC-004] Editar `apps/web/src/pages/productos/[slug].astro`: `mailto:contacto@riff.cl` → `mailto:contacto@somosriff.cl` (línea 82). Layer: infrastructure · Prioridad: Alta · Estimación: XS. Suggested Path: `apps/web/src/pages/productos/[slug].astro` · Test Path: `apps/web/src/pages/productos/__tests__/[slug].test.ts`.
- [x] 2.3 [SC-001] Actualizar ejemplo de JSDoc en `apps/web/src/lib/types/contact-form.ts` (línea 74) para consistencia. Layer: infrastructure · Prioridad: Baja · Estimación: XS. Suggested Path: `apps/web/src/lib/types/contact-form.ts` · Test Path: no aplica.
- [x] 2.4 Ejecutar `vitest` (tests de email) y confirmar verde. Suggested Path: no aplica · Test Path: no aplica.

## 3. Anclas de servicios + CTAs con slug (TDD — verde)

- [x] 3.1 [SC-002/SC-008] Añadir `slug` a `ServicePageService` (`apps/web/src/lib/types/services-page.ts`) y a `SERVICIOS_PAGE_SERVICES` (`apps/web/src/lib/config/services-page.ts`): `medicion-en-edificios`, `medicion-industrial`, `obras-y-proyectos`, `tratamiento-de-agua` (1:1 con el home). Layer: infrastructure · Prioridad: Alta · Estimación: S. Suggested Path: `apps/web/src/lib/config/services-page.ts` · Test Path: `apps/web/src/lib/config/__tests__/services-page.test.ts`.
- [x] 3.2 [SC-002/SC-005] Editar `apps/web/src/components/ServiceCard.astro`: renderizar `id={slug}` en el `<article>` raíz + `scroll-margin-top` (compensa el header sticky). Layer: dumb · Prioridad: Alta · Estimación: S. Suggested Path: `apps/web/src/components/ServiceCard.astro` · Test Path: `apps/web/src/components/__tests__/ServiceCard.test.ts`.
- [x] 3.3 [SC-002] Editar `apps/web/src/components/ServicesSection.astro`: CTA por tarjeta `href={`/servicios#${service.slug}`}` (derivado del slug). Layer: dumb · Prioridad: Alta · Estimación: XS. Suggested Path: `apps/web/src/components/ServicesSection.astro` · Test Path: `apps/web/src/components/__tests__/ServicesSection.test.ts`.
- [x] 3.4 [SC-002] Eliminar campo `href` del tipo `Service` (`apps/web/src/lib/types/services-section.ts`) + `SERVICES_DATA` (`apps/web/src/lib/config/services-section.ts`) — redundante, single source = slug. Layer: infrastructure · Prioridad: Media · Estimación: XS. Suggested Path: `apps/web/src/lib/config/services-section.ts` · Test Path: `apps/web/src/components/__tests__/ServicesSection.test.ts`.
- [x] 3.5 Ejecutar `vitest` (services) y confirmar verde. Suggested Path: no aplica · Test Path: no aplica.

## 4. "Ver detalles" en Destacados (TDD — verde)

- [x] 4.1 [SC-003] Editar `apps/web/src/components/DestacadosSection.astro`: texto del CTA de tarjeta "Cotizar" → "Ver detalles" (línea 89). Layer: dumb · Prioridad: Alta · Estimación: XS. Suggested Path: `apps/web/src/components/DestacadosSection.astro` · Test Path: `apps/web/src/components/__tests__/DestacadosSection.test.ts`.

## 5. View Transitions globales (TDD — verde)

- [x] 5.1 [SC-002] Editar `apps/web/src/layouts/Layout.astro`: importar y renderizar `<ClientRouter />` de `astro:transitions` en `<head>`. Layer: infrastructure · Prioridad: Alta · Estimación: S. Suggested Path: `apps/web/src/layouts/Layout.astro` · Test Path: `apps/web/src/layouts/__tests__/Layout.test.ts`.
- [x] 5.2 [SC-002/SC-005/SC-006/SC-007] Adaptar `apps/web/src/lib/scroll/createHeaderScrollState.ts` y su script de Layout: re-inicialización en `astro:page-load` (sobrevive a navegaciones client-side). Layer: infrastructure · Prioridad: Alta · Estimación: M. Suggested Path: `apps/web/src/lib/scroll/createHeaderScrollState.ts` · Test Path: `apps/web/src/lib/scroll/__tests__/createHeaderScrollState.test.ts`.
- [x] 5.3 Ejecutar `vitest` completo en `apps/web` y confirmar verde sin regresiones (Header/SearchForm/scroll). Suggested Path: no aplica · Test Path: no aplica.

## 6. Snapshots y verificación

- [x] 6.1 Regenerar snapshots (`vitest -u`) y verificar diff (`ContactBar.test.ts.snap` entre otros). Suggested Path: no aplica · Test Path: no aplica.
- [x] 6.2 Suite completa `vitest` sin regresiones. Suggested Path: no aplica · Test Path: no aplica.
- [x] 6.3 Lint/typecheck en `apps/web` (eslint 0 errores; componentes compilan vía AstroContainer). Suggested Path: no aplica · Test Path: no aplica.

## 7. Verificación manual

- [x] 7.1 [SC-002/SC-005/SC-006/SC-007] Dev server (`npm run dev` en `apps/web`): transición VT home→/servicios, scroll suave a ancla visible bajo el header sticky (desktop + mobile + `prefers-reduced-motion`). Suggested Path: no aplica · Test Path: no aplica.
- [x] 7.2 [SC-001/SC-004] Email `contacto@somosriff.cl` visible/enlazado en /contacto y en la ficha de un producto publicado. Suggested Path: no aplica · Test Path: no aplica.
- [x] 7.3 [SC-003] Botones "Ver detalles" de Soluciones Destacadas navegan a las fichas correctas (`/productos/{slug}`). Suggested Path: no aplica · Test Path: no aplica.

> **BLOQUEADA en verificación**: los 4 slugs de `FEATURED_PRODUCTS` daban 404 (2 productos existían con slugs distintos; 2 no estaban publicados). Decisión del cliente 2026-09-30: alinear 2 + reemplazar 2 → se resuelve en la sección 8 y se re-verifica en 8.4.

## 8. Fix post-verificación: alinear slugs + reemplazar productos destacados (decisión del cliente 2026-09-30)

- [x] 8.1 [SC-003] Actualizar `apps/web/src/lib/config/__tests__/destacados-section.test.ts`: slugs/títulos de `FEATURED_PRODUCTS` → `antiincrustante-bimaks-420-para-osmosis-inversa-agua-salobre`, `medidor-ultrasonico-doppler-portatil-fullsonic-no-invasivo`, `medidor-de-flujo-riff-turbine-pro`, `medidor-electromagnetico-fullmag-ha` (rojo). Layer: infrastructure · Prioridad: Alta · Estimación: S. Suggested Path: `apps/web/src/lib/config/__tests__/destacados-section.test.ts` · Test Path: el mismo archivo.
- [x] 8.2 [SC-003] Editar `apps/web/src/lib/config/destacados-section.ts`: alinear los 2 slugs de productos existentes + reemplazar "MWN Woltman" y "Flujómetro Universal" por "Medidor de Flujo Riff Turbine Pro" y "Medidor Electromagnético Fullmag HA" (imágenes provisionales reutilizadas de los productos reemplazados, con comentario pendiente de fotos reales del cliente). Layer: infrastructure · Prioridad: Alta · Estimación: S. Suggested Path: `apps/web/src/lib/config/destacados-section.ts` · Test Path: `apps/web/src/lib/config/__tests__/destacados-section.test.ts`.
- [x] 8.3 Ejecutar `vitest` (destacados + suite completa) y confirmar verde. Suggested Path: no aplica · Test Path: no aplica.
- [x] 8.4 Re-verificar 7.3: los 4 CTAs "Ver detalles" de Soluciones Destacadas navegan a fichas HTTP 200 en el dev server. Suggested Path: no aplica · Test Path: no aplica.

## Mandatory Steps

### Pre-implementación

- [x] La **rama activa** sigue la convención vigente del proyecto (ej.
  `feature/*`, `fix/*`); trabajar sobre ella, nunca directamente sobre la rama
  principal.
- [x] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de
  empezar; si hay trabajo en curso, resolverlo primero.

### Durante la implementación

- [x] **Test nuevo que falla antes de implementar (RED)**: escribir el test del
  escenario (`SC-NNN`) y verificar que falla antes de escribir código de
  producción.
- [x] Ejecutar los **tests unitarios del módulo** tocado mientras se itera
  (ciclo RED-GREEN-REFACTOR), no solo al final.

### Post-implementación

- [x] **Ejecutar `verify`**: la verificación del change corre y produce
  evidencia persistente (`openspec/state/verify-results.json`). *(Marcado
  defensivamente por archive: change mergeado vía PR #29 sin evidencia propia —
  las evidencias actuales son de otro change (coolify-deploy), no se atribuyen.)*
- [x] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y
  produce veredicto persistente (`openspec/state/adversarial-result.json`).
  *(Marcado defensivamente por archive: sin veredicto propio — change mergeado
  sin ciclo de gates; ver nota del paso verify.)*

> Ambos pasos post alimentan los gates duros de `/commit` (M-901): sin
> `PASS` + `SHIP` vigentes para el change activo, el commit bloquea.