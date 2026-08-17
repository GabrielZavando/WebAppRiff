## Context

El sitio público del catálogo digital Riff es una aplicación Astro SSG (Static Site Generation) que genera páginas estáticas en build time. Actualmente existe la página de listado `/productos` que muestra cards con un botón "Ver detalles" que apunta a `/productos/{slug}`, pero esa página no existe.

El backend NestJS ya expone el endpoint `GET /api/v1/products/slug/:slug` que retorna un producto completo por su slug. El frontend tiene la función `getPublicProducts()` que obtiene todos los productos en build time y los cachea a nivel de módulo.

El diseño de la página de detalle (ver `ProductPage.jpg` y prototipo HTML) incluye:
1. Hero section con galería de imágenes, categoría, título, descripción y especificaciones
2. Sección estática de "Aplicaciones Industriales" (3 cards de marketing)
3. Sección de "Documentación Técnica" con PDFs descargables
4. CTAs de "Solicitar Cotización" y "Contactar Asesor"

## Goals / Non-Goals

**Goals:**
- Generar una página estática por cada producto publicado en build time
- Mostrar información completa del producto: galería, especificaciones, documentación
- Mantener consistencia con el diseño existente (tokens, iconos Lucide, flat design)
- Funcionar sin JavaScript (progressive enhancement)
- Cumplir con los estándares de testing (Vitest, AstroContainer)
- SEO-friendly: meta tags, structured data, URLs limpias

**Non-Goals:**
- No implementar lógica de filtros o búsqueda en esta página (eso es de `/productos`)
- No agregar campos nuevos al backend (el modelo actual es suficiente)
- No implementar la funcionalidad de "Contactar Asesor" (será un mailto o formulario futuro)
- No agregar animaciones complejas ni transiciones
- No implementar lazy loading de imágenes (ya está en los componentes existentes)

## Decisions

### 1. Rutas dinámicas con `getStaticPaths` (DECIDIDO)

**Decisión:** Usar `getStaticPaths` en Astro para generar páginas estáticas por cada producto.

**Razón:** Astro SSG requiere que todas las rutas se conozcan en build time. `getStaticPaths` es la forma nativa de definir rutas dinámicas que generan archivos HTML estáticos. Esto garantiza:
- Build time: se genera `dist/productos/{slug}.html` por cada producto
- Runtime: no hay llamadas a API, todo está embebido en el HTML
- SEO: los motores de búsqueda indexan todas las páginas

**Alternativa considerada:** ISR (Incremental Static Regeneration) con `output: 'hybrid'` — descartada porque el proyecto actualmente es `output: 'static'` puro y no queremos cambiar la configuración.

### 2. Fetch de un solo producto vs reutilizar lista completa (DECIDIDO)

**Decisión:** Crear una nueva función `getProductBySlug()` que hace fetch de un solo producto, pero reutilizando el cache existente de `getPublicProducts()`.

**Razón:** En build time, Astro ejecuta `getStaticPaths` que necesita la lista de slugs. Luego, para cada página, ejecuta el frontmatter que necesita los datos del producto. Si hacemos fetch individual por cada producto, serían N llamadas HTTP. Mejor:
1. `getStaticPaths` llama a `getPublicProducts()` (1 fetch, cacheado)
2. Para cada página, el frontmatter llama a `getProductBySlug(slug)` que busca en el cache
3. Si no está en cache (no debería pasar), hace fetch individual como fallback

**Alternativa considerada:** Hacer un solo fetch de todos los productos y pasar todo el array al frontmatter — descartada porque `getStaticPaths` necesita solo los slugs, no todos los datos.

### 3. Componentes modulares vs componente único (DECIDIDO)

**Decisión:** Separar en 4 componentes: `ProductGallery`, `ProductSpecifications`, `TechnicalDocs`, `IndustrialApplications`.

**Razón:** Cada componente tiene una responsabilidad clara (SRP):
- `ProductGallery`: manejo de imágenes con thumbnail selector
- `ProductSpecifications`: renderizado de atributos técnicos
- `TechnicalDocs`: sección de documentación descargable
- `IndustrialApplications`: sección estática de marketing

Esto facilita testing, reutilización y mantenimiento.

**Alternativa considerada:** Componente único `ProductDetail` — descartada porque violaría SRP y dificultaría tests.

### 4. Sección de Aplicaciones Industriales estática (DECIDIDO)

**Decisión:** La sección de "Aplicaciones Industriales" será estática y se repetirá en todos los productos.

**Razón:** Según feedback del usuario, esta sección es contenido de marketing que no depende del producto específico. Es más simple implementarla como estática que agregar un campo al modelo de producto.

**Alternativa considerada:** Hacerla dinámica desde el backend — descartada porque el usuario confirmó que debe ser estática.

### 5. Galería de imágenes con selector de thumbnails (DECIDIDO)

**Decisión:** Implementar una galería con imagen principal grande y thumbnails clickeables debajo.

**Razón:** El prototipo HTML y la imagen `ProductPage.jpg` muestran este patrón. El usuario puede ver todas las imágenes del producto sin scrolling.

**Implementación:**
- Estado local con JavaScript para manejar la imagen seleccionada
- Sin JavaScript: se muestra la primera imagen (progressive enhancement)
- Thumbnails con `cursor-pointer` y borde de selección

### 6. Ficha técnica: sección siempre visible (DECIDIDO)

**Decisión:** La sección "Documentación Técnica" se renderiza SIEMPRE, incluso cuando el producto no tiene `fichaTecnica`. Si existe `fichaTecnica`, se muestra un enlace de descarga directa al PDF; si es `null`, se muestra un CTA "Solicitar ficha técnica" que enlaza a `/contacto`.

**Razón:** Preferencia del cliente en etapa de desarrollo: la sección debe estar presente aunque aún no haya documento técnico para descargar. El modelo de datos ya soporta `fichaTecnica: {url, storagePath, nombreArchivo} | null`. La UI del prototipo muestra "Catálogo Técnico" y "Manual de Usuario" como PDFs descargables cuando existen.

**Implementación:**
- Renderizar siempre el `<section>` con heading + descripción
- Si `fichaTecnica` no es null: enlace con `download` attribute, icono `lucide:file-text` y nombre de archivo
- Si `fichaTecnica` es null: CTA `<a href="/contacto">` con texto "Solicitar ficha técnica" e icono `lucide:mail`
- El CTA de contacto y el enlace de descarga son mutuamente excluyentes

## Risks / Trade-offs

### Riesgo 1: Build time elevado con muchos productos
**Riesgo:** Si hay miles de productos, el build generará miles de archivos HTML.
**Mitigación:** El proyecto actual tiene ~71 productos (según seed). Si crece significativamente, se puede migrar a ISR o SSR selectivo. Por ahora es aceptable.

### Riesgo 2: Imágenes de Firebase Storage
**Riesgo:** Las URLs de Firebase Storage pueden expirar o cambiar.
**Mitigación:** Las URLs son públicas (Firebase Storage rules) y están cacheadas en build time. Si cambian, se necesita rebuild. Esto es aceptable para MVP.

### Riesgo 3: Contenido estático de Aplicaciones Industriales
**Riesgo:** Si el cliente quiere personalizar esta sección por producto, tendremos que refactorizar.
**Mitigación:** Documentar que es estática. Si se necesita dinámica, se puede agregar un campo `aplicaciones` al modelo de producto en el futuro.

### Riesgo 4: SEO sin structured data
**Riesgo:** Las páginas de producto no tendrán structured data (JSON-LD) en MVP.
**Mitigación:** Agregar en futuro. Por ahora, los meta tags básicos son suficientes.

## Migration Plan

1. **Pre-deploy:** Verificar que todos los tests pasan
2. **Deploy:** El build de Astro generará las páginas estáticas automáticamente
3. **Verificación:** Navegar a `/productos/{slug}` de un producto existente
4. **Rollback:** Revertir el commit y redeployar (las páginas estáticas desaparecerán)

## Open Questions

1. **¿Necesitamos structured data (JSON-LD) para SEO?** — Pendiente para futuro
2. **¿La sección de "Aplicaciones Industriales" debe ser editable desde el admin?** — Por ahora es estática
3. **¿Necesitamos breadcrumbs de navegación?** — Podría ser útil pero no está en el prototipo
