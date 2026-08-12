## Why

El TopHeader del sitio público (Astro SSG) ya implementa click-to-call en el número de teléfono mediante un enlace `tel:`, pero no estaba verificado ni cubierto por test de regresión. Además, el icono de la red social X (Twitter) sigue usando `lucide:twitter` (el pájaro antiguo) cuando el proyecto debe mostrar el logo oficial actual de X. Lucide no provee el logo de marca X; la solución es usar `simple-icons:x` como excepción documentada al set único Lucide.

## What Changes

- **Verificación y test de regresión** del click-to-call existente en `TopHeader.astro` (formato E.164 `tel:+569...`).
- **Cambio de icono de red social X**: `lucide:twitter` → `simple-icons:x` en `TopHeader.astro` y `Footer.astro` (chrome consistente, Decision 4 de design.md).
- **Instalación** de `@iconify-json/simple-icons` como source set local para SSR (mismo patrón que `@iconify-json/lucide`).
- **Documentación de la excepción** al set único Lucide en `docs/design/style-guide/README.md` y `docs/frontend-standards.md` (única excepción: logo oficial X).
- **Actualización de comentario** de sincronización en `Footer.astro` para reflejar la excepción documentada.

## Capabilities

### New Capabilities

- (none — click-to-call and social rendering are already covered by the existing `top-header` spec; this change modifies it and adds a regression scenario)

### Modified Capabilities

- `top-header`: Social link icon for X changes from `lucide:twitter` to `simple-icons:x`; ADD regression scenario for phone number `tel:` normalization to E.164 format.
- `site-footer`: Footer social icon for X changes from `lucide:twitter` to `simple-icons:x`; ADD regression scenario for footer X logo consistency.

## Impact

**Affected code:**
- `apps/web/src/components/TopHeader.astro` (icon map line 19)
- `apps/web/src/components/Footer.astro` (icon map line 17 + sync comment lines 13-14)
- `apps/web/package.json` (new dependency `@iconify-json/simple-icons`)
- `docs/design/style-guide/README.md` (icon catalog line 79 + exception note)
- `docs/frontend-standards.md` (exception note in icon sections)

**Dependencies:** `@iconify-json/simple-icons` added to web app (SSR source set).

**Systems:** Astro SSG build must resolve `simple-icons:x` at build time (validated by build step).

**No breaking changes** to public APIs or data model.