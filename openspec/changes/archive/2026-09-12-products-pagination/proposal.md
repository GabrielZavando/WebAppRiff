# Proposal — W2: Paginación y proyección en listados públicos de productos + índices Firestore

## Origin

- **Ticket ID**: W2
- **Original title**: Paginación y proyección de campos en listados públicos de productos + índices Firestore
- **Tag (source)**: `[fullstack]` (explicit)
- **Enriched artifact used**: yes (`openspec/tickets/W2-enriched.md`)

## Summary

El endpoint `GET /api/v1/products` devuelve `Producto[]` completo sin paginación ni proyección, incluyendo galería completa (hasta 10 URLs), `descripcionLarga` HTML, `atributos`, `fichaTecnica` y `stock` — campos innecesarios para cards. El catálogo público SSG (`index.astro`) incrusta todo este payload en cada página. `firestore.indexes.json` está vacío; search+sort se resuelven en memoria.

Este cambio añade:
1. Paginación offset (`page`/`limit`) con `meta.total` real vía Firestore `count()`.
2. Proyección **card por defecto para anónimos** (`.select()` Firestore, solo campos de card).
3. Entidad completa paginada para autenticados (admin futuro).
4. Índices compuestos documentados y declarados en `firestore.indexes.json`.
5. Adaptación mínima en web: detalle por slug (sin reutilizar cache del listado card).

## Motivation

- **Rendimiento**: reduce bytes transferidos desde Firestore (`.select()`) y bytes en respuesta HTTP (~70% menos payload por card).
- **Escalabilidad API**: contrato paginado preparado para consumidores futuros (panel admin, apps móviles).
- **Consistencia**: cumple el schema `Pagination` y `ProductoListResponse` ya declarados en `api-spec.yml`.
- **Prerequisito para Q3**: e2e de flujos completos necesita listados funcionales y performantes.
