## Why

`backend-usuarios` ya entregó autenticación (verificación de ID token Firebase + autorización por roles vía custom claims) y dejó listos `AuthModule` y los guards para reutilizar en los módulos de dominio. El roadmap original difería Auth, pero por decisión del usuario se reordenó: Auth primero, luego `backend-categorias` (solo categorías; subcategorías quedan en un change posterior).

`docs/api-spec.yml` ya declara `/categories` (GET público, POST/PUT/DELETE con `bearerAuth`) y los schemas `Categoria`/`CategoriaCreate`/`CategoriaUpdate`. `docs/data-model.md` define la entidad `categorias` y reglas de negocio: slug única global, la categoría "Sin categoría" (id fijo `sin-categoria`, `esDefault: true`) protegida contra borrado, y borrado bloqueado si hay productos asociados. Nada de eso está implementado aún.

Además existe una incoherencia en el BFF: el `ResponseInterceptor` solo envuelve rutas `/api/v1/**`, pero no hay prefijo global, así que `/users` y `/categories` NO se envuelven en el envelope `{ data, error, meta }` que el spec documenta. Este change corrige el interceptor para envolver todas las rutas excepto `/health`, alineando `/users` y `/categories` con el contrato.

## What Changes

- `apps/backend/src/categorias/domain/categoria.entity.ts` + `icategoria.repository.ts`: entidad y puerto (`ICategoriaRepository`).
- `apps/backend/src/categorias/infrastructure/categoria-create.dto.ts` + `categoria-update.dto.ts`: DTOs `class-validator` (sin `esDefault` editable).
- `apps/backend/src/categorias/application/categoria.service.ts`: reglas de negocio (slug única → 409; delete bloqueado si `esDefault` o con productos → 409; 404 si no existe; filtro `?activa`; asegurar categoría por defecto).
- `apps/backend/src/categorias/infrastructure/categoria.repository.ts`: Firestore (`collection('categorias')`), con `firebase-admin` mockeado en tests; método para chequear productos asociados en `productos`.
- `apps/backend/src/categorias/infrastructure/categoria.controller.ts`: `/categories` CRUD con `@UseGuards(FirebaseAuthGuard, RolesGuard)` + `@Roles('superadmin','admin')` en escrituras; GET público.
- `apps/backend/src/categorias/categorias.module.ts` + import en `app.module.ts`.
- `apps/backend/src/main.ts`: añadir `app.setGlobalPrefix('api/v1', { exclude: ['health'] })` para que `/users` y `/categories` se sirvan bajo `/api/v1` y el `ResponseInterceptor` existente (envuelve `/api/v1/**`) las envuelva; `/health` queda en raíz sin envolver.
- `docs/api-spec.yml`: actualizar paths de rutas API a `/api/v1/...` (`/api/v1/categories`, `/api/v1/users`, etc.).
- Seed idempotente de la categoría "Sin categoría" (`id: sin-categoria`, `esDefault: true`) en el arranque del módulo.
- Tests unitarios (TDD) para DTOs, service (reglas), repository y controller (con `firebase-admin` mockeado).

## Capabilities

### New Capabilities

- `backend-categorias`: CRUD de categorías (`GET /categories` público con filtro `?activa`, `GET /categories/{id}`, `POST/PUT/PATCH/DELETE /categories/{id}` restringido a `superadmin`|`admin`), con reglas de negocio de `docs/data-model.md` (slug única global, protección de "Sin categoría", borrado bloqueado si hay productos asociados), envelope de respuesta estándar en todas las rutas API (excepto `/health`), y semilla de la categoría por defecto. Reutiliza `AuthModule` para la autorización.

## Impact

- **Código afectado**: nuevos `apps/backend/src/categorias/**`; cambios en `apps/backend/src/common/interceptors/response.interceptor.ts` (+ spec) y `apps/backend/src/app.module.ts`.
- **API / contratos**: implementa contratos ya existentes en `docs/api-spec.yml` (`/categories`, `Categoria*`, `bearerAuth`); se añade el prefijo global `/api/v1` (excluyendo `/health`) y se actualizan los paths del spec a `/api/v1/...` para alinear rutas con el envelope ya documentado. Escrituras de categorías: editor edita (PUT/PATCH) pero no crea ni borra.
- **Dependencias**: cero nuevas — Firebase Admin SDK ya presente; se reutiliza `AuthModule`.
- **Riesgo**: borrar una categoría con productos asociados. → **Mitigation**: el repository consulta `productos` por `categoriaId`; si existe al menos uno → 409.
- **Riesgo**: dejar el catálogo sin la categoría por defecto. → **Mitigation**: seed idempotente en arranque que crea `sin-categoria` si falta.
- **Riesgo**: slug duplicada. → **Mitigation**: el service valida unicidad antes de crear/actualizar → 409.
