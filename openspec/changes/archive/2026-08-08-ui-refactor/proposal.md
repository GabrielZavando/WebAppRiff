## Why

Los cinco componentes del sitio público (`TopHeader`, `Header`, `HeroBanner`, `PanelHome`, `SearchForm`) presentan tres deficiencias de ejecución visual respecto a la guía canónica (`docs/design/style-guide/index.html`):

1. **Iconos**: el set actual (Material Symbols Outline + Logos) no satisface el cliente. Se sustituye por **Lucide**, uniformando también los logos de redes sociales al nuevo set.
2. **Tipografía**: los tokens `--font-heading` (Montserrat) y `--font-body` (Open Sans) existen en `@theme`, pero **ningún componente aplica `font-heading`** — títulos, botones y nav renderizan todo con Open Sans, y los pesos no siguen la escala de la guía (botones 700 vs guía 600; nav 500 vs guía 600).
3. **Flat design + tokens residuales**: la guía manda radio `2px` y los componentes usan `rounded` (4px); el cliente decide ahora **radio 0** (flat total). Además hay residuos de la paleta por defecto de Tailwind (`gray-200`, `gray-600`, `gray-700`) que violan el sistema de tokens, y un `shadow-sm` en el CTA del Header que rompe el principio flat.

Se hace ahora porque es el momento de pulido de UI de los componentes base antes de añadir nuevas features sobre ellos.

## What Changes

- `apps/web`: instalar `@iconify-json/lucide` y **remover** `@iconify-json/material-symbols` y `@iconify-json/logos` (quedan sin uso).
- `TopHeader.astro`: icono teléfono `material-symbols:contact-phone-outline` → `lucide:phone`; logos sociales `logos:{facebook,twitter,instagram,linkedin}` → `lucide:{facebook,twitter,instagram,linkedin}`.
- `Header.astro`: icono menú `material-symbols:menu-outline` → `lucide:menu`; cerrar `material-symbols:close-outline` → `lucide:x`; nav items y CTA aplican `font-heading` + peso 600; CTA pierde `rounded` y `shadow-sm`.
- `HeroBanner.astro`: h1/h2 aplican `font-heading`; CTAs aplican `font-heading` peso 600 y pierden `rounded`.
- `PanelHome.astro`: eyebrow/headline/stat-values aplican `font-heading`; stat labels pasan de `text-gray-600` → `text-text-2`; CTA pierde `rounded`.
- `SearchForm.astro`: select/input pasan de `text-gray-700` → `text-text-2`; wrapper de `border-gray-200` → `border-border`; submit aplica `font-heading` peso 600; todos pierden `rounded`.
- `apps/web/src/styles/globals.css` + `apps/admin/src/styles/globals.css`: `--radius: 2px` → `--radius: 0` (ambos, para mantener el sync test en verde).
- **BREAKING** (solo visual, interno): el radio de todos los componentes base pasa a 0; los snapshots de los 5 componentes se regeneran.
- Docs: `docs/design/style-guide/README.md` y `docs/frontend-standards.md` se actualizan (catálogo de iconos Lucide + radio 0).

## Capabilities

### New Capabilities
<!-- Ninguna capability nueva. El cambio opera sobre specs existentes. -->

### Modified Capabilities
- `design-tokens`: el token `--radius` cambia de `2px` a `0` en ambos `globals.css`; el catálogo de iconos canónico pasa de Material Symbols Outline a Lucide.
- `top-header`: el teléfono y los logos sociales usan iconos Lucide (mismos aria-labels, mismo layout).
- `site-header`: el menú/cerrar usan Lucide; nav items y CTA aplican Montserrat 600; CTA pierde `rounded` y `shadow-sm`.
- `hero-banner`: títulos y CTAs aplican Montserrat según la escala de la guía; CTAs sin `rounded`.
- `panel-home`: eyebrow/headline/stat-values aplican Montserrat; stat labels usan `text-text-2`; CTA sin `rounded`.
- `search-form`: wrapper usa `border-border`; inputs usan `text-text-2`; submit aplica Montserrat 600; sin `rounded`.

## Impact

- **Código afectado**: 5 componentes `.astro` en `apps/web/src/components/`; los dos `globals.css` (web + admin); 3 archivos de tests unitarios + 5 snapshots `.snap`; tests de tokens y de package.json; docs.
- **APIs / contratos**: sin cambios. Sitio SSG, sin endpoints.
- **Dependencias**: `+@iconify-json/lucide`, `-@iconify-json/material-symbols`, `-@iconify-json/logos` en `apps/web/package.json`.
- **Accesibilidad**: cambio de `gray-600` (#4B5563) → `text-text-2` (#5C6675) mantiene contraste AA sobre blanco (>5:1). Lucide es outline stroke 2px, legible. Sin regresión WCAG prevista; se valida con e2e Playwright existentes.
- **Riesgo**: cambio de radio/escala tipográfica puede alterar layouts responsive; se valida con e2e + verificación visual manual en la home.
