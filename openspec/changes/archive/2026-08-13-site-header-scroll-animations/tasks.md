## 1. Scroll state logic (lib)

- [x] 1.1 Crear `apps/web/src/lib/scroll/createHeaderScrollState.ts` con `shouldBeCompact(scrollY: number, threshold = 0): boolean` (pura) y `initHeaderScrollState({ threshold?, target? })` que escucha `scroll` pasivo con `requestAnimationFrame` y togglea `data-scrolled` en `document.body` (o target), devolviendo cleanup
- [x] 1.2 Test Vitest `createHeaderScrollState.test.ts`: `shouldBeCompact(0) === false`, `shouldBeCompact(1) === true`, `shouldBeCompact(3, 4) === false`, `shouldBeCompact(5, 4) === true`
- [x] 1.3 Test Vitest: `initHeaderScrollState` con target mock aplica `data-scrolled="false"` en estado inicial (scrollY 0) y `"true"` tras disparar scroll con `scrollY > 0`

## 2. Compact scroll styles (CSS)

- [x] 2.1 Crear `apps/web/src/styles/header-scroll.css` con reglas `body[data-scrolled="true"]` para `.site-header::after` (overlay navy opacity 0→1), `.site-search` (background-color), `.site-logo` (max-width 66px / 100px sm) y `transition` 300ms ease-in-out
- [x] 2.2 Añadir bloque `@media (prefers-reduced-motion: reduce)` que desactiva las transiciones
- [x] 2.3 Importar `header-scroll.css` en `apps/web/src/styles/globals.css` (sin romper tokens ni `@layer`)

## 3. Componentes (TDD)

- [x] 3.1 Test AstroContainer en `Header.test.ts`: el `<header>` lleva clase `site-header` y su contenedor interno `site-header__inner`; la imagen del logo lleva clase `site-logo`
- [x] 3.2 Test AstroContainer en `SearchForm.test.ts`: el wrapper `role="search"` lleva clase `site-search`
- [x] 3.3 Editar `Header.astro`: añadir `site-header` al `<header>`, `site-header__inner` al contenedor interno, `site-logo` a la imagen del logo; eliminar el `TODO[site-header-scroll-animations]`
- [x] 3.4 Editar `SearchForm.astro`: añadir `site-search` al wrapper `role="search"`
- [x] 3.5 Regenerar snapshot de `Header.test.ts` (`vitest -u`) y confirmar que el resto de asserts del header y del search-form siguen pasando

## 4. Integración en Layout

- [x] 4.1 Envolver `<Header/>` + `<SearchForm/>` en `Layout.astro` con `<div class="sticky top-0 z-30">` (TopHeader queda fuera del wrapper)
- [x] 4.2 Añadir `<script>` (bundled, no `is:inline`) en `Layout.astro` que importa `initHeaderScrollState` desde `@/lib/scroll/createHeaderScrollState` e invoca la inicialización
- [x] 4.3 Verificar que el menú mobile sigue por encima: `#mobile-nav` (`z-40`) y toggle (`z-50`) no se ven afectados por el wrapper `z-30`

## 5. Tests E2E (Playwright)

- [x] 5.1 Crear `apps/web/e2e/site-header-scroll.spec.ts`: en desktop (1280×720) y `goto('/')`, al tope el logo computa `max-width` ≈ 300px y `body` no tiene `data-scrolled="true"`
- [x] 5.2 E2E: tras `scrollTo(0, 400)`, `body[data-scrolled="true"]`, logo `max-width` ≈ 100px, SearchForm `background-color` ≈ `rgb(31, 45, 64)`, y el wrapper Header+Search queda sticky con `boundingBox().y` ≈ 0
- [x] 5.3 E2E: al volver a `scrollTo(0, 0)`, `data-scrolled` vuelve a `"false"`, logo `max-width` ≈ 300px y fondos revierten
- [x] 5.4 E2E: en mobile (375×667) el logo compacto computa `max-width` ≈ 66px y el menú mobile sigue abriéndose sobre el header compacto

## 6. Verificación y archive

- [x] 6.1 `npm run typecheck --workspace=apps/web` → success (0 errores)
- [x] 6.2 `npm run lint --workspace=apps/web` → success
- [x] 6.3 `npm run test --workspace=apps/web` → all pass (529 tests unit + AstroContainer + snapshot)
- [x] 6.4 `npm run test:smoke --workspace=apps/web` → `site-header-scroll.spec.ts` (4) y `site-header.spec.ts` (mobile) pass. NOTA: el suite completo tiene 13 fallos PREEXISTENTES en `hero-banner`/`panel-home`/`search-form`(860px)/`services-section`/`solution-section` (404 de imágenes y conteos de headings), verificados como fallos previos al cambio mediante `git stash -u`; no son regresión de este change.
- [x] 6.5 `npm run build --workspace=apps/web` → success
- [x] 6.6 `openspec validate site-header-scroll-animations` → valid
- [x] 6.7 `openspec status --change site-header-scroll-animations --json` → todos los artefactos completos

## 7. Ajuste de tamaño del logo compacto (feedback de negocio)

- [x] 7.1 Actualizar `apps/web/e2e/site-header-scroll.spec.ts`: expectativas de logo a 200px (scroll desktop) y 150px (scroll mobile) — el test falla contra el CSS actual (100/66)
- [x] 7.2 Actualizar `apps/web/src/styles/header-scroll.css`: `body[data-scrolled="true"] .site-logo` → `max-width: 150px` (base) y `@media (min-width:640px)` → `max-width: 200px`
- [x] 7.3 Ejecutar `npm run test` (vitest) y el E2E `site-header-scroll.spec.ts` → pass
- [x] 7.4 `openspec validate site-header-scroll-animations` → valid

## 8. Box-shadow en el conjunto sticky al hacer scroll

- [x] 8.1 Añadir clase `header-scroll-shell` al wrapper sticky en `apps/web/src/layouts/Layout.astro` (para poder apuntarlo como "el conjunto" que cambia de color)
- [x] 8.2 Actualizar `apps/web/e2e/site-header-scroll.spec.ts`: assert que el wrapper tiene `box-shadow` distinto de `none` en estado compacto y `none` al volver a `scrollTop === 0` (test falla contra el CSS actual, que no define sombra)
- [x] 8.3 Añadir en `apps/web/src/styles/header-scroll.css`: `body[data-scrolled='true'] .header-scroll-shell { box-shadow: var(--scroll-shell-shadow); }` (variable local `0 10px 30px rgba(22, 32, 46, 0.3)`, más visible que `--shadow-4`) con `transition: box-shadow 300ms ease-in-out` en `.header-scroll-shell`
- [x] 8.4 Ejecutar `npm run test` (vitest) y el E2E `site-header-scroll.spec.ts` → pass
- [x] 8.5 `openspec validate site-header-scroll-animations` → valid
