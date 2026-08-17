## Why

El sitio público del catálogo tiene una página de listado de productos (`/productos`) con cards que incluyen un botón "Ver detalles" que apunta a `/productos/{slug}`, pero esa página no existe actualmente. Los visitantes necesitan ver la información completa de cada producto antes de solicitar una cotización, incluyendo galería de imágenes, especificaciones técnicas, documentación descargable y descripción detallada.

## What Changes

- Nueva página dinámica `/productos/[slug]` que muestra el detalle completo de un producto específico
- Nuevo tipo `ProductDetailPage` en `lib/types/products-page.ts` con los campos necesarios para la página de detalle
- Nueva función `toProductDetailModel` en `lib/products/toProductDetailModel.ts` que transforma `ProductoApi` al modelo de vista
- Nuevo componente `ProductGallery.astro` para la galería de imágenes con thumbnail selector
- Nuevo componente `ProductSpecifications.astro` para mostrar las especificaciones técnicas (atributos)
- Nuevo componente `TechnicalDocs.astro` para la sección de documentación descargable
- Nuevo componente `IndustrialApplications.astro` para la sección estática de aplicaciones industriales
- Nueva función `getProductBySlug` en `lib/api/products.ts` para obtener un producto por slug en build time
- Configuración de rutas dinámicas en Astro para generar páginas estáticas por cada producto
- Tests unitarios para todos los componentes y helpers nuevos
- Tests de integración para la página completa

## Capabilities

### New Capabilities

- `product-detail-page`: Página de detalle completo de producto en `/productos/[slug]` con galería de imágenes, especificaciones técnicas, documentación descargable, descripción larga, sección de aplicaciones industriales (estática) y CTAs de cotización/contacto.

### Modified Capabilities

_Ninguna capability existente se modifica a nivel de requerimiento. Solo se agrega la página de detalle como nueva funcionalidad._

## Impact

- `apps/web/src/pages/productos/[slug].astro` (nueva página dinámica)
- `apps/web/src/lib/types/products-page.ts` (agregar `ProductDetailPage` interface)
- `apps/web/src/lib/products/toProductDetailModel.ts` (nuevo helper)
- `apps/web/src/lib/products/__tests__/toProductDetailModel.test.ts` (tests)
- `apps/web/src/lib/api/products.ts` (agregar `getProductBySlug`)
- `apps/web/src/lib/api/__tests__/products.test.ts` (tests adicionales)
- `apps/web/src/components/ProductGallery.astro` (nuevo componente)
- `apps/web/src/components/ProductSpecifications.astro` (nuevo componente)
- `apps/web/src/components/TechnicalDocs.astro` (nuevo componente)
- `apps/web/src/components/IndustrialApplications.astro` (nuevo componente)
- `apps/web/src/components/__tests__/ProductGallery.test.ts` (tests)
- `apps/web/src/components/__tests__/ProductSpecifications.test.ts` (tests)
- `apps/web/src/components/__tests__/TechnicalDocs.test.ts` (tests)
- `apps/web/src/components/__tests__/IndustrialApplications.test.ts` (tests)
- `apps/web/src/pages/productos/__tests__/[slug].test.ts` (tests de página)
- Backend: **sin cambios**. El endpoint `GET /api/v1/products/slug/:slug` ya existe.
