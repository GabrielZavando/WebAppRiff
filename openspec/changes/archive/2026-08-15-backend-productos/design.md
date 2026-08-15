# Design: backend-productos

## Architecture
Clean Architecture per `docs/backend-standards.md`. Module folder `apps/backend/src/productos/`:

```
productos/
  domain/
    producto.entity.ts                  # Producto interface + ProductoInput/ProductoUpdateInput/ProductoFilter
    iproducto.repository.ts             # IProductRepository, IProductQueryRepository, IProductIntegrityRepository + tokens
  application/
    producto-consistency.service.ts     # category exists + subcategory belongs (cross-module)
    producto-read.service.ts            # findAll(filters), findById, findBySlug
    producto-write.service.ts           # create, update, remove (business rules)
  infrastructure/
    producto.repository.ts              # implements IProductRepository + IProductQueryRepository
    producto-integrity.repository.ts    # implements IProductIntegrityRepository
    producto-create.dto.ts              # POST body (class-validator)
    producto-update.dto.ts              # PUT/PATCH body (PartialType)
    producto.controller.ts              # routes + role guards
  productos.module.ts
```

## SOLID / design decisions
- **ISP** — three ports, each ≤5 methods:
  - `IProductRepository`: `create`, `findById`, `update`, `remove` (4)
  - `IProductQueryRepository`: `findAll(filter)`, `findBySlug(slug)` (2)
  - `IProductIntegrityRepository`: `existsBySku(sku, excludeId?)`, `existsBySlug(slug, excludeId?)` (2)
- **Constructor ≤3 deps (SRP)**:
  - `ProductoConsistencyService` → `ICategoriaIntegrityRepository` + `ISubcategoriaIntegrityRepository` (2)
  - `ProductoReadService` → `IProductQueryRepository` (1)
  - `ProductoWriteService` → `IProductRepository` + `IProductIntegrityRepository` + `ProductoConsistencyService` (3)
  - `ProductoController` → `ProductoReadService` + `ProductoWriteService` (2)
- **DIP**: domain/application never import `firebase-admin`; repositories implement ports via injected Admin SDK.
- **File ≤300 lines, complexity ≤10.**

## Key behaviors
- **Slug auto-generation**: if `slug` omitted on create, derive from `titulo` via a `slugify()` helper; still must be unique (409 if collision). On update, slug change is also uniqueness-checked (excluding self).
- **Published visibility**:
  - Anonymous list/single → `publicado: true` forced.
  - Authenticated (any role, via `OptionalFirebaseAuthGuard`) → respects `?publicado=` filter (or all if omitted).
- **Category/subcategory consistency** (`ProductoConsistencyService`):
  - `categoriaId` defaults to `"sin-categoria"` if omitted.
  - If `subcategoriaId` provided → `ISubcategoriaIntegrityRepository.belongsToCategoria(subcategoriaId, categoriaId)` must be `true`, else 409. This also implies the category exists when consistent.
  - If `subcategoriaId` is `null` → `ICategoriaIntegrityRepository.existsById(categoriaId)` must be `true`, else 404.
- **Uniqueness**: `existsBySku` / `existsBySlug` (global) → 409 on create and on update (excluding self via `excludeId`).
- **Gallery ≤10**: if `galeria.length > 10` → 422. First element is the main image (no extra rule).
- **Ficha técnica metadata**: if provided, must have `url`, `storagePath`, `nombreArchivo` and `nombreArchivo` matches `/\.pdf$/i`; else 422. Binary content-type/size validated at upload (future change).
- **Missing**: get/update/remove on non-existent id → 404.

## API surface (routes under /api/v1/products)
| Method | Route | Auth | Notes |
|--------|-------|------|-------|
| GET | `/products` | public (optional auth) | list published by default; filters: `categoriaId`, `subcategoriaId`, `destacado`, `publicado`, `search`, `sortBy`, `sortDir` |
| GET | `/products/slug/:slug` | public (optional auth) | single by slug (published unless authed) |
| GET | `/products/:id` | public (optional auth) | single by id (published unless authed) |
| POST | `/products` | superadmin, admin | create |
| PUT | `/products/:id` | superadmin, admin, editor | full update |
| PATCH | `/products/:id` | superadmin, admin, editor | partial update |
| DELETE | `/products/:id` | superadmin, admin | remove |

Note: declare `/products/slug/:slug` **before** `/products/:id` so `:id` does not capture the literal `slug`.

## Cross-module wiring
- `SubcategoriasModule` updated to `exports: [I_SUBCATEGORIA_REPOSITORY, I_SUBCATEGORIA_INTEGRITY_REPOSITORY]`.
- `CategoriasModule` already exports `I_CATEGORIA_REPOSITORY`, `I_CATEGORIA_INTEGRITY_REPOSITORY`.
- `AuthModule` gains `OptionalFirebaseAuthGuard` (verifies token if present, attaches `req.user`, does NOT reject anonymous) and exports it.
- `AppModule` imports `ProductosModule`.

## Testing strategy
- DTO specs: validation rules (required `sku`/`titulo`/`categoriaId`, gallery ≤10, ficha técnica shape, optional update fields).
- `ProductoConsistencyService` spec: mocks both integrity ports.
- `ProductoReadService` spec: filter building, published forcing for anonymous.
- `ProductoWriteService` spec: all rules (sku 409, slug 409 + autogen, categoria 404, subcat 409, gallery 422, ficha 422, missing 404, update excludes self, default categoria).
- Repository specs: Firestore Admin SDK mocked; query filters, slug lookup, uniqueness queries.
- Controller spec: routes, role metadata (`@Roles`), envelope, delegation, optional-auth behavior.
- Module spec: compiles and wires dependencies (no bootstrap side effects).
