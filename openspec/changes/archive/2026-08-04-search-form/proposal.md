## Why

El sitio público Astro (apps/web/) necesita una barra de búsqueda visible debajo del header que permita a los visitantes filtrar el catálogo por texto libre y categoría. Es la tercera pieza de UI real del sitio (después de `top-header` y `site-header`) y desbloquea el flujo de descubrimiento de productos cuando el change futuro `product-catalog` construya la página `/productos`. Hoy, sin búsqueda, un visitante no tieneforma de llegar al catálogo por texto.

El contrato de búsqueda ya existe en `docs/api-spec.yml` (`GET /api/v1/products?search=...&categoriaId=...`), pero el sitio público SSG todavía no lo consume desde su UI. Este change entrega el formulario que produce la URL canónica de resultados; la página que la consume entra en un change separado.

## What Changes

- Nuevo componente presentacional `SearchForm.astro` en `apps/web/src/components/` (select de categorías + input de búsqueda + botón BUSCAR, layout en franja blanca debajo del header)
- Tipos TypeScript `CategoryOption`, `SearchFormProps` en `apps/web/src/lib/types/search-form.ts`
- Config hardcoded de categorías `CATEGORY_OPTIONS` + helper `buildSearchHref(query, categoriaId)` + `SEARCH_FORM_CONFIG` (action path + submit label) en `apps/web/src/lib/config/search-form.ts`
- Integración global en `Layout.astro` entre `<Header />` y `<slot />`
- Página placeholder `apps/web/src/pages/productos/index.astro` para el destino del submit (evita 404 mientras el change `product-catalog` construye la página real)
- Opción `SEARCH_RESULTS_PATH` opcional en `apps/web/.env.example` (default `/productos`)
- Tests Vitest (unit + AstroContainer + snapshot) y E2E Playwright (desktop/mobile/accesibilidad)

## Capabilities

### New Capabilities
- `search-form`: Barra de búsqueda global debajo del header con select de categorías, input de texto y botón BUSCAR; submit nativo HTML navega a `/productos?q=<query>&categoriaId=<id>` omitiendo campos vacíos; layout responsivo (desktop en una fila, mobile stacked).

### Modified Capabilities
<!-- (ninguna — la spec `site-header` no cambia a nivel de requisitos; sus Non-Goals ya declaran "NO búsqueda en el header", y el SearchForm se coloca fuera del landmark `<header>` en un `<div role="search">` separado) -->

## Impact

- `apps/web/src/components/SearchForm.astro` — nuevo componente presentacional (dumb)
- `apps/web/src/lib/types/search-form.ts` — interfaces TypeScript nuevas
- `apps/web/src/lib/config/search-form.ts` — categorías hardcoded + helpers nuevos
- `apps/web/src/lib/config/__tests__/search-form.test.ts` — tests unitarios de `buildSearchHref`
- `apps/web/src/components/__tests__/SearchForm.test.ts` — tests AstroContainer + snapshot
- `apps/web/src/layouts/Layout.astro` — integra `<SearchForm />` bajo `<Header />`
- `apps/web/src/pages/productos/index.astro` — página placeholder nueva (destino del submit)
- `apps/web/.env.example` — variable `SEARCH_RESULTS_PATH` opcional
- `apps/web/e2e/search-form.spec.ts` — E2E Playwright nuevos
- No requiere cambios en `docs/api-spec.yml` (el endpoint `GET /api/v1/products?search=...&categoriaId=...` ya existe)
- No requiere cambios en `docs/data-model.md`
