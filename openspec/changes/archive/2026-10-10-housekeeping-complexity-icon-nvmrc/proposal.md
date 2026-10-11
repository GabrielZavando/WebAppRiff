# Proposal: Housekeeping técnico — complejidad ciclomática + warning astro-icon + .nvmrc

## Why

La deuda técnica acumulada en `apps/web` degrada la señal del lint y del build:
dos funciones superan el límite de complejidad ciclomática de ESLint (≤10) y
emiten 2 warnings en cada pasada, y astro-icon emite un warning en cada build
porque no existe la carpeta local de iconos que busca por defecto (`src/icons/`).
Silenciar estas señales evita que warnings reales pasen desapercibidos.

## What Changes

- **Refactor de complejidad ciclomática** (sin cambio de comportamiento
  observable):
  - `apps/web/src/lib/products/buildProductsPageHref.ts` —
    `buildProductsPageHref` baja de complejidad **13 → ≤10**.
  - `apps/web/src/lib/products/parseProductsPageFilters.ts` —
    `parseProductsPageFilters` baja de complejidad **12 → ≤10**.
  - Los tests existentes de ambas funciones deben pasar **sin modificaciones**
    (tocarlos sería señal de que el refactor cambió comportamiento).
- **Silenciar warning de astro-icon**: crear `apps/web/src/icons/` con un
  `.gitkeep` y un README mínimo aclarando que no hay iconos locales (todo viene
  de `@iconify-json/lucide` y `@iconify-json/simple-icons`). La alternativa de
  apuntar `iconDir` a una ruta inexistente fue descartada tras verificar el
  código de astro-icon v1.2.0 (ver design.md).
- **`.nvmrc`**: verificado que **ya existe** en la raíz del repo con contenido
  `24` (commit `a6e2f42`). Ítem sin trabajo pendiente; solo verificación.

Un solo ciclo de trabajo, una rama, un solo commit con los tres puntos.

## Capabilities

### New Capabilities

Ninguna. Este change no introduce capacidades de producto.

### Modified Capabilities

Ninguna. Ninguno de los tres ítems modifica comportamiento observable del
producto ni requisitos de specs existentes: son refactor interno (mismo
contrato público y mismas salidas, cubiertos por los tests actuales), ajuste de
build output (desaparición de un warning) y tooling ya existente en el repo.

## Impact

- **Código**: `apps/web/src/lib/products/buildProductsPageHref.ts` y
  `apps/web/src/lib/products/parseProductsPageFilters.ts` (refactor interno;
  firmas públicas exportadas sin cambios). Helpers privados nuevos en los
  mismos módulos.
- **Tests**: `apps/web/src/lib/products/__tests__/buildProductsPageHref.test.ts`
  y `parseProductsPageFilters.test.ts` — se ejecutan intactos como red de
  seguridad; no se modifican.
- **Build output**: `npm run build --workspace=apps/web` deja de emitir
  `[astro-icon] Failed to load icons from "src/icons"`.
- **Archivos nuevos**: `apps/web/src/icons/.gitkeep` + `apps/web/src/icons/README.md`.
- **Sin cambios**: dependencias (`package.json`), `engines.node`, `astro.config.mjs`,
  configs de ESLint (el umbral `complexity: 10` se mantiene), specs de producto.
