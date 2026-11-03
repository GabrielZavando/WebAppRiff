## 1. Footer — Scroll to Top a la derecha de "SANTIAGO, CHILE" (xl:)

- [x] 1.1 En `apps/web/src/components/Footer.astro` (líneas ~151-161), invertir el orden de nodos dentro del `<div class="flex items-center gap-4">` de la barra inferior: renderizar `<span>{FOOTER_LOCATION}</span>` primero y `<button data-scroll-top>` segundo, de modo que el botón quede a la derecha de la ubicación.
- [x] 1.2 Verificar que el contenedor padre conserve `justify-between` y `sm:pr-24` (los FAB flotantes no cubren el grupo).

## 2. PanelHome — caja flotante sube 5rem en xl:

- [x] 2.1 En `apps/web/src/components/PanelHome.astro` (línea ~53), cambiar `class="relative lg:mt-20 z-10"` por `class="relative lg:mt-20 xl:-mt-20 z-10"` en la `<section data-panel-home>`.
- [x] 2.2 Verificar que `lg:mt-20` se conserva (desplaza hacia abajo en `lg:`) y `xl:-mt-20` sube 5rem en `xl:` y superiores, con `relative` y `z-10` intactos.

## 3. Página de Inicio — 3 secciones a 4 columnas en xl:

- [x] 3.1 En `apps/web/src/components/SolutionSection.astro` (línea ~58), añadir `xl:grid-cols-4` a `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8`.
- [x] 3.2 En `apps/web/src/components/ServicesSection.astro` (línea ~71), añadir `xl:grid-cols-4` a `grid grid-cols-1 sm:grid-cols-2 gap-6`.
- [x] 3.3 En `apps/web/src/components/DestacadosSection.astro` (línea ~63), añadir `xl:grid-cols-4` a `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8`.
- [x] 3.4 Verificar que en `lg:` se mantiene 2 columnas y en `xl:` las 4 tarjetas quedan en una fila en cada sección.

## 4. Página de Nosotros — pilares y sectores a 4 columnas en xl:

- [x] 4.1 En `apps/web/src/components/NosotrosValueProp.astro` (línea ~70), añadir `xl:grid-cols-4` a `grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2` (pilares, "¿Qué nos define?").
- [x] 4.2 En `apps/web/src/components/NosotrosValueProp.astro` (línea ~105), añadir `xl:grid-cols-4` a `grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2` (sectores, "Presencia Sólida en Industrias Críticas").
- [x] 4.3 Verificar 4 columnas en `xl:` y 2 en `lg:` para ambas grids.

## 5. Página de Servicios — 2 secciones a 4 columnas en xl:

- [x] 5.1 En `apps/web/src/components/ServiciosPortafolioSection.astro` (línea ~24), convertir `<div class="border border-border bg-white divide-y divide-border">` (lista vertical) a un grid `grid-cols-1 xl:grid-cols-4 gap-...`, eliminando `divide-y` (cada tarjeta tiene su propio borde).
- [x] 5.2 En `apps/web/src/components/ServiciosTerrenoSection.astro` (línea ~28), añadir `xl:grid-cols-4` a `grid grid-cols-1 lg:grid-cols-2 gap-12`.
- [x] 5.3 Verificar que cada `SolucionPortafolioCard` conserva `id` de ancla y `scroll-mt-*`, y que en `xl:` ambas secciones muestran 4 columnas.

## 6. Página de Representaciones — marcas 3 columnas, pilares 4 columnas en xl:

- [x] 6.1 En `apps/web/src/pages/representaciones.astro` (líneas ~54-60), convertir `<div class="flex flex-col gap-4">` que envuelve las tarjetas de marca a `<div class="grid grid-cols-1 xl:grid-cols-3 gap-8">`.
- [x] 6.2 En `apps/web/src/pages/representaciones.astro` (línea ~112), añadir `xl:grid-cols-4` a `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6` (pilares de valor).
- [x] 6.3 Verificar 3 columnas de marcas y 4 columnas de pilares en `xl:`.

## 7. Tests y snapshots afectados

- [x] 7.1 En `apps/web/src/components/__tests__/Footer.test.ts` (líneas ~296-303), cambiar la afirmación de orden: el botón `[data-scroll-top]` debe aparecer *después* de "SANTIAGO, CHILE" (índice mayor), no antes.
- [x] 7.2 En `apps/web/src/components/__tests__/PanelHome.test.ts` (líneas ~42-58), ajustar la afirmación de offset para permitir `xl:-mt-20` mientras se sigue ausentando `lg:mt-2` y `md:-mt-2` como clases exactas.
- [x] 7.3 Regenerar snapshots afectados con `vitest --update`: `Footer.test.ts.snap`, `PanelHome.test.ts.snap`, `DestacadosSection.test.ts.snap`, `SolutionSection.test.ts.snap`, `ServicesSection.test.ts.snap` (y cualquier otro que capture las clases cambiadas).
- [x] 7.4 Ejecutar `make test` (vitest) y `make lint` para confirmar que no hay regresiones ni tests rotos.
