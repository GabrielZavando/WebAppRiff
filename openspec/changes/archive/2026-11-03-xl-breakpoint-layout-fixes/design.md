# xl-breakpoint-layout — Design

## Context

El sitio público (`apps/web`, Astro SSG) ya aplica ajustes de layout en el breakpoint `lg:` (1024px) a través de la capacidad archivada `lg-breakpoint-layout`, pero el breakpoint `xl:` (1280px+) no tiene ajustes propios. En pantallas anchas (> 1280px) ocurren dos problemas: (1) el botón "Scroll to Top" del footer queda a la izquierda de "SANTIAGO, CHILE" en lugar de a la derecha, y (2) varias grids de tarjetas se estancan en 2 columnas (`lg:grid-cols-2`) dejando espacio vacío a la derecha. Adicionalmente, el bloque flotante de estadísticas del home (`PanelHome`) usa `lg:mt-20` (desplaza hacia abajo) en todos los breakpoints >= lg, cuando en `xl:` debería subir (`xl:-mt-20`) para superponerse al banner.

El cambio afecta múltiples componentes y páginas (footer, home, nosotros, servicios, representaciones) de forma transversal, sin tocar APIs, contratos de datos ni dependencias.

## Goals / Non-Goals

**Goals:**
- Aplicar ajustes de layout exclusivamente en el breakpoint `xl:` (>= 1280px) usando clases utilitarias de Tailwind (`xl:-mt-20`, `xl:grid-cols-4`, `xl:grid-cols-3`).
- Preservar el comportamiento de `sm`, `md` y `lg:` sin modificaciones.
- No romper snapshots sin actualización consciente; actualizar tests y snapshots afectados como parte del change.
- Mantener componentes "dumb" (sin lógica nueva) y la jerarquía de headings existente.

**Non-Goals:**
- Cambiar breakpoints menores (`sm`, `md`, `lg`).
- Modificar APIs, endpoints, contratos de datos ni configuración de Firestore.
- Rediseñar la estructura visual de las tarjetas (solo cantidad de columnas y posición del botón del footer).
- Introducir nuevas dependencias de npm.

## Decisions

### D1 — Usar clases `xl:*` apiladas sobre las existentes `lg:*`/`sm:*` (no reemplazar)
Tailwind es mobile-first; `xl:` solo aplica en >= 1280px y anula la clase del breakpoint anterior cuando coinciden. Se añade `xl:grid-cols-4` junto a `lg:grid-cols-2` (y `xl:-mt-20` junto a `lg:mt-20`) en vez de cambiar `lg:` a 4 columnas, para no afectar pantallas entre 1024px y 1279px.
- Alternativa considerada: cambiar `lg:grid-cols-2` a `lg:grid-cols-4`. Rechazada porque afectaría el rango 1024–1279px donde 2 columnas es el comportamiento deseado y aprobado.

### D2 — Footer: invertir orden de nodos en el DOM, no usar `flex-row-reverse`
En `Footer.astro` se intercambia el orden de `<span>{FOOTER_LOCATION}</span>` y `<button data-scroll-top>` dentro del `<div class="flex items-center gap-4">` (ubicación primero, botón segundo). Con `justify-between` del contenedor padre y el copyright a la izquierda, el botón queda como el elemento más a la derecha, es decir, a la derecha de "SANTIAGO, CHILE".
- Alternativa considerada: `flex-row-reverse`. Rechazada porque invierte también el gap y no expresa la intención semántica (ubicación, luego acción).

### D3 — PanelHome: `xl:mt-4` no elimina `lg:mt-20`
La sección `<section data-panel-home>` lleva `relative lg:mt-20 xl:mt-4 z-10`. En `lg:` aplica `lg:mt-20` (hacia abajo); en `xl:` gana `xl:mt-4` (hacia abajo 1rem, menos desplazamiento que `lg:`). No se usa `md:-mt-2` ni se elimina `lg:mt-20`, respetando el acuerdo SC-005 del change `panel-home`.

### D4 — Servicios sección 1 (Portafolio): convertir lista vertical a grid en `xl:`
`ServiciosPortafolioSection.astro` envuelve las tarjetas en `<div class="border border-border bg-white divide-y divide-border">` (lista apilada con divisores horizontales). Para 4 columnas en `xl:` se cambia el contenedor a un grid `grid-cols-1 xl:grid-cols-4 gap-...`, eliminando `divide-y` (las tarjetas ya llevan su propio borde `border`). El `SolucionPortafolioCard` conserva `id` y `scroll-mt-*`.

### D5 — Representaciones marcas: convertir `flex flex-col` a grid `xl:grid-cols-3`
El contenedor de marcas en `representaciones.astro` es `<div class="flex flex-col gap-4">`. En `xl:` pasa a `<div class="grid grid-cols-1 xl:grid-cols-3 gap-8">`. Cada `RepresentacionBrandCard` es `flex flex-col md:flex-row` y se adapta al ancho de columna sin cambios internos.

## Risks / Trade-offs

- [Risk] El test `Footer.test.ts` afirma que el botón está *antes* de la ubicación (línea ~296). → Mitigación: actualizar la afirmación a "después de" y regenerar el snapshot `Footer.test.ts.snap`.
- [Risk] El test `PanelHome.test.ts` ausenta `-mt-2` y `lg:mt-2` (línea ~42-58). `xl:-mt-20` contiene el substring `-mt-2`, lo que haría fallar `expect(section).not.toContain('-mt-2')`. → Mitigación: ajustar la afirmación para permitir `xl:-mt-20` mientras se sigue ausentando `lg:mt-2` y `md:-mt-2` como clases exactas; regenerar `PanelHome.test.ts.snap`.
- [Risk] Los snapshots de `DestacadosSection`, `SolutionSection` y `ServicesSection` cambian al agregar `xl:grid-cols-4`. → Mitigación: regenerar snapshots afectados.
- [Trade-off] Servicios sección 1 pierde los divisores horizontales (`divide-y`) al pasar a grid. Es aceptable porque cada tarjeta tiene su propio borde `border`.

## Migration Plan

1. Crear artefactos OpenSpec (proposal, specs, design, tasks).
2. Aplicar cambios de clases de Tailwind en los 9 archivos fuente identificados.
3. Actualizar `Footer.test.ts` (orden botón/ubicación) y `PanelHome.test.ts` (offset `xl:-mt-20`).
4. Regenerar snapshots afectados (`vitest --update`).
5. Ejecutar `make test` y `make lint`; verificar que no haya regresiones visuales.
6. No hay migración de datos ni rollback de esquema; el rollback es revertir el commit del change.

## Open Questions

- Ninguna por ahora; todas las clases objetivo se confirmaron inspeccionando el source actual.
