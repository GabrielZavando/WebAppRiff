## Why

El sitio público Astro (apps/web/) ya cuenta con `TopHeader`, `Header`, `SearchForm` y `HeroBanner` integrados en `Layout.astro` + `index.astro`. La home actual comunica la propuesta de valor del catálogo Riff vía el hero, pero falta la segunda pieza visual de la imagen de referencia `docs/design/components/PanelHome.png`: una franja de "about / trust signals" con dos mitades (copy+CTA sobre fondo teal | grid 2×2 de estadísticas sobre fondo blanco) que se solapa parcialmente sobre el HeroBanner.

Este change entrega el componente presentacional `PanelHome.astro` que renderiza esa franja: eyebrow "DESDE 1979", headline "Más de 40 Años de Liderazgo en la Medición y Control de Fluidos", descripción, CTA "SOLICITAR ASESORÍA TÉCNICA" (navy) a la izquierda, y 4 estadísticas (40+, 30.000+, 5+, 9+) en grid 2×2 a la derecha. Es la quinta pieza de UI real del sitio y materializa el bloque de credibilidad/trust que la imagen de referencia coloca inmediatamente debajo del hero.

## What Changes

- Nuevo componente presentacional `PanelHome.astro` en `apps/web/src/components/` (dumb: recibe todas las props desde la página, sin fetching ni lectura de `import.meta.env`)
- Tipos TypeScript `PanelHomeProps`, `PanelStat`, `PanelCta` en `apps/web/src/lib/types/panel-home.ts`
- Config hardcoded del contenido del panel `PANEL_HOME_CONTENT` en `apps/web/src/lib/config/panel-home.ts` (mismo patrón que `HERO_BANNER_CONTENT`, `NAVIGATION_ITEMS` y `CATEGORY_OPTIONS`)
- Página `apps/web/src/pages/index.astro` actualizada: añade `<PanelHome {...PANEL_HOME_CONTENT} />` DESPUÉS del `<HeroBanner />` existente, con solapamiento visual parcial (~50% sobre el hero, ~50% debajo) logrado vía negative margin-top y `position: relative` con z-index mayor que el HeroBanner
- Tests Vitest (unit de config + AstroContainer + snapshot) y E2E Playwright (desktop/mobile/accesibilidad/contraste/solapamiento)
- No se modifica `HeroBanner.astro` ni su spec archivada — el solapamiento se implementa enteramente en `PanelHome.astro` y `index.astro`
- No requiere cambios en `docs/api-spec.yml` (el panel no consume API)
- No requiere cambios en `docs/data-model.md` (no hay entidades nuevas)
- No requiere cambios en `Layout.astro` (`PanelHome` se renderiza vía el `<slot />` de `index.astro`, al igual que `HeroBanner`)

## Capabilities

### New Capabilities
- `panel-home`: Franja de "about / trust signals" del home del sitio público, presentacional (dumb), con dos mitades visuales: izquierda con fondo `brand-teal` (eyebrow uppercase + headline + descripción + CTA navy a `/contacto`) y derecha con fondo blanco (grid 2×2 con 4 estadísticas). Se solapa parcialmente sobre el `HeroBanner` existente (~50% dentro del hero, ~50% debajo). Layout responsivo: mobile apilado (teal arriba, blanco abajo); desktop dos columnas lado a lado. El headline del panel es `<h2>` (no introduce un nuevo `<h1>`; el `<h1>` permanente lo aporta el HeroBanner).

### Modified Capabilities
<!-- (ninguna — las specs `hero-banner`, `search-form`, `site-header` y `top-header` no cambian: el PanelHome se renderiza vía el <slot> de index.astro sin tocar sus contratos) -->

## Impact

- `apps/web/src/components/PanelHome.astro` — nuevo componente presentacional (dumb)
- `apps/web/src/lib/types/panel-home.ts` — interfaces TypeScript nuevas (`PanelHomeProps`, `PanelStat`, `PanelCta`)
- `apps/web/src/lib/config/panel-home.ts` — constante `PANEL_HOME_CONTENT` con los 4 stats, copy y CTA
- `apps/web/src/lib/config/__tests__/panel-home.test.ts` — tests unitarios de shape de `PANEL_HOME_CONTENT`
- `apps/web/src/components/__tests__/PanelHome.test.ts` — tests AstroContainer + snapshot
- `apps/web/src/components/__tests__/__snapshots__/PanelHome.test.ts.snap` — snapshot del HTML renderizado
- `apps/web/src/pages/index.astro` — añade `<PanelHome {...PANEL_HOME_CONTENT} />` después del `<HeroBanner />`
- `apps/web/e2e/panel-home.spec.ts` — E2E Playwright nuevos
- No requiere cambios en `apps/web/src/components/HeroBanner.astro` ni en su snapshot existente (el solapamiento se implementa en el PanelHome, no en el HeroBanner)
- No requiere cambios en `apps/web/src/layouts/Layout.astro` (el PanelHome se renderiza vía el `<slot>` de `index.astro`)
- No requiere cambios en `docs/api-spec.yml` (el panel no consume API)
- No requiere cambios en `docs/data-model.md` (no hay entidades nuevas)
