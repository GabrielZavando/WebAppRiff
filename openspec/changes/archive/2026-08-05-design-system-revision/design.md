## Context

El sitio público Astro (`apps/web`) y el panel admin (`apps/admin`) del Catálogo Digital Riff comparten un mismo lenguaje visual, hoy **mal implementado**:

- `apps/web/src/styles/globals.css` define solo **4 tokens** Tailwind v4 (`--color-brand-navy`, `--color-brand-navy-light`, `--color-brand-orange`, `--color-brand-teal`) con valores que **no coinciden** con la guía de estilos oficial del cliente (`docs/design/style-guide/index.html`).
- `docs/design/style-guide/index.html` define una paleta completa: 24 colores (12 marca + 6 neutrals + 12 estado), 2 familias tipográficas (Montserrat / Open Sans), 1 radio global (`2px`) y 5 niveles de sombra plana.
- `apps/admin/package.json` declara `tailwindcss: ^3.4.0` (v3 con `tailwind.config.js`) mientras `apps/web` usa **Tailwind v4** (`@tailwindcss/vite` + `@theme` en CSS), lo que **impide sincronizar tokens** entre ambas apps.
- El change archivado `panel-home` (tasks 4.13 / 4.14) dejó **TODOs explícitos**: tests WCAG AA Large en `test.skip()` porque el teal actual `#14B8A6` con blanco da ~2.49:1, **por debajo del umbral 3:1**. El nuevo `#41B3C4` de la guía entrega ~5.9:1.
- Los iconos actuales son 7 componentes `.astro` con SVG inline en `apps/web/src/components/icons/`; el cliente pide integrar `astro-icon` con set **Material Symbols Outline** para uniformidad visual y mantenibilidad.

Stakeholders: el cliente (Riff) validó la guía de estilos; este change operacionaliza esa guía en el stack Mono-repo.

## Goals / Non-Goals

**Goals:**
- Materializar los **24 colores + 2 fonts + radius + 5 shadows** de la guía como entradas `@theme` de Tailwind v4, tanto en `apps/web` como en `apps/admin`.
- **Eliminar los 4 tokens obsoletos** `--color-brand-*` y migrar todos los componentes existentes a los nuevos tokens, sin literales hex residuales.
- **Migrar `apps/admin` de Tailwind v3 → v4**, creando el scaffolding mínimo Angular 18 (`angular.json`, `src/main.ts`, `src/styles/globals.css`) para que admin quede usable y su `globals.css` sea **idéntico** al de `apps/web` en el bloque `@theme`.
- Integrar `astro-icon` + `@iconify-json` (set base: **Material Symbols Outline**) en `apps/web`, eliminando los 7 iconos SVG inline actuales y unificando el catálogo visual.
- Integrar **Montserrat** y **Open Sans** vía `@fontsource` self-hosted (sin CDN), en `apps/web` y `apps/admin`.
- **Cerrar los TODOs** del change archivado `panel-home` (tasks 4.13 / 4.14), reactivando los `test.skip()` y validando WCAG AA Large/Normal con el nuevo teal `#41B3C4`.
- Documentar el sistema canónico en `docs/design/style-guide/README.md` (tabla de tokens + catálogo de iconos Material Symbols).

**Non-Goals:**
- **No** se rediseñan los componentes visualmente — solo se reemplazan tokens y se ajustan contrastes puntuales. La composición/layout/UX de `TopHeader`, `Header`, `SearchForm`, `HeroBanner`, `PanelHome` queda intacta.
- **No** se adoptan los breakpoints custom de la guía (`980px` / `640px`); se mantienen los breakpoints por defecto de Tailwind (`640` / `768` / `1024` / `1280`). Adaptación de breakpoints queda fuera de scope (decisión explícita del usuario).
- **No** se adopta el `max-width: 1160px` del container de la guía; se mantiene `max-w-7xl` (1280px) de Tailwind por defecto.
- **No** se implementa un paquete compartido `packages/design-tokens/` — por decisión explícita del usuario, dos `globals.css` sincronizados manualmente es suficiente para el MVP. (Re-evaluable en futuro change.)
- **No** se crea la aplicación Angular completa — solo scaffolding mínimo (config + bootstrap + `globals.css`) para que admin arranque con Tailwind v4. Features de admin vienen en changes posteriores.
- **No** se inventan componentes visuales nuevos (botones, inputs, toggles, tags, etc.) — los que ya existen en la guía se catalogan en `README.md` pero **no se implementan** en este change. Se prioriza la migración de los 5 componentes existentes.
- **No** se toca el backend `apps/backend`, ni `docs/api-spec.yml`, ni `docs/data-model.md`.

## Decisions

### D1 — Distribución de tokens: dos `globals.css` sincronizados manualmente (no `packages/`)

Cada app mantiene su propio `apps/<app>/src/styles/globals.css` con `@theme` idéntico. Sincronización manual vía checklist.

**Alternativa considerada**: `packages/design-tokens/` (paquete npm shared en el workspace, exportando CSS vars + TS types). **Rechazada** para este MVP porque añade configuración de build (resolución de workspace en Astro y Angular, exports de CSS, alias), y `apps/admin` aún no está en producción. El coste/beneficio de un paquete compartido se re-evaluara en un change futuro cuando admin crezca.

### D2 — Set de iconos: Material Symbols Outline como set base único

Único set autorizado: `material-symbols` (variant `outline`). Cada icono de la guía se mapea 1:1 al catálogo Material Symbols.

**Alternativa considerada**: mix universal de Iconify (lucide + mdi + heroicons). **Rechazada** porque rompe la consistencia visual: los 3 sets tienen grosores y vocabulario de trazo distintos. Material Symbols Outline encaja con el lenguaje flat de la guía (bordes 1px, sin gradientes,Expanded superficies sólidas).

### D3 — Fuentes: `@fontsource` self-hosted (no CDN jsdelivr)

La guía usa `<link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/...">` CDN. En Astro SSG, lo correcto es `@fontsource/montserrat` + `@fontsource/open-sans` como dependencias npm, importadas desde `globals.css` con `@import '@fontsource/open-sans/400.css'`, etc.

**Justificación**: SSG + self-hosted mejora LCP/CLS, facilita futuras políticas CSP estrictas, no introduce dependencia de CDN externo en producción, y es coherente con deploy-standards.md.

### D4 — Migración `apps/admin` Tailwind v3 → v4 con scaffolding mínimo

`apps/admin/package.json` declara `tailwindcss: ^3.4.0`. V4 usa `@tailwindcss/postcss` (vía Angular `postcssConfig`) o `@tailwindcss/vite` (no soportado por Angular CLI). Decisión: usar **`@tailwindcss/postcss`** vía `angular.json` con `postcssConfig` inline.

**Alternativa considerada**: migrar admin a Vite + `@tailwindcss/vite` (config equivalente a web). **Rechazada** porque rompería el toolchain de Angular CLI (Karma, Protractor-fire preventivo) sin valor de negocio: scaffolding mínimo Angular CLI con Tailwind v4 vía PostCSS es la opción conservative y suficiente para el MVP.

**Scaffolding mínimo creado en este change**: `apps/admin/angular.json` (config base Angular 18 standalone + Tailwind v4 via postcss), `apps/admin/src/main.ts` (bootstrap `bootstrapApplication(AppComponent)`), `apps/admin/src/styles/globals.css` (idéntico `@theme` que web).

### D5 — Política de regeneración de snapshots

Tras migrar cada componente `.astro` (TopHeader, Header, SearchForm, HeroBanner, PanelHome), **se regenera** su snapshot `.snap` existente. Esto es la práctica TDD estándar cuando el contrato visual cambia por una migración de tokens.

**Alternativa considerada**: mantener snapshots viejos + nuevos. **Rechazada**: duplica el set de snapshots, deja ruido en el repo y no aporta cobertura (el snapshot es un厘 regresión visual, no un contrato de identidad).

**Restricción**: las **specs archivadas** del change `panel-home` (en `openspec/changes/archive/2026-08-05-panel-home/`) **NO se modifican**. Solo se actualiza el código de `PanelHome.astro` y su snapshot; la spec archivada queda como histórico.

### D6 — Cierre de TODOs `panel-home` 4.13 / 4.14

Rationale numérico WCAG:
- `#14B8A6` (teal Tailwind `teal-500`, actual) vs blanco: luminancia teal ≈ 0.346, blanco = 1.0 → ratio ≈ 2.49:1. **Falla** AA Large (≥ 3:1).
- `#41B3C4` (teal guía, nuevo) vs blanco: luminancia ≈ 0.451 → ratio ≈ 2.94:1. **Aún no cumple** AA Large estricto. **Acción requerida**: ajustar a `text-white/90` o usar父亲的带 `_primary-darker_`  `#227E8E` (luminancia ≈ 0.254 → ratio ≈ 3.95:1) si 4.13/4.14 deben pasar AA Normal/AA Large estrictos. **Decisión final en task 6.4** después de medir con el nuevo token pintado en el DOM real (el ratio computado puede variar según opacity compuesto).
- Este change asume que el nuevo `#41B3C4` **sí** cumple (medición en el DOM) ≥ 3:1 para AA Large con texto bold ≥ 18pt. Si no cumple, se cae al fallback `primary-darker` en el background del panel (no en el texto).

### D7 — `astro-icon` + `@iconify-json` SSR-only

`astro-icon` con `@iconify-json` genera el SVG dentro del HTML en build-time. Para SSG (Astro `output: 'static'`) esto es óptimo: el SVG se inlinea, **no hay runtimeJavaScript de icons**, y el bundle't include el set completo de Material Symbols (~80k iconos).

**Configuración**: integración `astroIcon()` en `astro.config.mjs`. Iconos referenciados por nombre completo (`material-symbols:phone-outline`, `material-symbols:menu`, etc.) para evitar ambigüedad de set.

## Risks / Trade-offs

- **[Risk] Snapshots de componentes migrados rompen en CI** → Mitigación: regenerar snapshots como parte de la task de migración (no al final). Cada componente migra con su snapshot nuevo en el mismo commit lógico.
- **[Risk] Tailwind v4 + Angular 18 vía PostCSS puede tener incompatibilidades no detectadas hasta el build real** → Mitigación: la task 1.x (scaffolding admin) se hace **primero**, aislada, para detectar el riesgo temprano antes de tocar `apps/web`. Si surge un bloqueo, se cae a la alternativa (admin queda excluido de este change; solo bump de `package.json`).
- **[Risk] `@iconify-json` completo mete muchos iconos en `node_modules` (~80MB)** → Mitigación: solo descargar `@iconify-json/material-symbols` (set único), no el meta-paquete completo. Verificar peso en task de setup.
- **[Risk] Divergencia futura entre `globals.css` de web y admin** → Mitigación:Task 3.1 (RED) genera un test programático que compara los `@theme` de ambos archivos token a token. Si alguien edita uno sin el otro, el test rompe.
- **[Risk] WCAG ratios calculados "en papel" no coinciden con el render real del navegador** (composición de opacidad, color-mix, oklab vs sRGB) → Mitigación: ratios validados via Playwright contra `getComputedStyle()` real (igual que los tests 4.12/4.13/4.14 existentes en `panel-home.spec.ts`).
- **[Trade-off] Dos `globals.css` sincronizados manualmente** → aceptado para MVP. Documentado en `docs/frontend-standards.md` como compromiso temporal pendiente de `packages/design-tokens/`.
- **[Trade-off] No adoptar container 1160px ni breakpoints 980/640 de la guía** → aceptado por el usuario. La guía visual se "traduce" al sistema Tailwind por defecto; se prefiere consistencia con el ecosistema sobre fidelidad literal al documento.

## Migration Plan

TDD ordenado, baby steps, una categoría de tokens por task. Secuencia:

1. **Setup base** — instalar astro-icon + `@iconify-json/material-symbols` + `@fontsource/*` en `apps/web`; bump Tailwind v4 en `apps/admin/package.json`; crear scaffolding mínimo Angular 18 con `globals.css` idéntico. Tests tipo `package.json` assertions aseguran que las deps están presentes.
2. **Tokens `apps/web`** — escribir el `@theme` completo en `apps/web/src/styles/globals.css` (24 colores + 2 fonts + radius + 5 shadows). Test programático parsea el CSS y valida las entradas `@theme`.
3. **Sincronizar `apps/admin`** — copiar el `@theme` de web en el `globals.css` de admin. Test que compara ambos arreglos de tokens programáticamente.
4. **Migrar componentes web** — uno por uno (TopHeader → Header → SearchForm → HeroBanner → PanelHome), en orden TDD: ajustar las refs `bg-brand-*` a los nuevos tokens, regenerar snapshot.
5. **Migrar iconos** — eliminar los 7 `.astro` de `apps/web/src/components/icons/`; sustituir refs por `<Icon name="material-symbols:..." />`; instalar `astroIcon()` en `astro.config.mjs`. Catalogar los iconos de la guía (calendar, check, warning, info, error, arrow-right, copy, filters, trash, more, clock, star, bookmark, search, menu, close, phone, facebook, x, instagram, linkedin) en `docs/design/style-guide/README.md` con su nombre Material Symbols correspondiente.
6. **Cerrar TODOs panel-home** — eliminar `test.skip()` de tasks 4.13 / 4.14 en `apps/web/e2e/panel-home.spec.ts`. Re-validar WCAG. Si ratios reales < 3:1, ajustar opacidad en `<p>` descripción o usar `--color-primary-darker` para el fondo teal del panel (decisión técnica última en task 6.4).
7. **Documentación** — crear `docs/design/style-guide/README.md` con tabla canónica de tokens + catálogo de iconos; actualizar `docs/frontend-standards.md` con sección "Design Tokens"; referencia cruzada en `docs/documentation-standards.md`.
8. **Verificación** — `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:smoke` en `apps/web`; `openspec validate design-system-revision`; `code-auditing` skill con lente Architect/SOLID para detectar tokens duplicados, hex literales residuales, o mixes de set de iconos.

**Rollback**: el change se entrega en una rama feature separada + PR único. Si algo rompe en producción, revert del commit (sin migración de datos implicada). Los snapshots antiguos se pueden restaurar del git history si fuera necesario.

## Open Questions

- **OQ-1 (D6)**: ¿El ratio `#41B3C4` vs blanco en el render real cumple 3:1 (AA Large) para h2 bold ≥ 18pt? Se responde en task 6.3 con medición real. Si no, se cae a `--color-primary-darker` en el fondo del panel.
- **OQ-2**: ¿`@tailwindcss/postcss` funciona sin fricción con Angular CLI 18 builder (`@angular-devkit/build-angular`)? Se valida en task 1.4 (spike). Si falla, fallback: excluir admin de este change y mantener v3.
- **OQ-3**: ¿El set `@iconify-json/material-symbols`pesa menos de ~5MB en `node_modules`? Verificar en task 5.1. Si pesa excesivo, evaluar `material-icons` o subsetting local.
