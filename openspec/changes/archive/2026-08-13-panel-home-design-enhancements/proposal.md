## Why

El componente `PanelHome` (franja de "about / trust signals" del home) se renderiza hoy de forma estática y plana. El cliente solicitó tres mejoras de diseño y comportamiento para aumentar el impacto visual y la percepción de dinamismo del panel:

1. Aplicar una sombra de elevación (`box-shadow`) a todo el componente, reutilizando el mismo estilo que el header compacto en scroll (`--scroll-shell-shadow`).
2. Animar los cuatro números de estadística (40, 30.000, 5, 9) desde 0 hasta su valor, disparada cuando el usuario hace scroll hacia abajo y el panel entra en el viewport (una sola vez).
3. Adornar el bloque de 4 estadísticas con un divisor en cruz ("+") de 1px en color primario (`#41B3C4` / `--color-primary`) que cruce la caja completa en horizontal y vertical.

## What Changes

- El `<section>` del `PanelHome` recibe una `box-shadow` estática (`0 10px 30px rgba(22, 32, 46, 0.3)`), siempre visible (override intencional de la regla flat-design que prohibía sombras en componentes base).
- Se promueve la variable `--scroll-shell-shadow` de su scope local en `header-scroll.css` a un token global en `globals.css` (`@theme`) para su reutilización.
- Se agrega un campo `numericValue: number` a la interfaz `PanelStat` (valores `40`, `30000`, `5`, `9`), manteniendo `value` como string de display formateado (`"40+"`, `"30.000+"`, etc.).
- Se crea una utilidad pura y SSR-safe `lib/anim/createCounterAnimation.ts` (patrón `lib/scroll/createHeaderScrollState.ts`) que anima contadores 0→target vía `requestAnimationFrame`, disparada por `IntersectionObserver`, una sola vez, respetando `prefers-reduced-motion`.
- `PanelHome.astro` renderiza los valores con atributos `data-stat-value` + `data-target` para el hook del script cliente, y un `<script client:load>` inicializa la animación. El valor estático (`value`) queda como fallback SSR/no-JS.
- El grid de stats se envuelve en un contenedor `relative` y recibe un divisor en cruz "+" (pseudo-elementos `::before`/`::after`, `1px`, color `border-primary`) que cruza la caja completa en ambos ejes.
- Se actualiza la style guide (`docs/design/style-guide/README.md`) documentando la excepción de sombra para `PanelHome`.

## Capabilities

### New Capabilities

_Ninguna. Este cambio modifica la capability existente `panel-home`._

### Modified Capabilities

- `panel-home`: se añaden tres requerimientos (sombra estática de elevación, contadores animados con IntersectionObserver, divisor en cruz "+" en el grid de stats). El resto de requerimientos existentes (layout, contraste, accesibilidad, config) se mantienen.

## Impact

- **Código**: `apps/web/src/components/PanelHome.astro` (sombra, divider, data-attrs, script cliente), `apps/web/src/lib/types/panel-home.ts` (campo `numericValue`), `apps/web/src/lib/config/panel-home.ts` (valores `numericValue`), `apps/web/src/styles/globals.css` (token global `--shadow-scroll-shell`), `apps/web/src/styles/header-scroll.css` (consumir variable global), `apps/web/src/styles/__tests__/tokens.test.ts` (verificar que PanelHome no rompe el test de flat-design), `docs/design/style-guide/README.md` (excepción de sombra).
- **Nuevo módulo**: `apps/web/src/lib/anim/createCounterAnimation.ts` + tests Vitest.
- **Tests**: unit (Vitest) del counter; AstroContainer + snapshot de `PanelHome`; E2E Playwright de sombra, animación y divider; E2E con `prefers-reduced-motion`.
- **Dependencias**: ninguna nueva (IntersectionObserver y requestAnimationFrame son APIs nativas del navegador).
- **API / datos**: sin cambios en `docs/api-spec.yml` ni `docs/data-model.md` (cambio puramente de frontend estático/SSG).
