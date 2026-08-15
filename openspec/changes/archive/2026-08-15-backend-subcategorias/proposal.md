## Why

`backend-categorias` ya entregó el módulo de categorías. El modelo de dominio (`docs/data-model.md` §3) define `subcategorias` como hijas de `categorias` (1–N), con slug única **dentro de su categoría padre** (compuesta `categoriaId+slug`), y borrado bloqueado si tiene productos asociados. `docs/api-spec.yml` ya declara `/subcategories` (`GET` público, `POST/PUT/PATCH/DELETE` con `bearerAuth`) y los schemas `Subcategoria*`. Nada de eso está implementado aún.

Este change entrega el módulo `subcategorias` siguiendo el mismo patrón TDD y modelo de roles que `backend-categorias` (el editor puede editar pero no crear ni borrar), y deja lista la consulta de consistencia `belongsToCategoria` que el futuro módulo `productos` necesitará para validar que `subcategoriaId` pertenece a la `categoriaId` indicada.

## What Changes

- `apps/backend/src/subcategorias/domain/subcategoria.entity.ts` + `isubcategoria.repository.ts`: entidad y **dos puertos ISP (≤5 métodos c/u)**: `ISubcategoriaRepository` (`create`, `findAll(filter?)`, `findById`, `update`, `remove`) e `ISubcategoriaIntegrityRepository` (`findByCategoriaAndSlug`, `existsById`, `belongsToCategoria`, `hasAssociatedProducts`), cada uno con su token de inyección.
- `apps/backend/src/subcategorias/infrastructure/subcategoria-create.dto.ts` + `subcategoria-update.dto.ts`: DTOs `class-validator` (`categoriaId`, `nombre`, `slug` requeridos en create; todo opcional en update).
- `apps/backend/src/subcategorias/application/subcategoria.service.ts`: reglas de negocio — unicidad compuesta de slug (409), existencia de la categoría padre (404), borrado bloqueado si hay productos asociados (409), 404 si no existe. Inyecta `ICategoriaRepository` (de `backend-categorias`) para validar la categoría padre.
- `apps/backend/src/subcategorias/infrastructure/subcategoria.repository.ts`: Firestore (`collection('subcategorias')`); `hasAssociatedProducts` vía `productos.where('subcategoriaId','==',id).limit(1)`; `findByCategoriaAndSlug` vía `where('categoriaId','==').where('slug','==').limit(1)`.
- `apps/backend/src/subcategorias/infrastructure/subcategoria.controller.ts`: `/subcategories` CRUD con guards; GET público; POST/DELETE `@Roles('superadmin','admin')`; PUT/PATCH `@Roles('superadmin','admin','editor')`.
- `apps/backend/src/subcategorias/subcategorias.module.ts` (importa `AuthModule`, `FirebaseModule` y `CategoriasModule`) + import en `app.module.ts`.
- `apps/backend/src/categorias/categorias.module.ts`: exportar el token `I_CATEGORIA_REPOSITORY` (y `I_CATEGORIA_INTEGRITY_REPOSITORY`) para que `SubcategoriaService` valide la existencia de la categoría padre.
- Tests unitarios/integración (TDD) para DTOs, service, repository (firebase-admin mockeado) y controller.
- `docs/api-spec.yml`: ajustar la descripción de los endpoints `/api/v1/subcategories` para reflejar que el editor edita pero no crea/borra.

## Capabilities

### New Capabilities

- `backend-subcategorias`: CRUD de subcategorías (`GET /api/v1/subcategories` público con filtros `?categoriaId` y `?activa`, `GET /api/v1/subcategories/{id}`, `POST/PUT/PATCH/DELETE /api/v1/subcategories/{id}` restringido a `superadmin`|`admin` en creación/borrado y permitiendo `editor` solo en edición), con reglas de `docs/data-model.md` (slug única compuesta por categoría padre, borrado bloqueado si hay productos). Reutiliza `AuthModule` y el puerto `ICategoriaRepository` para validar la categoría padre.

## Impact

- **Código afectado**: nuevos `apps/backend/src/subcategorias/**`; edición menor de `apps/backend/src/categorias/categorias.module.ts` (exportar token) y `apps/backend/src/app.module.ts`.
- **API / contratos**: implementa contratos ya existentes en `docs/api-spec.yml` (`/subcategories`, `Subcategoria*`, `bearerAuth`); el prefijo global `/api/v1` ya está en `main.ts`.
- **Dependencias**: cero nuevas — Firebase Admin SDK ya presente; se reutiliza `AuthModule` y `CategoriasModule`.
- **Riesgo**: borrar una subcategoría con productos asociados. → **Mitigation**: el repository consulta `productos` por `subcategoriaId`; si existe al menos uno → 409.
- **Riesgo**: slug duplicada dentro de la misma categoría. → **Mitigation**: el service valida `findByCategoriaAndSlug` antes de crear/actualizar → 409.
- **Riesgo**: referencia a categoría padre inexistente. → **Mitigation**: el service valida `ICategoriaRepository.findById(categoriaId)` → 404.
- **Nota de diseño**: el modelo de roles de `docs/data-model.md` dice "Editor: CRUD catálogo", pero por decisión de usuario se aplica el mismo criterio que `backend-categorias` (el editor edita pero no crea ni borra subcategorías) para mantener consistencia entre módulos.
