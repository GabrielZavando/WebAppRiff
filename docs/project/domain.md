# Domain — Riff Catálogo Digital Headless

Catálogo digital "headless" de productos para la marca **Riff**: el backend expone una API REST que alimenta un sitio público de catálogo (Astro, SSG) y un panel de administración (Angular).

## Entidades centrales

- **Productos** (`productos`): con SKU y slug únicos, galería de imágenes (máx. 10), ficha técnica PDF, `idExterno` editable independiente del id interno inmutable de Firestore (por vinculación futura con Defontana).
- **Categorías** (`categorias`): incluye la categoría protegida "Sin categoría" (`esDefault: true`, id fijo `sin-categoria`).
- **Subcategorías** (`subcategorias`): slug único por categoría (`categoriaId + slug`).
- **Usuarios** (`usuarios`): roles via Firebase Auth Custom Claims.
- **Cotizaciones** (`cotizaciones`): captura pública de cotización de productos.

## Reglas de integridad gestionadas por el backend

- Unicidad de SKU y slug de producto (consulta previa antes de guardar).
- Unicidad compuesta de slug de subcategoría (`categoriaId + slug`).
- Consistencia categoría/subcategoría: si un producto tiene `subcategoriaId`, debe pertenecer a la `categoriaId` indicada.
- Bloqueo de borrado de categorías/subcategorías en uso (hay productos asociados).
- La categoría "Sin categoría" es protegida: no puede eliminarse bajo ninguna circunstancia.
- Galería con máximo 10 elementos; ficha técnica PDF con validación de tipo y tamaño.

## Flujo de contenido

Las actualizaciones de contenido disparan un nuevo build del sitio Astro (manual desde el panel o webhook automático de categorías).
