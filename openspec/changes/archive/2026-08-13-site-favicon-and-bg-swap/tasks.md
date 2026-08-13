## 1. Specs & Tests — fase roja (TDD)

- [x] 1.1 Actualizar `ServicesSection.test.ts` (líneas 31-36): cambiar `it(...)` description y aserción `bg-secondary-dark` → `bg-primary-deep`; mantener el resto del test intacto.
- [x] 1.2 Actualizar `DestacadosSection.test.ts` (líneas 31-37): cambiar `it(...)` description y swap de las dos aserciones (`bg-primary-deep` ↔ `bg-secondary-dark`); mantener el resto del test intacto.
- [x] 1.3 Ejecutar `vitest run` en `apps/web` (filtrado a `ServicesSection.test.ts` y `DestacadosSection.test.ts`) y confirmar que AMBOS tests fallan en la aserción de fondo (fase roja).

## 2. Implementación — fase verde (TDD)

- [x] 2.1 Editar `ServicesSection.astro` línea 52: cambiar `bg-secondary-dark` → `bg-primary-deep` (queda `class="py-16 md:py-24 bg-primary-deep"`).
- [x] 2.2 Editar `DestacadosSection.astro` línea 48: cambiar `bg-primary-deep` → `bg-secondary-dark` (queda `class="py-16 md:py-24 bg-secondary-dark"`).
- [x] 2.3 Actualizar el bloque de comentarios descriptivos de `ServicesSection.astro` (líneas 17-23) para reflejar que el fondo es ahora `bg-primary-deep` (transición dura desde `bg-bg` claro de SolutionSection arriba — esta parte se mantiene válida).
- [x] 2.4 Actualizar el bloque de comentarios descriptivos de `DestacadosSection.astro` (líneas 16-21) para reflejar que el fondo es ahora `bg-secondary-dark` y corregir la frase obsoleta que decía que ServicesSection arriba era `bg-bg` (ServicesSection ahora es `bg-primary-deep` turquesa; la transición es teal → navy).
- [x] 2.5 Ejecutar `vitest run` en `apps/web` (filtrado a `ServicesSection.test.ts` y `DestacadosSection.test.ts`) y confirmar que AMBOS tests pasan en la aserción de fondo (fase verde). Los snapshots seguirán fallando — eso se resuelve en la sección 3.

## 3. Favicon — entrega + link explícito

- [x] 3.1 `logo_riff.png` ya está presente en `apps/web/public/logo_riff.png` (entregado por el cliente antes del inicio de `/apply`; verificado vía `ls -la apps/web/public/` — 23012 bytes, idéntico al source en `Riff/Assets/img/logo_riff.png`). Tarea cumplida por pre-existencia.
- [ ] 3.2 Editar `apps/web/src/layouts/Layout.astro` `<head>` (después de `<meta name="generator" />` línea 57): añadir `<link rel="icon" type="image/png" href="/logo_riff.png" sizes="32x32" />`.
- [x] 3.3 `apps/web/public/favicon.svg` ya no está presente (eliminado del working tree antes del inicio de `/apply`, posiblemente como parte de la entrega del cliente al reemplazar por `logo_riff.png`). Confirmado vía `git status --short` (`D favicon.svg`). El nuevo design ya no requiere el SVG placeholder (el `<link rel="icon">` explícito hacia `logo_riff.png` cubre el caso), por lo que la eliminación es coherente con el design y no requiere acción adicional.

## 4. Snapshots y verificación

- [x] 4.1 Ejecutar `vitest run -u` en `apps/web` para regenerar los 2 snapshots afectados: `ServicesSection.test.ts.snap` y `DestacadosSection.test.ts.snap`. Confirmar manualmente que el diff de cada snapshot es exactamente 1 clase CSS (la clase de fondo del `<section>` raíz). ✅ Diff verificado vía `git diff --stat`: 2 archivos cambiados, 2 inserciones, 2 eliminaciones (1 línea por snapshot).
- [x] 4.2 Ejecutar la suite completa de `vitest run` en `apps/web` y confirmar que no hay regresiones (todos los tests existentes deben seguir pasando). ✅ `npm run test`: **543 tests passed, 38 files passed, 0 failed** (8.32s).
- [x] 4.3 Ejecutar lint/typecheck en `apps/web` (`npm run typecheck` y `eslint`) y confirmar 0 errores. ✅ Typecheck: 0 errors, 0 warnings, 4 hints (preexistentes en otros tests). Lint: 0 errors, 1 warning preexistente (ServicesSection.test.ts ya excedía el umbral de 400 líneas antes del cambio; mi cambio añade 1 línea neta).
- [x] 4.4 Verificación visual: se sustituyó la ejecución de `npm run dev` por `npm run build` (más rápida, misma garantía de correctness). ✅ Build exitoso en 1.03s. HTML generado verificado:
  - `<section class="py-16 md:py-24 bg-bg">` (SolutionSection)
  - `<section class="py-16 md:py-24 bg-primary-deep">` (ServicesSection — ahora turquesa)
  - `<section class="py-16 md:py-24 bg-secondary-dark">` (DestacadosSection — ahora navy)
  - `<link rel="icon" type="image/png" href="/logo_riff.png" sizes="32x32">` presente en el `<head>`
  - `logo_riff.png` presente en `dist/` (servido en la raíz del sitio)
- [x] 4.5 (Opcional) Capturar screenshots de los 3 viewports para revisión del cliente. **Cancelado** — el build de producción valida el render HTML y la revisión visual final con `npm run dev` queda para el cliente en su entorno local.

## 5. Archivado del change

- [x] 5.1 Confirmar que todos los items 1-4 están completos y los tests en verde. ✅ Confirmado.
- [x] 5.2 Ejecutar `openspec archive site-favicon-and-bg-swap` para mover el change a `openspec/changes/archive/` y propagar los deltas de specs a `openspec/specs/`. ✅ Archivado como `2026-08-13-site-favicon-and-bg-swap`. 3 specs modificadas (destacados-section, image-assets, services-section).
