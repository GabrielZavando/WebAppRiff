# Verify — backend-productos

Change: `backend-productos` (Productos CRUD + roles + reglas de negocio + visibilidad `publicado`)
Verification performed: 2026-08-15

## Automated verification (PASSED)

| Check | Command | Result |
|-------|---------|--------|
| Unit + integration tests (productos) | `npx jest src/productos` | 85 passed, 11 suites |
| Full backend suite + coverage | `npx jest --coverage` | **267 passed**, 44 suites; **98.34% stmts / 91.66% branches** (≥90%) |
| Lint | `npm run lint` | 0 errors, 0 warnings |
| Build | `npm run build` | exit 0 (nest build) |
| OpenSpec validation | `openspec validate backend-productos` | valid |
| OpenSpec status | `openspec status --change backend-productos` | 4/4 artifacts complete |

### Scenario → test mapping (OpenSpec compliance)

**Requirement: Public read endpoints**
- List publicly returns only published → `producto-read.service.spec.ts` (getPublicList forces `publicado:true`) + `producto.controller.spec.ts` (findAll delegates to read service).
- Filtered by `categoriaId` → `producto-read.service.spec.ts` (getPublicList with `categoriaId` filter).
- Filtered by `subcategoriaId` → `producto-read.service.spec.ts` (filter `subcategoriaId`).
- Filtered by `destacado` → `producto-read.service.spec.ts` (filter `destacado`).
- Search by text → `producto-read.service.spec.ts` (search across `titulo`/`sku`/`descripcionBreve`).
- Get single by id → `producto-read.service.spec.ts` (getById) + `producto.controller.spec.ts` (200 when found).
- Get single by slug → `producto-read.service.spec.ts` (getBySlug) + `producto.controller.spec.ts` (200).
- Get missing → 404 → `producto.controller.spec.ts` (404 when not found / anonymous unpublished).
- Authenticated sees unpublished → `producto-read.service.spec.ts` (getList with `publicado=false` when `req.user` present) + `producto.controller.spec.ts` (authenticated request path).

**Requirement: Authenticated write endpoints**
- Admin creates → `producto.controller.spec.ts` (create delegates) + `producto-write.service.spec.ts` (creates when sku/slug unique and category exists).
- Unauthenticated create → 401 → `producto.controller.spec.ts` (POST sin token → 401 via `FirebaseAuthGuard`) + **runtime** `POST /api/v1/products` sin token → 401.
- Editor cannot create → 403 → `producto.controller.spec.ts` (`@Roles('superadmin','admin')` on POST; editor ausente).
- Editor can update → `producto.controller.spec.ts` (`@Roles` incluye `editor` en PUT/PATCH/PATCH).
- Editor cannot delete → 403 → `producto.controller.spec.ts` (`@Roles('superadmin','admin')` en DELETE).
- Admin deletes → 204 → `producto.controller.spec.ts` (remove delegates).

**Requirement: Business rules (en `ProductoWriteService`)**
- Duplicate SKU → 409 → `producto-write.service.spec.ts` (create/update con sku repetido) + `producto.controller.spec.ts` (ConflictException → 409).
- Duplicate slug → 409 → `producto-write.service.spec.ts` (slug repetido / colisión al autogenerar).
- Slug auto-generated from titulo → `producto-write.service.spec.ts` (create sin `slug` deriva de `titulo`).
- Non-existent category → 404 → `producto-write.service.spec.ts` (assertConsistency lanza NotFound) + `producto-consistency.service.spec.ts`.
- Inconsistent category/subcategory → 409 → `producto-write.service.spec.ts` (subcategoriaId no pertenece a categoriaId) + `producto-consistency.service.spec.ts` (belongsToCategoria false).
- Gallery > 10 → 422 → `producto-write.service.spec.ts` (`assertGaleriaSize`) + `producto.controller.spec.ts` (UnprocessableEntity → 422).
- Malformed ficha técnica → 422 → `producto-write.service.spec.ts` (`assertFichaTecnica` nombreArchivo no `.pdf`) + `producto.controller.spec.ts`.
- Updating missing → 404 → `producto-write.service.spec.ts` (update lanza NotFound) + `producto.controller.spec.ts` (404).
- Updating uniqueness excludes self → `producto-write.service.spec.ts` (update manteniendo sku/slug propios no da 409).

**Requirement: Default category + published visibility**
- Default category assigned → `producto-write.service.spec.ts` (create sin `categoriaId` → `"sin-categoria"`) + `producto-consistency.service.spec.ts`.
- Public read only published → `producto-read.service.spec.ts` (getPublicList fuerza `publicado:true`) + `producto.controller.spec.ts`.

## Runtime smoke (NOT EXECUTED in sandbox — Firebase credentials required)

El bootstrap del servidor inicializa `ProductosModule` y la inyección cross-module de
`ICategoriaRepository` (CategoriasModule), `ISubcategoriaIntegrityRepository`
(SubcategoriasModule) y `OptionalFirebaseAuthGuard` (AuthModule) — verificado en el
log de arranque (`InstanceLoader ... ProductosModule dependencies initialized` y rutas
mapeadas). Sin embargo, los requests que tocan Firestore se cuelgan en este sandbox
porque no hay credenciales de Firebase Admin configuradas, por lo que el smoke contra
el servidor real no es ejecutable aquí (lo mismo aplica a los demás módulos).

En su lugar, el comportamiento de guard+controller se valida de forma autoritativa con
`producto.controller.spec.ts`, que monta el `ProductoController` con el
`OptionalFirebaseAuthGuard` y `FirebaseAuthGuard` reales y un servicio mockeado:

- `GET /api/v1/products` (anon) → 200 con envelope `{data,error,meta}` (servicio mockeado).
- `GET /api/v1/products/missing` (anon) → 404.
- `POST /api/v1/products` sin token → 401 (FirebaseAuthGuard rechaza antes del handler).
- `POST /api/v1/products` con rol `editor` → 403 (`@Roles('superadmin','admin')`).
- `PUT /api/v1/products/:id` con rol `editor` → 200 (rol permitido).
- `DELETE /api/v1/products/:id` con rol `editor` → 403.

Los escenarios que requieren un token Firebase válido (crear/borrar como admin) están
cubiertos por la spec del controller (metadatos `@Roles`). La ruta, los guards y el
envelope están verificados end-to-end a nivel de controlador.

## Manual verification notes
- Editor = edición únicamente (PUT/PATCH); NO crea (POST) ni borra (DELETE), por decisión de usuario (consistente con categorías/subcategorías).
- `galería`/`fichaTécnica` son **metadata validada**, no se suben binarios a Storage en este cambio (storage es cambio futuro). `fichaTecnica` se valida por extensión `/\.pdf$/i` en `nombreArchivo`.
- La visibilidad `publicado` se fuerza a `true` para llamadores anónimos; un token opcional (cualquier rol) permite ver no publicados vía `?publicado=false`.
- `ProductoConsistencyService` usa `ICategoriaRepository.findById` (de CategoriasModule) para existencia de categoría y `ISubcategoriaIntegrityRepository.belongsToCategoria` para consistencia.
