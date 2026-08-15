# Proposal: backend-productos

## Context
The catalog's central entity is `productos` (`docs/data-model.md` §1). The `categorias` and `subcategorias` modules are implemented and archived; products have **no backend yet**. This change implements the NestJS BFF module for products: public read endpoints (consumed by the Astro SSG site) and authenticated admin/editor CRUD, enforcing the documented domain rules (global SKU/slug uniqueness, category/subcategory consistency, gallery ≤10, ficha técnica metadata validation).

## Decisions (confirmed with user)
1. **Editor role = edit-only** (PUT/PATCH), consistent with `categorias`/`subcategorias`. Create/Delete restricted to `superadmin`/`admin`. (Note: deviates from the literal `data-model.md` "Editor: CRUD catálogo" — established precedent for consistency.)
2. **Public GET returns only `publicado: true`** (the public catalog). Authenticated users (any role, via an optional auth guard) may see all, including unpublished.
3. **Galería and ficha técnica are validated metadata** (`{url, storagePath, alt, orden}` / `{url, storagePath, nombreArchivo}`). Binary upload to Firebase Storage is **out of scope** (separate change).

## Scope (in)
- `Producto` entity + input/filter types
- ISP-split ports: `IProductRepository`, `IProductQueryRepository`, `IProductIntegrityRepository` (each ≤5 methods)
- Application services: `ProductoReadService`, `ProductoWriteService`, `ProductoConsistencyService` (≤3 constructor deps each, per `docs/backend-standards.md`)
- Firestore repositories (`productos` collection) + integrity (sku/slug uniqueness)
- Controller: public read (published-only for anonymous) + role-restricted write; envelope `{data, error, meta}`; routes under `/api/v1/products`
- Module wiring; `SubcategoriasModule` must export `I_SUBCATEGORIA_INTEGRITY_REPOSITORY`; `AppModule` import
- `OptionalFirebaseAuthGuard` in `AuthModule` (verifies token if present, attaches `req.user`, does not reject anonymous)
- `docs/api-spec.yml` `/api/v1/products` entries updated
- TDD tests: DTOs, services, repositories (unit + integration)

## Out of scope
- Firebase Storage binary upload endpoints (galería images, ficha técnica PDF) — separate change
- `cotizaciones` module — separate change
- Image optimization / CDN — frontend concern

## Dependencies
- `CategoriasModule` (exports `I_CATEGORIA_REPOSITORY`, `I_CATEGORIA_INTEGRITY_REPOSITORY`) — exists, archived
- `SubcategoriasModule` (must export `I_SUBCATEGORIA_REPOSITORY`, `I_SUBCATEGORIA_INTEGRITY_REPOSITORY`) — exists, archived; **needs export update**
- `AuthModule` (`FirebaseAuthGuard`, `verifyToken` use-case) — exists; **needs `OptionalFirebaseAuthGuard`**

## Risks / notes
- Large module: implemented incrementally via tasks (read path first). Can be split into read/write changes later if preferred — flagged, not done.
- Slug auto-generation from `titulo` must be deterministic and still unique (409 on collision).
