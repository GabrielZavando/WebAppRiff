## Why

La base móvil (< 640px) del chrome público (Header, Buscador y Hero) presenta problemas de espaciado y composición: el logo queda pegado al borde superior, se encoge al hacer scroll, el botón del buscador cae en una fila separada del input y los CTAs del hero ocupan todo el ancho. Unificar el comportamiento mobile-first mejora la legibilidad, el aprovechamiento del espacio y la consistencia visual sin tocar la lógica de scroll que ya funciona.

## What Changes

- **Header (móvil)**: logo alineado a la izquierda y centrado verticalmente. Se elimina el `pb-4` (16px reales) y se redistribuye como `py-2` (8px arriba/abajo) para despegar el logo del borde superior. El botón hamburguesa se recentra verticalmente (`top-5`).
- **Logo**: tamaño fijo en todos los breakpoints. Se eliminan los shrink de scroll móvil (160px → 150px) y desktop (100px de alto) de `header-scroll.css`.
- **Buscador (móvil < 640px)**: input y botón quedan pegados en una misma fila sin gap de columna (`grid-cols-[minmax(0,1fr)_auto]`). El botón muestra solo el ícono de lupa con `aria-label="BUSCAR"`. Desde `sm:` se restaura el texto y el diseño actual.
- **Hero (móvil)**: cada CTA ocupa `w-1/2`, apilados verticalmente (`flex-col`) y alineados a la izquierda. Desde `sm:` se restaura la fila horizontal actual.
- **Sticky (fix post-apply)**: el header y el buscador deben quedar fijos al hacer scroll. El wrapper sticky existía, pero `overflow-x: hidden` en `<html>`/`<body>` lo rompía en navegadores que tratan el eje horizontal oculto como un contenedor de scroll. Se cambia a `overflow-x: clip` (sin contenedor de scroll) manteniendo el recorte horizontal.
- **Menú móvil (fix post-apply)**: el botón hamburguesa dejaba de responder tras una navegación interna porque su listener se enlazaba una sola vez. El script del header se vuelve a inicializar en `astro:page-load` de forma idempotente.
- **Sin cambios**: el cambio de color por `data-scrolled`, la sombra del shell y el script `createHeaderScrollState.ts` se mantienen tal cual.
- **Tests**: se actualizan unit tests, snapshots y e2e afectados para reflejar el nuevo contrato mobile-first.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `site-header`: alineación/espaciado vertical del logo, distribución del padding del header en móvil y persistencia del menú hamburguesa a través de View Transitions.
- `site-header-scroll`: se retira el requisito de encogimiento del logo al hacer scroll; sticky, color, sombra y revert se mantienen.
- `search-form`: layout móvil del input + botón pegado, botón solo ícono con nombre accesible, y restauración del diseño desde `sm:`.
- `hero-banner`: layout móvil de CTAs al 50% apilados a la izquierda, con restauración horizontal desde `sm:`.
- `responsive-layout`: se actualiza el escenario de comportamiento vertical en portrait para reflejar el buscador en dos filas y el nuevo padding del header, manteniendo el presupuesto de altura en viewports cortos.
- `home-hero-shell`: el recorte horizontal del shell pasa de `overflow-x: hidden` a `overflow-x: clip` para no crear un contenedor de scroll que rompa el sticky.

## Impact

- **Código**: `apps/web/src/components/Header.astro`, `apps/web/src/components/SearchForm.astro`, `apps/web/src/components/HeroBanner.astro`, `apps/web/src/layouts/Layout.astro`, `apps/web/src/styles/header-scroll.css`.
- **Tests**: `apps/web/src/components/__tests__/Header.test.ts`, `SearchForm.test.ts`, `HeroBanner.test.ts`, `apps/web/src/layouts/__tests__/Layout.test.ts`, snapshots de esos componentes, `apps/web/e2e/site-header-scroll.spec.ts`, `apps/web/e2e/search-form.spec.ts`, `apps/web/e2e/hero-banner.spec.ts` y `apps/web/e2e/responsive-layout.spec.ts`.
- **Sin impacto**: API, backend, Firestore, variables de entorno ni dependencias nuevas. El fix usa el evento nativo `astro:page-load` ya disponible con `ClientRouter`.
