## Why

El sitio público Astro (apps/web/) completó su bootstrap (Fase A) con `TopHeader`, `Header` y `SearchForm` integrados en `Layout.astro`. La home actual (`apps/web/src/pages/index.astro`) es solo un placeholder con un `<h1>` y un párrafo explicativo; no existe todavía una sección hero que comunique la propuesta de valor del catálogo Riff, que es la pieza visual central de la imagen de referencia `docs/design/components/BannerHome.png`.

Este change entrega el componente presentacional `HeroBanner.astro` que renderiza el hero del home: headline con una palabra destacada, subtítulo, descripción y dos CTAs (`VER SERVICIOS` primario teal + `ESCRÍBENOS` secundario outline) sobre un fondo navy generado con CSS (placeholder sin imagen externa, mientras el cliente libera el asset industrial real). Es la cuarta pieza de UI real del sitio y desbloquea la próxima sección de estadísticas (`stats-strip`, change futuro).

## What Changes

- Nuevo componente presentacional `HeroBanner.astro` en `apps/web/src/components/` (dumb: recibe todas las props desde la página, sin fetching ni lectura de `import.meta.env`)
- Tipos TypeScript `HeroBannerProps`, `HeroCta`, `HeroStat` (este último reservado para el change futuro `stats-strip`) en `apps/web/src/lib/types/hero-banner.ts`
- Config hardcoded del contenido del hero `HERO_BANNER_CONTENT` en `apps/web/src/lib/config/hero-banner.ts` (mismo patrón que `NAVIGATION_ITEMS` y `CATEGORY_OPTIONS`)
- Helper `splitHeadline(headline, highlightedWord)` en `lib/config/hero-banner.ts` para separar la palabra destacada del resto del headline, testeable aislado (SRP Astro: frontmatter sin lógica de negocio no trivial)
- Nuevo token CSS `--color-brand-teal` (#14B8A6) en `apps/web/src/styles/globals.css` para el CTA primario del hero
- Página `apps/web/src/pages/index.astro` actualizada: reemplaza el placeholder actual por `<HeroBanner {...HERO_BANNER_CONTENT} />` dentro del `<Layout>`
- Tests Vitest (unit + AstroContainer + snapshot) y E2E Playwright (desktop/mobile/accesibilidad/contraste CTAs)
- No se modifica `SearchForm.astro` ni su spec — el SearchForm sigue renderizándose con fondo blanco en `Layout.astro`. La apariencia "sobre hero oscuro" de la imagen de referencia queda explícitamente fuera de scope y se agenda como change futuro `search-form-variants`

## Capabilities

### New Capabilities
- `hero-banner`: Sección hero del home del sitio público, presentacional (dumb), con headline + palabra destacada, subtítulo, descripción y dos CTAs (primario teal + secundario outline blanco) sobre un fondo navy generado con CSS placeholder (sin imagen externa). Layout responsivo (mobile stacked, desktop horizontal). Headline único `<h1>` de la home, subtítulo `<h2>` subordinado.

### Modified Capabilities
<!-- (ninguna — la spec `search-form` no cambia: el SearchForm se mantiene con fondo blanco renderizado por Layout.astro; este change no introduce variantes visuales del SearchForm) -->

## Impact

- `apps/web/src/components/HeroBanner.astro` — nuevo componente presentacional (dumb)
- `apps/web/src/lib/types/hero-banner.ts` — interfaces TypeScript nuevas (`HeroBannerProps`, `HeroCta`, `HeroStat`)
- `apps/web/src/lib/config/hero-banner.ts` — constante `HERO_BANNER_CONTENT` + helper `splitHeadline`
- `apps/web/src/lib/config/__tests__/hero-banner.test.ts` — tests unitarios de `splitHeadline` y shape de `HERO_BANNER_CONTENT`
- `apps/web/src/lib/types/__tests__/hero-banner.test.ts` — sanity check de tipos (opcional,	type-level assertions)
- `apps/web/src/components/__tests__/HeroBanner.test.ts` — tests AstroContainer + snapshot
- `apps/web/src/styles/globals.css` — añade `--color-brand-teal: #14B8A6` al bloque `@theme`
- `apps/web/src/pages/index.astro` — reemplaza el placeholder actual (`<h1>` + `<p>`) por `<HeroBanner {...HERO_BANNER_CONTENT} />`
- `apps/web/e2e/hero-banner.spec.ts` — E2E Playwright nuevos
- No requiere cambios en `docs/api-spec.yml` (el hero no consume API)
- No requiere cambios en `docs/data-model.md` (no hay entidades nuevas)
- No requiere cambios en `Layout.astro` (`HeroBanner` se renderiza vía el `<slot>` de `index.astro`, no se mueve ni se toca el SearchForm)
