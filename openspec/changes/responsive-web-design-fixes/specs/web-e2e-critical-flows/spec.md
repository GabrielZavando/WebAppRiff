# web-e2e-critical-flows Specification

## MODIFIED Requirements

### Requirement: Landing E2E suite remains green after removing top-header
The 7 remaining Playwright landing specs in `apps/web/e2e/` (hero-banner, site-header, site-header-scroll, search-form, panel-home, services-section, solution-section) plus the new `phone-fab.spec.ts` and the new `responsive-layout.spec.ts` SHALL continue to pass with the stub API present in the webServer.

#### Scenario: Landing specs pass with stub
- **WHEN** `npx playwright test --project=chromium` is executed with the stub API running
- **THEN** all 7 existing landing specs pass (no failures)
- **AND** `phone-fab.spec.ts` passes and asserts the phone FAB link, position and accessible name
- **AND** `responsive-layout.spec.ts` passes and asserts the absence of horizontal overflow on the supported viewport matrix
- **AND** `top-header.spec.ts` does not exist in the suite

## ADDED Requirements

### Requirement: Playwright suite covers a responsive viewport matrix

El workspace `apps/web` SHALL incluir un spec Playwright (`apps/web/e2e/responsive-layout.spec.ts`) que recorra la matriz de viewports `320×568`, `375×667`, `568×320`, `768×1024`, `1024×768`, `1204×800` y `1280×800` sobre las páginas representativas (`/`, `/productos`, `/productos?view=list`, `/productos/{slug}` y `/representaciones`), verificando en cada viewport que no exista scroll horizontal y que los elementos corregidos (titulares, estadísticas, imagen y CTAs de la tarjeta en vista lista, grupo sticky) queden contenidos dentro de su contenedor.

#### Scenario: La matriz de viewports está parametrizada

- **WHEN** se inspecciona `apps/web/e2e/responsive-layout.spec.ts`
- **THEN** el spec declara una tabla de viewports que incluye al menos `320×568`, `375×667`, `568×320`, `1024×768`, `1204×800` y `1280×800`
- **AND** los viewports se aplican con `page.setViewportSize(...)`

#### Scenario: Aserción de ausencia de scroll horizontal

- **WHEN** el spec evalúa la invariante de scroll horizontal
- **THEN** compara `document.documentElement.scrollWidth` contra `document.documentElement.clientWidth` con una tolerancia de 1px
- **AND** falla el test cuando la diferencia es mayor que la tolerancia

#### Scenario: El spec corre dentro del smoke suite

- **WHEN** se ejecuta `npm run test:smoke` en el workspace `apps/web`
- **THEN** el spec `responsive-layout.spec.ts` se incluye en la ejecución (`playwright test --project=chromium`)

#### Scenario: Aserciones de contención por elemento

- **WHEN** el spec recorre la matriz de viewports
- **THEN** verifica que el `boundingBox` del `<h1>` del home queda dentro del viewport
- **AND** verifica que el `boundingBox` del valor `30.000+` del panel home queda dentro de su celda
- **AND** verifica que el `boundingBox` del `<h1>` del detalle de producto queda dentro de su columna
- **AND** verifica que el ancho de la tarjeta del catálogo en vista lista no supera el ancho de su contenedor
- **AND** verifica que la altura del grupo sticky en `568×320` no supera el 50% de la altura del viewport
