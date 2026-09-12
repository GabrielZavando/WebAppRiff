# Requirements — W2: Paginación y proyección en listados públicos de productos

## R1: Paginación offset en el listado de productos
El endpoint `GET /api/v1/products` soporta parámetros `page` (default 1) y `limit` (default 24, cap 100) con respuesta paginada `{ data, meta: { total, page, limit } }`.
- Traceability: SC-001, SC-002, SC-003, SC-004, SC-005

## R2: Proyección card por defecto para anónimos
Requests sin token de autenticación retornan una proyección lean (campos de card: id, sku, titulo, slug, descripcionBreve, categoriaId, subcategoriaId, precio, destacado, publicado, creadoEn, galeria[0]) usando `.select()` de Firestore.
- Traceability: SC-001, SC-006, SC-007, SC-008, SC-009, SC-012

## R3: Entidad completa para autenticados
Requests con token válido retornan la entidad Producto completa (todos los campos) paginada.
- Traceability: SC-002

## R4: Validación de parámetros de paginación
`page` y `limit` se parsean como enteros; valores no numéricos retornan HTTP 400; valores fuera de rango se clampean (page ≥ 1, limit ≤ 100).
- Traceability: SC-004, SC-005

## R5: Total real vía Firestore count()
`meta.total` retorna el conteo real de documentos que matchean los filtros, usando Firestore `count()` aggregation query para el camino nativo, o longitud del array para el camino en memoria.
- Traceability: SC-001, SC-002, SC-003, SC-012

## R6: Merge de meta en el interceptor
El `ResponseInterceptor` mergea la meta del handler (`total`, `page`, `limit`) con su meta own (`timestamp`, `path`) sin romper endpoints que no retornen meta de paginación.
- Traceability: SC-010, SC-011

## R7: Camino dual Firestore (nativo vs in-memory)
Repository usa Firestore nativo (`.select()`, `.orderBy()`, `.offset()`, `.limit()`, `count()`) para queries sin search ni sortBy alternativo. Para search o sortBy por titulo/precio/actualizadoEn, usa fetch completo + filter/sort en memoria + slice paginado.
- Traceability: SC-012, SC-008, SC-009

## R8: Web — detalle por slug sin cache reuse
`getProductBySlug` elimina la reutilización del cache del listado (que ahora contiene cards) y realiza un fetch independiente por slug.
- Traceability: SC-014

## R9: Web — tipo ProductoCardApi compatible
Nuevo tipo `ProductoCardApi` (lean) compatible con `ProductoApi` para que `applyProductFilters` funcione sin cambios sobre los campos disponibles.
- Traceability: SC-013

## R10: Índices Firestore documentados y declarados
`firestore.indexes.json` declara al menos 4 índices compuestos; `data-model.md` los documenta con la matriz de filtros+sort.
- Traceability: SC-016, SC-017

## R11: api-spec.yml actualizado antes del código
El contrato OpenAPI refleja los params `page`/`limit`, schema `ProductoCard`, y `meta: Pagination` real antes de implementar.
- Traceability: SC-015

## R12: Cobertura y regresión
Tests del interceptor verifican que endpoints no paginados (categorías, subcategorías, detalle) no se ven afectados. Cobertura backend ≥ 90% en archivos tocados.
- Traceability: SC-010, SC-011
