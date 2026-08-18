## Why

El buscador global (`SearchForm`) se renderiza hoy en casi todas las páginas porque `Layout.astro` lo muestra por defecto (`showSearch` default `true`), ocultándolo solo en Contacto. El producto requiere restringir y personalizar ese comportamiento en tres frentes:

1. **Alcance**: el buscador debe mostrarse únicamente en Inicio, Productos, Servicios, Cotización y la ficha de producto; y ocultarse en Contacto, Marcas y cualquier ruta futura que no opte explícitamente.
2. **Color de fondo**: en Productos, Servicios, Cotización y la ficha de producto el fondo del buscador debe ser el mismo gradiente linear del header (`bg-linear-to-r from-secondary to-secondary-light`, de `--color-secondary` #1F2D40 a `--color-secondary-light` #35455E) en reposo, para fundirse con el header adyacente (sin hex literal, cumpliendo frontend-standards). Hoy esas páginas usan fondo blanco (navy plano solo al hacer scroll vía CSS).
3. **Select de categorías**: en la página de Productos el `<select name="categoriaId">` no debe renderizarse (el listado ya tiene su propio filtro lateral), manteniéndose en el resto.

Además, las rutas `/servicios` y `/marcas` hoy dan 404 (el menú apunta a ellas). Este change crea ambas páginas con el shell de `Layout` (Header/Footer) y un `<main>` placeholder para llenar en sesiones futuras; `/servicios` muestra el buscador navy y `/marcas` lo oculta.

## What Changes

- `SearchForm.astro` acepta dos nuevos props booleanos: `secondaryBg` (default `false`) y `showCategorySelect` (default `true`). El wrapper elige entre `bg-transparent` (modo hero), `bg-linear-to-r from-secondary to-secondary-light` (gradiente navy del header, nuevo) o `bg-white border-b border-border` (default). El bloque `<select>` se omite cuando `showCategorySelect` es `false`.
- `lib/types/search-form.ts`: `SearchFormProps` añade `secondaryBg?: boolean` y `showCategorySelect?: boolean`.
- `Layout.astro` añade `searchSecondary?: boolean` y `searchShowCategorySelect?: boolean` y los propaga a `SearchForm` vía `searchFormProps`. Mantiene `showSearch` (default `true`).
- Páginas ajustadas: `productos/index.astro` (`searchSecondary` + `searchShowCategorySelect={false}`), `cotizacion.astro` (`searchSecondary`), `productos/[slug].astro` (`searchSecondary` en ambas ramas). `index.astro` y `contacto.astro` sin cambios de buscador.
- Nuevas páginas: `apps/web/src/pages/servicios.astro` (`showSearch searchSecondary` + `<main>` placeholder) y `apps/web/src/pages/marcas.astro` (`showSearch={false}` + `<main>` placeholder).
- Actualización de un comentario obsoleto en `ServicesSection` que decía que `/servicios` era un 404.

## Capabilities

### New Capabilities
<!-- (ninguna — se extiende la capability existente `search-form` y se crean páginas que la consumen) -->

### Modified Capabilities
- `search-form`: se añaden las variantes de visibilidad por página (`showSearch` en Layout), fondo navy (`secondaryBg`) y ocultación del select de categorías (`showCategorySelect`); y se documenta el contrato de las nuevas páginas `/servicios` y `/marcas`.

## Impact

- `apps/web/src/components/SearchForm.astro` — nuevos props `secondaryBg`, `showCategorySelect` y lógica condicional del wrapper/select.
- `apps/web/src/lib/types/search-form.ts` — `SearchFormProps` extendido.
- `apps/web/src/layouts/Layout.astro` — nuevos props `searchSecondary`, `searchShowCategorySelect`; propagación a `SearchForm`.
- `apps/web/src/pages/productos/index.astro` — `searchSecondary` + `searchShowCategorySelect={false}`.
- `apps/web/src/pages/cotizacion.astro` — `searchSecondary`.
- `apps/web/src/pages/productos/[slug].astro` — `searchSecondary` en ambas ramas `<Layout>`.
- `apps/web/src/pages/servicios.astro` — **nueva** página (Layout + `<main>` placeholder, buscador navy).
- `apps/web/src/pages/marcas.astro` — **nueva** página (Layout + `<main>` placeholder, sin buscador).
- `apps/web/src/components/__tests__/SearchForm.test.ts` — nuevos tests para `secondaryBg` y `showCategorySelect`; snapshot por defecto intacto.
- `apps/web/src/layouts/__tests__/Layout.test.ts` — test de Layout para navy con `searchSecondary` y ausencia con `showSearch={false}`.
- `apps/web/e2e/search-form.spec.ts` (+ nuevo `servicios.spec.ts`/`marcas.spec.ts` o ampliación) — verificación E2E de visibilidad, fondo navy y ausencia de select en `/productos`.
- Comentario obsoleto en `apps/web/src/components/__tests__/ServicesSection.test.ts` (y/o `lib/config/services-section.ts`) sobre `/servicios` 404.
- No requiere cambios en `docs/api-spec.yml` (el endpoint de búsqueda ya existe) ni en `docs/data-model.md`.
- No requiere nuevos design tokens (se reusa el gradiente `bg-linear-to-r from-secondary to-secondary-light` del header); no afecta la paridad de tokens con `apps/admin/src/styles/globals.css`.
