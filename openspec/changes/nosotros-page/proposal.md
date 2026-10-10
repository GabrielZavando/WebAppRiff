# Proposal

## Why

La página `/nosotros` existe pero está vacía: `apps/web/src/pages/nosotros.astro` solo renderiza el chrome compartido (Header + Footer) con un `<main>` vacío, y el menú ya la enlaza. Hay un diseño aprobado (`docs/design/components/nosotros/reference.jpg` + `reference.html`) con el contenido institucional completo de Riff que nunca se implementó: sin hero, sin historia, sin propuesta de valor, sin misión/visión, sin equipo y sin clientes/CTA, la página es una callejón sin salida para el usuario que llega desde el menú.

## What Changes

- Implementar el `<main>` de `apps/web/src/pages/nosotros.astro` con las **6 secciones** de la referencia, manteniendo `title`, `description`, `hero={false}` y `showSearch={false}` del `<Layout>`:
  1. Hero / presentación institucional — `<h1>` "SOMOS RIFF", subtítulo, párrafo, CTA "Solicitar asesoría técnica" (→ `/contacto`) y "Conocer nuestra historia" (→ `#historia`), imagen técnica con `alt`.
  2. Línea de tiempo histórica (`id="historia"`) — 5 hitos (1979, 2012, 2013, 2018, Diciembre 2024) en layout alternado.
  3. Propuesta de valor — 4 pilares (Durabilidad Extrema, Precisión Certificada, Eficiencia Hídrica, Servicio In-Situ) + bento de 4 sectores (Gran Minería & Pulpa, Alimentos & Bebidas, Redes Rurales APR, Edificación & Inmobiliario).
  4. Misión & Visión — dos bloques lado a lado.
  5. Equipo RIFF — 4 tarjetas de liderazgo (Steven Marks, Lara Smith, John Doe, Felipe Román).
  6. Clientes y CTA final — grid de 8 clientes + banner de cierre con CTA a `/contacto` y `tel:`.
- Nuevos componentes Astro tontos (presentacionales) + config de contenido en `src/lib/config/` y tipos en `src/lib/types/`, siguiendo el patrón de `contact-page` / `services-page`.
- **Traducción del HTML de referencia a producción** (no es código de producción):
  - Iconos Material Symbols → set único **Lucide** (`<Icon name="lucide:..." />`, catálogo del proyecto).
  - Tokens propios de la referencia (`inverse-surface`, `primary-fixed`, `secondary-container`, `surface-*`, etc.) → tokens existentes de `@theme` en `globals.css` (sin hex, sin añadir tokens al sistema salvo justificación explícita).
  - Imágenes externas de Google (AIDA) → placeholders reutilizando assets existentes de `src/assets/img/` (convención `image-assets`; sin binarios nuevos en `public/`), conservando cada `data-alt` como `alt` real.
  - CTAs `href="#contacto"` → ruta real `/contacto`; el `#historia` sí es ancla interna de la sección.
  - `<script>` propio de smooth scroll → **no** se añade: se reutiliza el smooth scroll global (`html { scroll-behavior: smooth }` en `globals.css`).
  - `<footer>` vacío de la referencia → ignorado (el `<Layout>` ya aporta Footer + SiteCredits).
  - `pt-44` de la referencia (offset de header fijo) → **no** se aplica: en el proyecto el header es `sticky` (en flujo), igual que en `/contacto` y `/servicios`.
- Copy de la referencia **preservado tal cual**, salvo ajustes de formato/mapeo justificados en `design.md`.
- Test de página reescrito: hoy `nosotros.test.ts` afirma que el `<main>` está vacío (SC-109); pasará a afirmar las 6 secciones, los CTAs a `/contacto`, iconos Lucide y `alt` no vacíos.
- Docs: añadir los iconos nuevos al catálogo `docs/design/style-guide/README.md`.

## Capabilities

### New Capabilities

- (ninguna)

> ⚠️ **Corrección respecto al enunciado**: la capability `nosotros-page` **ya existe** en `openspec/specs/nosotros-page/spec.md` (creada en el change archivado `header-scroll-restore` y hoy describe la página vacía). Por eso este change la **modifica** en lugar de crearla; se conserva la ruta de spec existente.

### Modified Capabilities

- `nosotros-page`: el requirement "Page renders with only the shared header and footer chrome" se modifica — el `<main>` deja de estar vacío y pasa a contener las 6 secciones (se conservan chrome compartido, `hero={false}`, `showSearch={false}` y HTTP 200); se añaden requirements para cada una de las 6 secciones, para los CTAs/navegación interna, para la traducción a iconos Lucide, para el uso de tokens de diseño, para responsive y para accesibilidad (jerarquía de encabezados, `alt` no vacíos).
- `navigation-menu`: el scenario "SC-006 — Nosotros link renders in both navs with active state" menciona que `/nosotros` es "la página vacía (Header + Footer only)" — deja de ser cierto; se ajusta el scenario para conservar solo lo que sigue vigente (el enlace existe y se marca activo).

## Impact

- **Código frontend** (`apps/web/`):
  - `src/pages/nosotros.astro` — `<main>` deja de estar vacío; se componen los 6 componentes.
  - Nuevos componentes: `src/components/NosotrosHero.astro`, `NosotrosTimeline.astro`, `NosotrosValueProp.astro`, `NosotrosIdentity.astro`, `NosotrosTeamGrid.astro`, `NosotrosClients.astro`.
  - Nuevo contenido/config: `src/lib/config/nosotros-page.ts` + `src/lib/types/nosotros-page.ts`.
  - Tests: `src/pages/__tests__/nosotros.test.ts` (reescritura — hoy afirma `<main>` vacío) + nuevos `src/components/__tests__/Nosotros*.test.ts`.
  - Assets: solo reutilización de imágenes existentes en `src/assets/img/` (sin binarios nuevos).
- **Docs**: `docs/design/style-guide/README.md` (nuevas filas del catálogo Lucide).
- **Specs**: deltas de `nosotros-page` y `navigation-menu`.
- **Sin impacto**: `Layout.astro`, `Header.astro`, `Footer.astro` (fuera de alcance explícito), home ni otras páginas, backend, API, dependencias npm (Lucide ya está en `@iconify-json/lucide`), sistema de tokens (no se añaden tokens).
