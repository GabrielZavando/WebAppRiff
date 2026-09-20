# Tasks — cap-logo-shrink

## Task 02 — Ajuste CSS del estado compacto desktop (GREEN) ✅ COMPLETADA
- Prioridad: alta
- Capa: dumb (presentacional, CSS puro)
- Estimación: XS
- Suggested Path: apps/web/src/styles/header-scroll.css
- Test Path: apps/web/e2e/site-header-scroll.spec.ts
- Subtareas:
  1. Con el E2E del Task 01 fallando (RED confirmado), ajustar la regla dentro de `@media (min-width: 640px)` para `body[data-scrolled='true'] .site-logo` de modo que el alto renderizado sea ≥ 100px con ancho automático.
  2. Implementación de referencia (el implementador puede ajustar, pero el contrato es el alto): reemplazar el enfoque `max-width: 200px` por uno basado en alto (p.ej. `height: 100px; width: auto;` / `max-width: none`), dado que `h-auto w-full max-w-[200px]` de header-scroll + clases utilitarias produciría conflicto de aspecto si solo se sumara `min-height` (el ancho quedaría fijo en 200px y la imagen se distorsionaría).
  3. Documentar en comentario el mínimo de 100px y la equivalencia de aspect ratio (asset 330×134 → 100px de alto ≈ 246px de ancho), según R5.
  4. Verificar que la regla mobile (150px) fuera del media query no cambia (R3) y que el bloque `prefers-reduced-motion` ya existente sigue cubriendo `.site-logo` (R4).
  5. Re-ejecutar el spec E2E completo del header-scroll: desktop nuevo assert en verde y mobile existente en verde.
  6. **Fix adversarial F1**: el contrato SC-001/R1 exige ≥100px en todo el rango ≥640px, pero `max-h-full` (capping hasta `lg`) lo incumplía en 640–1023px (logo ~80px). Se levantó el cap a `sm:max-h-none` en `apps/web/src/components/Header.astro` y se agregó cobertura E2E `[SC-001]` en la banda (viewport 800px) que lo blinda.

## Task 03 — Revisión de tests colaterales y verificación visual ✅ COMPLETADA (tests colaterales en verde; verificación visual manual pendiente del usuario en navegador)
- Prioridad: media
- Capa: dumb
- Estimación: XS
- Suggested Path: apps/web/src/styles/header-scroll.css (no aplica si no hay cambios adicionales)
- Test Path: apps/web/e2e/site-header.spec.ts, apps/web/e2e/site-header-scroll.spec.ts
- Subtareas:
  1. Revisar `apps/web/e2e/site-header.spec.ts`: el test "at the top" (sin scroll) asserta `max-width: 300px` — debe seguir en verde (R2); ajustar solo si el cambio CSS lo afectó.
  2. Ejecutar la suite E2E de header completa (`site-header-scroll.spec.ts` + `site-header.spec.ts`) y, si es razonable, la suite E2E de apps/web.
  3. Verificación visual manual en desktop: el logo reducido (~100px alto) puede desbordar levemente el header container (h-24 = 96px) con `overflow-visible` — patrón ya existente para el logo 2x; confirmar que no hay crecimiento del header ni CLS brusco.
  4. Confirmar que el dump de CSS no introduce hex crudos ni valores mágicos sin comentario.

## Mandatory Steps

> Contenido obligatorio inyectado desde docs/openspec-tasks-mandatory-steps.md (leído en momento de generación).

### Pre-implementación

Antes de escribir la primera línea de la tarea actual:

- [x] La **rama activa** sigue la convención vigente del proyecto (ej. `feature/*`, `fix/*`); trabajar sobre ella, nunca directamente sobre la rama principal.
- [x] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de empezar; si hay trabajo en curso, resolverlo primero.

### Durante la implementación

- [x] **Test nuevo que falla antes de implementar (RED)**: escribir el test del escenario (`SC-NNN`) y verificar que falla antes de escribir código de producción.
- [x] Ejecutar los **tests unitarios del módulo** tocado mientras se itera (ciclo RED-GREEN-REFACTOR), no solo al final.

### Post-implementación

Antes de dar la tarea por cerrada:

- [x] **Ejecutar `verify`**: la verificación del change corre y produce evidencia persistente (`openspec/state/verify-results.json`).
- [x] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y produce veredicto persistente (`openspec/state/adversarial-result.json`).

> Ambos pasos post alimentan los gates duros de `/commit` (M-901): sin `PASS` + `SHIP` vigentes para el change activo, el commit bloquea.
