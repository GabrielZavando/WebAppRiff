# Tasks: Housekeeping técnico — complejidad ciclomática + warning astro-icon + .nvmrc

## 1. Preparación y baseline

- [x] 1.1 Crear la rama `chore/housekeeping-complexity-icon-nvmrc` desde `main`.
- [x] 1.2 Capturar baseline: `npm run lint --workspace=apps/web` (2 warnings de complejidad: 13 y 12) y anotar salida para el reporte final.

## 2. Refactor de complejidad — `buildProductsPageHref` (TDD: los tests existentes son la red)

- [x] 2.1 Ejecutar `npm test --workspace=apps/web -- buildProductsPageHref` y confirmar que la suite está verde antes de tocar nada (baseline de comportamiento).
- [x] 2.2 Extraer helper privado `buildProductsPageQuery(...)` (no exportado) en `apps/web/src/lib/products/buildProductsPageHref.ts`, dejando en la función pública solo la normalización de defaults y el ternario final, según design.md D1. Sin cambiar la firma exportada ni añadir dependencias.
- [x] 2.3 Verificar: la suite del paso 2.1 sigue verde SIN modificar ningún test; `npm run lint --workspace=apps/web` ya no emite el warning de `buildProductsPageHref`; registrar complejidad antes/después (13 → ≤10).

## 3. Refactor de complejidad — `parseProductsPageFilters` (TDD: los tests existentes son la red)

- [x] 3.1 Ejecutar `npm test --workspace=apps/web -- parseProductsPageFilters` y confirmar que la suite está verde antes de tocar nada.
- [x] 3.2 Extraer helpers privados `parseTrimmedText(...)` y `parsePositiveInt(...)` (no exportados) en `apps/web/src/lib/products/parseProductsPageFilters.ts`, según design.md D2, preservando la semántica exacta (ausente/`null` → fallback, `NaN` → fallback, `floor` para decimales). Sin cambiar la firma exportada ni añadir dependencias.
- [x] 3.3 Verificar: la suite del paso 3.1 sigue verde SIN modificar ningún test; `npm run lint --workspace=apps/web` ya no emite el warning de `parseProductsPageFilters`; registrar complejidad antes/después (12 → ≤10).

## 4. Warning de astro-icon (design.md D3: Opción B)

- [x] 4.1 Crear `apps/web/src/icons/` con `.gitkeep` y un `README.md` mínimo que aclare que no hay iconos locales (todo viene de `@iconify-json/lucide` y `@iconify-json/simple-icons`).
- [x] 4.2 Confirmar que `apps/web/astro.config.mjs` queda sin cambios (el default `iconDir = "src/icons"` ya apunta a la carpeta creada).
- [x] 4.3 Ejecutar `npm run build --workspace=apps/web` y verificar que NO aparece `[astro-icon] Failed to load icons from "src/icons"` (debe aparecer `Loaded icons from src/icons, lucide, simple-icons`); registrar en el reporte que la Opción A (`iconDir` a ruta inexistente) fue descartada por evidencia del código de astro-icon 1.2.0.

## 5. `.nvmrc` (design.md D4: ya resuelto, solo verificación)

- [x] 5.1 Verificar que `.nvmrc` en la raíz contiene exactamente `24` (una línea) y que está versionado en Git; confirmar que `engines.node` (`>=24.0.0` en `package.json`) no se modifica. Registrar en el reporte que el ítem ya estaba resuelto (commit `a6e2f42`).

## 6. Verificación final y entrega

- [x] 6.1 Ejecutar `npm run lint` completo: 0 warnings de complejidad (los demás warnings preexistentes pueden permanecer) y anotar el resultado.
- [x] 6.2 Ejecutar `npm run typecheck`: limpio.
- [x] 6.3 Ejecutar `npm test`: verde en todos los workspaces.
- [x] 6.4 Ejecutar `make ci`: gate completo en verde (openspec-validate + lint + typecheck + build + test-ci + audit).
- [x] 6.5 Ejecutar `npx openspec validate --all --strict`: 73/73 sin cambios.
- [x] 6.6 Crear UN solo commit en Conventional Commits (inglés) con los 3 ítems, y redactar el reporte final: refactor aplicado por función, complejidad antes/después, vía elegida para astro-icon (config vs carpeta) y resultados de la verificación.
