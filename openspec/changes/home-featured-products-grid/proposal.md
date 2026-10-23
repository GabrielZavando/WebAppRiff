# Proposal: home-featured-products-grid

## Why

La sección "Soluciones Destacadas" del home (`/`) renderiza hoy una lista de
4 productos **hardcodeados** en `lib/config/destacados-section.ts` (constante
`DESTACADOS_SECTION_CONTENT`). Esta lista queda desincronizada del catálogo
real: depender de "mantener a mano" una lista rotulada con imágenes locales
provisionales contradice la razón de ser del Panel (que el cliente gestione el
catálogo, incluido el flag `destacado`, desde el admin Angular) sin tocar
código.

La capa de backend ya soporta el caso de uso: `GET /api/v1/products?destacado=true`
filtra por la propiedad `destacado` del panel y existe el índice compuesto de
Firestore `publicado + destacado + creadoEn DESC` para esa consulta. Solo falta
conectar el frontend y acotar la visual.

## What Changes

- **Nueva fuente de datos build-time**: la página home (`apps/web/src/pages/index.astro`)
  obtiene los productos destacados del backend (propiedad `destacado: true`,
  catálogo público publicado) en el frontmatter durante `astro build`, en lugar
  de leer la constante hardcodeada `DESTACADOS_SECTION_CONTENT`.
- **Límite visual de 8**: el frontend renderiza como máximo 8 productos
  destacados; si el backend devuelve más (o la API devuelve N > 8), la lista se
  corta a los primeros 8 (`slice(0, 8)`) antes de pasarlos como props.
- **Grid responsivo conservado**: la grilla de tarjetas mantiene el layout
  mobile-first existente `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` con gap
  (`gap-6 md:gap-8`); con 5-8 productos fluye automáticamente en 2 filas en
  desktop (4 cols), 2 cols en tablet y 1 col en mobile, sin romper la estética
  de tarjeta blanca elevada.
- **Modelo de tarjeta por API**: `FeaturedProduct` pasa de `imagen`
  (`ImageMetadata` local de `assets/img/`) a `imageUrl` (URL remota de Firebase
  Storage tomada de `galeria[0]` de la API), y el render de imagen de la
  tarjeta deja de usar `astro:assets <Image>` para usar `<img>` directo con
  `loading="lazy"` y `object-contain` (misma estética de mat cuadrado sobre
  tarjeta blanca).
- **Se elimina el contenido estático**: el requisito del spec que exigía la
  constante `DESTACADOS_SECTION_CONTENT` con exactamente 4 productos fijos
  (títulos, slugs, imágenes importadas) queda REMOVID; la sección pasa a ser
  100 % panel-driven (0..8 productos visibles).
- **Degradación conservada**: si la API no responde en build o no hay
  destacados, la sección renderiza igualmente (header + grid vacío), sin romper
  el build — misma política fail-safe que `getPublicProducts()`.

## Capabilities

### New Capabilities

_(ninguna)_ — el comportamiento nuevo vive dentro de la capability existente
`destacados-section` (sección de productos destacados del home).

### Modified Capabilities

- `destacados-section`: la fuente de contenido pasa de la constante
  hardcodeada `DESTACADOS_SECTION_CONTENT` (4 productos con imágenes locales
  importadas) a productos del backend con `destacado: true`, con tope de 8 en
  el frontend, imágenes remotas de Storage vía `galéria[0]`, y validación de
  que la grilla fluye en 2 filas con 5-8 productos. Se modifican los
  requirements de integración en `index.astro`, de imágenes (astro:assets →
  `<img>` remoto), de contenido hardcodeado (REMOVED) y del tope de tarjetas
  (nuevo requirement de límite de 8 y de orden backend-first).

## Impact

- **Código frontend** (`apps/web`):
  - `src/pages/index.astro` — frontmatter: fetch featured + mapeo + slice.
  - `src/components/DestacadosSection.astro` — render de imagen de tarjeta
    (`<img>` con URL remota en vez de `astro:assets <Image>`).
  - `src/lib/types/destacados-section.ts` — contrato `FeaturedProduct`
    (`imagen: ImageMetadata` → `imageUrl: string`), **BREAKING** para el
    componente interno (mismo repo, consumers limitados a index.astro).
  - `src/lib/api/products.ts` — nueva función `getFeaturedProducts()`
    (patrón build-fetch + cache + fallback de `getPublicProducts()`).
  - `src/lib/types/products-page.ts` — `ProductoCardApi` gana el campo opcional
    `destacado?: boolean` (extra de card que el backend ya envía).
  - `src/lib/config/destacados-section.ts` — la constante de productos se
    elimina como fuente de tarjetas (queda solo la copy del header:
    `headline`, `ctaText`, `ctaHref`).
- **Backend** (`apps/backend`): sin cambios — el filtro `destacado` de
  `GET /products` y el índice compuesto ya existen.
- **Tests** (`apps/web`): specs de `DestacadosSection.astro`, de
  `getFeaturedProducts` y de la página home deben actualizarse (los actuales
  fijan el contrato hardcodeado de 4 productos).
- **API**: solo lectura pública existente `GET /api/v1/products?destacado=true`.
- **Riesgo**: el requisito del spec actual "imágenes procesadas por
  astro:assets con src hash _/_astro/..." se desechó conscientemente para
  productos del panel (URLs remotas de Storage); ver design.md § Decision 4.
