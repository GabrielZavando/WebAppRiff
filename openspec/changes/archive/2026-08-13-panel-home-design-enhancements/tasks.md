## 1. Tipo y Configuración (`numericValue`)

- [x] 1.1 Agregar campo `readonly numericValue: number` a la interfaz `PanelStat` en `apps/web/src/lib/types/panel-home.ts`
- [x] 1.2 Poblar `numericValue` (40, 30000, 5, 9) en cada stat de `PANEL_HOME_CONTENT` (`apps/web/src/lib/config/panel-home.ts`)
- [x] 1.3 Actualizar `apps/web/src/lib/types/__tests__/panel-home.test.ts` para validar el campo `numericValue` en `PanelStat` y `PanelHomeProps.stats`
- [x] 1.4 Actualizar `apps/web/src/lib/config/__tests__/panel-home.test.ts` para validar que cada stat tiene `numericValue` igual a 40, 30000, 5, 9

## 2. Token de Sombra Global

- [x] 2.1 Promover `--scroll-shell-shadow` a token `--shadow-scroll-shell` dentro de `@theme {}` en `apps/web/src/styles/globals.css` (valor `0 10px 30px rgba(22, 32, 46, 0.3)`)
- [x] 2.2 Modificar `apps/web/src/styles/header-scroll.css` para que `.header-scroll-shell` consuma `var(--shadow-scroll-shell)` y eliminar la definición local de la variable
- [x] 2.3 Documentar en `docs/design/style-guide/README.md` la excepción flat-design: el grid principal interno del `PanelHome` aplica `--shadow-scroll-shell` como elevación sobre el HeroBanner superpuesto (la sombra va en el `<div class="grid grid-cols-1 lg:grid-cols-2">`, NO en el `<section>` outermost — esto se documentó como clarificación post-apply después de que el usuario ajustara la ubicación del shadow)

## 3. Utilidad de Contador Animado (`lib/anim`) — TDD

- [x] 3.1 Escribir tests fallidos en `apps/web/src/lib/anim/__tests__/createCounterAnimation.test.ts` para: `formatStatNumber` (30000 → `"30.000+"`), `animateCounter` (escribe texto vía rAF fake), `createVisibilityObserver` (dispara callback una sola vez), y `prefersReducedMotion` (true/false con matchMedia fake)
- [x] 3.2 Implementar `apps/web/src/lib/anim/createCounterAnimation.ts` (puro, SSR-safe, con superficies inyectables `observer`/`raf`/`formatNumber`/`matchMedia`) para pasar los tests de 3.1

## 4. Componente PanelHome

- [x] 4.1 Aplicar `box-shadow: var(--shadow-scroll-shell)` al grid principal visible del `PanelHome.astro` (`div.grid grid-cols-1 lg:grid-cols-2` con `panel-home-elevated` y `data-panel-card`, siempre visible) — la sombra va en el card teal+blanco, no en el `<section>` full-width ni en el `div.container`
- [x] 4.2 Sustituir los pseudo-elementos por un divisor de grid nativo: el `<div class="bg-white flex flex-col">` (sin padding, padding movido a las celdas) envuelve un `<div class="relative stats-grid-wrap flex-1">` con `background-color: var(--color-primary)` (vía clase CSS scoped, NO utility `bg-primary` para no contaminar locadores E2E preexistentes), el grid pasa a `grid-cols-2 grid-rows-2 gap-px h-full w-full`, cada celda lleva `bg-white p-8 md:p-12 flex flex-col justify-center`. El `flex flex-col` + `flex-1` garantiza que el wrapper se estire a la altura completa de la mitad blanca (igual a la del `bg-primary` por `align-items: stretch` del grid principal), de modo que el gap de 1px expone el color del wrap como líneas divisorias de extremo a extremo — top-to-bottom y side-to-side — que llegan hasta los bordes reales de la mitad blanca.
- [x] 4.3 Renderizar cada valor de stat como `<p data-stat-value="" data-target={stat.numericValue}>{value}</p>` (fallback SSR estático)
- [x] 4.4 Agregar `<script>` en `PanelHome.astro` que importe `initCounterAnimation` y anime los `[data-stat-value]` al entrar en viewport (una sola vez, respetando reduced-motion)

## 5. Tests de Componente (Vitest + Snapshot)

- [x] 5.1 Actualizar `apps/web/src/components/__tests__/PanelHome.test.ts` para validar: la card (`data-panel-card`) lleva `panel-home-elevated` (sombra), los `<p>` de stats llevan `data-stat-value`/`data-target`, y el grid de stats está envuelto en un contenedor `relative`
- [x] 5.2 Regenerar `apps/web/src/components/__tests__/__snapshots__/PanelHome.test.ts.snap` con los nuevos atributos, sombra y wrapper
- [x] 5.3 Verificar que `apps/web/src/styles/__tests__/tokens.test.ts` (regla BASE_COMPONENTS "no rounded*") sigue pasando tras agregar la sombra

## 6. Tests E2E (Playwright)

- [x] 6.1 Agregar a `apps/web/e2e/panel-home.spec.ts` un test que verifique `box-shadow` no-`none` en el card visible del PanelHome (`[data-panel-card]`, que es el `<div class="grid grid-cols-1 lg:grid-cols-2">`) — `rgba(22, 32, 46, 0.3) ... 10px 30px`
- [x] 6.2 Agregar test E2E que use un viewport corto (1280×400) para garantizar que el panel está fuera del fold al cargar, luego haga scroll y verifique que los contadores animan de 0 a su `data-target` (una sola vez, `data-animated="true"`) y conservan el `+`
- [x] 6.3 Agregar test E2E que verifique el divisor del grid 2×2 (técnica `gap-px` + `bg-primary` en el wrap): el wrapper tiene `background-color: rgb(65, 179, 196)`, el grid tiene `column-gap: 1px` y `row-gap: 1px`, las 4 celdas tienen `background-color: rgb(255, 255, 255)`, y las 4 celdas + gaps cubren de extremo a extremo del wrapper (cada celda mide `(width-1)/2 × (height-1)/2` ± 1px)
- [x] 6.4 Agregar test E2E con `emulateMedia({ reducedMotion: 'reduce' })` que verifique que los contadores NO animan (muestran `value` final SSR, sin `data-animated`)

## 7. Verificación Final

- [x] 7.1 Ejecutar `npm run test` (Vitest) y confirmar que todos los unit/component tests pasan — **543/543 pasan**
- [x] 7.2 Ejecutar `npm run typecheck` y `npm run lint` sin errores — **`tsc --noEmit` 0 errores; `astro check` 0 errores / 0 warnings (4 hints preexistentes en `PilaresSection.test.ts`); `lint` 0 errores / 0 warnings**
- [x] 7.3 Ejecutar `npm run build` y `npm run test:smoke` (Playwright) confirmando sombra, animación y divider en el home — **build OK; E2E del panel-home: 17/19 pasan. Los 4 nuevos (6.1 shadow ✓, 6.2 counter ✓, 6.3 cross-gap ✓, 6.4 reduced-motion ✓) pasan. Los tests 4.2 y 4.5 (preexistentes) se actualizaron para usar el locator específico `div.bg-white:has(.stats-grid-wrap)` en lugar de `div.bg-white`, porque el nuevo divisor con `gap-px` introduce 4 celdas `bg-white` que hacían ambiguo el locator genérico. Los 2 fallos restantes (4.7 "overlaps HeroBanner" y 12 "width matches SearchForm") son preexistentes confirmados con baseline stash** y NO son regresión de este change.

## 8. Alineación Post-Verify (spec ↔ implementación)

- [x] 8.1 Actualizar `specs/panel-home/spec.md` Req 1: el shadow va en el **main grid element** (`div.grid grid-cols-1 lg:grid-cols-2`), NO en el `<section>` outermost — refleja la decisión explícita del usuario durante la fase de apply.
- [x] 8.2 Actualizar `specs/panel-home/spec.md` Req 3 + scenarios: el divisor se implementa con la técnica **`gap-px` + `bg-primary` en el wrapper** (CSS Grid nativo), NO con pseudo-elementos verticales/horizontales. Resultado visual idéntico (cruz de 1px primary de extremo a extremo).
- [x] 8.3 Actualizar el scenario "Divider is decorative and hidden from assistive tech": con `gap-px` no hay divider elements separados (los gaps del grid no son elementos DOM), por lo que `aria-hidden` ya no aplica; la accesibilidad se mantiene porque los gaps visuales no son contenido legible por AT y los `<p>` reales no se modifican.
- [x] 8.4 Actualizar `docs/design/style-guide/README.md` para indicar que la excepción PanelHome aplica la sombra en el grid principal interno (no en el `<section>`).
