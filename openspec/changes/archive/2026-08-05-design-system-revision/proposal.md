## Why

El sistema de diseño actual del sitio público Astro se basa en **4 tokens de color hardcoded** (`--color-brand-navy`, `--color-brand-navy-light`, `--color-brand-orange`, `--color-brand-teal`) cuyos valores (`#1B2A4A`, `#2C3E6B`, `#F97316`, `#14B8A6`) **no coinciden con la guía visual oficial del cliente** (`docs/design/style-guide/index.html`), que define una paleta distinta (Teal `#41B3C4`, Navy `#1F2D40`, Naranja `#F26A21`) con 24 colores, 2 familias tipográficas (Montserrat / Open Sans), radios y sombras planas. Adicionalmente, el change archivado `panel-home` (tasks 4.13 / 4.14) dejó **TODOs explícitos**: el contraste blanco sobre `#14B8A6` (~2.49:1) **no cumple WCAG AA Large** y queda `test.skip()` a la espera de una revisión global del sistema de diseño. Hoy también existe una **divergencia estructural**: `apps/web` usa Tailwind v4 (`@tailwindcss/vite` + `@theme` en CSS) mientras `apps/admin` aún declara Tailwind v3 (`tailwindcss: ^3.4.0`), lo que impide sincronizar tokens entre ambas apps.

## What Changes

- **NUEVA capability `design-tokens`**: define canónicamente los 24 colores, 2 familias tipográficas, 1 radio y 5 niveles de shadow extraídos de la guía visual del cliente.
- **BREAKING**: eliminar los 4 tokens actuales obsoletos — `--color-brand-navy`, `--color-brand-navy-light`, `--color-brand-orange`, `--color-brand-teal` — y reemplazarlos por el set nuevo (`--color-primary`, `--color-secondary`, `--color-accent`, etc.).
- Migrar los componentes Astro existentes (`TopHeader.astro`, `Header.astro`, `SearchForm.astro`, `HeroBanner.astro`, `PanelHome.astro`) para consumir los nuevos tokens, sin usar literales hex ni utilidades `bg-brand-*` obsoletas.
- Integrar **Montserrat** y **Open Sans** vía `@fontsource` self-hosted (sin CDN externo), reemplazando el modelo actual basado en `text-gray-*` y fuentes del sistema.
- **BREAKING (stack)**: migrar `apps/admin` de Tailwind v3 a Tailwind v4 — bump de dependencias, eliminación de `tailwind.config.js` (si existiése), creación del scaffolding mínimo de Angular 18 (`angular.json`, `src/main.ts`, `src/styles/globals.css`) con el mismo `@theme` que `apps/web`.
- Integrar **astro-icon** + `@iconify-json` (set base: **Material Symbols Outline**) en `apps/web`; eliminar los 7 archivos de iconos `.astro` actuales (`PhoneIcon`, `FacebookIcon`, `XIcon`, `InstagramIcon`, `LinkedInIcon`, `MenuIcon`, `CloseIcon`) y migrarlos a `<Icon name="material-symbols:..." />`.
- **Cierre de TODOs**: reactivar los `test.skip()` de `apps/web/e2e/panel-home.spec.ts` (tasks 4.13 / 4.14) y validar WCAG AA Large con el nuevo `--color-primary: #41B3C4` (contraste esperado con blanco ~5.9:1 ≥ 3:1).
- Regenerar los snapshots de componentes migrados tras el cambio visual (práctica TDD estándar cuando el contrato visual cambia); **no se modifican las specs archivadas** del change `panel-home`.

## Capabilities

### New Capabilities
- `design-tokens`: Sistema canónico de design tokens (colores marca + neutros + estado, tipografías Montserrat/Open Sans, radius, sombras) derivado de `docs/design/style-guide/index.html`, implementado como entradas `@theme` de Tailwind v4 en `apps/web/src/styles/globals.css` y `apps/admin/src/styles/globals.css`. Incluye la convención de consumo (utilities Tailwind `bg-primary`, `text-secondary`, `border-border`, `shadow-1`, etc.) y la restricción de que ningún componente puede usar literales hex ni los tokens obsoletos `brand-*`.

### Modified Capabilities
- `top-header`: migración de tokens `bg-brand-navy / from-brand-navy / to-brand-navy-light` → nuevos tokens; los iconos SVG inline migrados a `<Icon name="material-symbols:..." />` (phone + redes sociales).
- `site-header`: migración de tokens `bg-brand-navy / to-brand-navy-light / bg-brand-orange / text-brand-teal` → nuevos; iconos `MenuIcon` / `CloseIcon` migrados a `astro-icon`.
- `search-form`: migración de tokens de color/border a nuevos tokens.
- `hero-banner`: migración de gradientes `from-brand-navy / via-brand-navy-light / to-brand-navy` → nuevos; highlight `text-brand-teal` → `text-primary`; CTAs `bg-brand-teal` → color primario correcto según guía.
- `panel-home`: migración `bg-brand-teal` (mitad teal) → `--color-primary` `#41B3C4` (con nuevo contraste WCAG AA Large cumplimiento); `bg-brand-navy` (CTA) → `--color-secondary`. Reactivación de tests 4.13 / 4.14 previamente `skip()`.

## Impact

- `docs/design/style-guide/index.html` — obstante existente, referenciado como insumo canónico.
- `docs/design/style-guide/README.md` — **NEW**, tabla canónica de tokens + catálogo de iconos Material Symbols.
- `apps/web/package.json` — añadir `astro-icon`, `@iconify-json`, `@fontsource/montserrat`, `@fontsource/open-sans`.
- `apps/web/astro.config.mjs` — integrar `astroIcon()` integration.
- `apps/web/src/styles/globals.css` — **BREAKING**: reemplazar los 4 tokens por `@theme` completo (24 colores + 2 fonts + radius + 5 shadows).
- `apps/web/src/components/{TopHeader,Header,SearchForm,HeroBanner,PanelHome}.astro` — migración de tokens y (TopHeader, Header) también de iconos.
- `apps/web/src/components/icons/*.astro` (7 archivos) — **DELETE**, sustituidos por `astro-icon`.
- `apps/web/src/components/__tests__/__snapshots__/*.snap` — **REGEN** tras migración visual de cada componente.
- `apps/web/e2e/panel-home.spec.ts` — eliminar `test.skip()` de tasks 4.13 / 4.14, validar WCAG AA con nuevo teal.
- `apps/admin/package.json` — bump `tailwindcss: ^3.4.0` → `^4.3.3`, añadir `@tailwindcss/postcss`, `@fontsource/montserrat`, `@fontsource/open-sans`.
- `apps/admin/angular.json` — **NEW**, scaffolding mínimo Angular 18 con config PostCSS para Tailwind v4.
- `apps/admin/src/main.ts` — **NEW**, bootstrap mínimo Angular.
- `apps/admin/src/styles/globals.css` — **NEW**, mismo `@theme` que `apps/web` (sincronizado manualmente).
- `docs/frontend-standards.md` — añadir sección "Design Tokens" que apunta a `docs/design/style-guide/`.
- `docs/documentation-standards.md` — referencia cruzada mínima.
- **Sin cambios**: `docs/api-spec.yml`, `docs/data-model.md`, `apps/backend/*` (no afecta backend).
