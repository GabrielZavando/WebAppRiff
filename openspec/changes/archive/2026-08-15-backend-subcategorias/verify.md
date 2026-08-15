# Verify — backend-subcategorias

Change: `backend-subcategorias` (Subcategorías CRUD + roles + validación de categoría padre)
Verification performed: 2026-08-15

## Automated verification (PASSED)

| Check | Command | Result |
|-------|---------|--------|
| Unit + integration tests | `npx jest src/subcategorias` | 48 passed, 6 suites |
| Full backend suite + coverage | `npx jest --coverage` | 177 passed, 33 suites; **99% stmts / 95.13% branches** (≥90%) |
| Lint | `npm run lint` | 0 errors, 0 warnings |
| Build | `npm run build` | exit 0 (nest build) |
| OpenSpec validation | `openspec validate backend-subcategorias` | valid |
| OpenSpec status | `openspec status --change backend-subcategorias` | 4/4 artifacts complete |

### Scenario → test mapping (OpenSpec compliance)

**Requirement: Public read endpoints**
- List publicly → `subcategoria.controller.spec` (findAll delegates) + runtime `GET /api/v1/subcategories` → 200
- Filtered by `categoriaId` → `subcategoria.controller.spec` (parsed categoriaId/activa) + runtime `GET /api/v1/subcategories?categoriaId=cat-1` → 200
- Get single by id → `subcategoria.service.spec` (returns when found)
- Get missing → 404 → `subcategoria.service.spec` (throws NotFoundException) + runtime `GET /api/v1/subcategories/missing` → 404

**Requirement: Authenticated write endpoints**
- Admin creates → `subcategoria.controller.spec` (create delegates) + `subcategoria.service.spec` (creates when parent exists)
- Unauthenticated create → 401 → `subcategoria.controller.spec` (metadata `@Roles` excludes editor) + **runtime** `POST /api/v1/subcategories` sin token → 401, y con bearer inválido → 401
- Editor cannot create → 403 → `subcategoria.controller.spec` (`@Roles('superadmin','admin')` en create, editor ausente) — runtime 403 requiere token de editor (no ejecutado)
- Editor can update → `subcategoria.controller.spec` (`@Roles` incluye `editor` en update)
- Editor cannot delete → 403 → `subcategoria.controller.spec` (`@Roles('superadmin','admin')` en remove)
- Admin deletes → 204 → `subcategoria.controller.spec` (remove delegates) — runtime requiere token (no ejecutado)

**Requirement: Business rules**
- Duplicate composite slug → 409 → `subcategoria.service.spec` (create y update conflict con `findByCategoriaAndSlug`)
- Parent category missing → 404 → `subcategoria.service.spec` (create y update con `categoriaId` inexistente)
- Delete with products → 409 → `subcategoria.service.spec` (hasAssociatedProducts)
- Update missing → 404 → `subcategoria.service.spec` (update throws NotFoundException)

**Requirement: Integrity queries for product consistency**
- `belongsToCategoria` true → `subcategoria.repository.spec` (returns true)
- `belongsToCategoria` false → `subcategoria.repository.spec` (returns false)

## Runtime smoke (PASSED — partial, token-dependent)

Server boots with `SubcategoriasModule` + cross-module `ICategoriaRepository` injection working.

```
$ PORT=3012 node dist/main.js &
$ curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3012/api/v1/subcategories
200
$ curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3012/api/v1/subcategories?categoriaId=cat-1"
200
$ curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3012/api/v1/subcategories/missing
404
$ curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3012/api/v1/subcategories \
    -H "Content-Type: application/json" -d '{"categoriaId":"cat-1","nombre":"X","slug":"x"}'
401   # sin token
$ curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3012/api/v1/subcategories \
    -H "Authorization: Bearer not-a-real-token" -d '{...}'
401   # bearer inválido
```

- `GET /api/v1/subcategories` → 200 (`{"data":[]}`)
- `GET /api/v1/subcategories?categoriaId=cat-1` → 200 (filtro parseado)
- `GET /api/v1/subcategories/missing` → 404 (NotFound)
- `POST /api/v1/subcategories` sin token / con bearer inválido → 401 (FirebaseAuthGuard)

Los escenarios que requieren un token Firebase válido (crear/borrar como admin, 403 de editor) están cubiertos por la spec del controller (metadatos `@Roles`) y no se ejecutaron en runtime por falta de un usuario real. La ruta, el guard y el envelope están verificados end-to-end en el GET público y en el rechazo 401.

## Manual verification notes
- Editor restricción idéntica a `backend-categorias`: edita (PUT/PATCH) pero no crea (POST) ni borra (DELETE), por decisión de usuario.
- No hay subcategoría por defecto (los productos pueden tener `subcategoriaId: null`); el módulo no semilla nada en `onModuleInit`.
