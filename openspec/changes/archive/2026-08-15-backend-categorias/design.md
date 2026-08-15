## Context

`backend-scaffold`, `backend-firebase-config`, `backend-commons` y `backend-usuarios` (archivados) entregaron un BFF NestJS runnable: Firebase configurado (tokens `FIREBASE_APP`/`FIRESTORE`/`FIREBASE_AUTH`, `@Global`), CORS, validación global, Throttler (omitindo `/health`), filtro de excepciones, `/health` enriquecido, autenticación (verificación de ID token Firebase + autorización por roles vía custom claims) y CRUD de `/users`.

El `docs/api-spec.yml` ya declara `/categories` (GET público; POST/PUT/DELETE con `bearerAuth`) y los schemas `Categoria`/`CategoriaCreate`/`CategoriaUpdate`. El `docs/data-model.md` define `categorias` con campos `nombre`, `slug` (única global), `orden`, `activa`, `esDefault` (solo en "Sin categoría", id fijo `sin-categoria`, protegida contra borrado) y reglas: slug única global, borrado bloqueado si hay productos asociados, y todo producto debe tener categoría (default "sin-categoria").

**Incoherencia conocida**: `ResponseInterceptor` envuelve solo `/api/v1/**`, pero no hay `setGlobalPrefix('api/v1')`, así que `/users` y `/categories` NO se envuelven en el envelope `{ data, error, meta }` que el spec documenta. Por decisión de diseño (mantener rutas en raíz, coincidiendo con los paths del spec), este change corrige el interceptor para envolver **todas** las rutas excepto `/health`, alineando `/users` y `/categories` con el contrato sin introducir un prefijo global.

Por decisión del usuario, `backend-categorias` es **solo categorías**; `subcategorias` queda en un change posterior que reutilizará `AuthModule` y el patrón de este change.

## Goals / Non-Goals

**Goals:**

- `CategoriaController` en `/categories`: `GET` (público, filtro `?activa`), `GET /:id`, `POST`, `PUT /:id`, `PATCH /:id`, `DELETE /:id` (escrituras con `@UseGuards(FirebaseAuthGuard, RolesGuard)` + `@Roles('superadmin','admin')`).
- Entidad `Categoria`, puerto `ICategoriaRepository`, `CategoriaService` (reglas de negocio), `CategoriaRepository` (Firestore), DTOs `class-validator`.
- Reglas: slug única global → 409; DELETE bloqueado si `esDefault === true` o si hay productos asociados → 409; 404 si no existe.
- Seed idempotente de "Sin categoría" (`id: sin-categoria`, `esDefault: true`).
- Corrección del `ResponseInterceptor` para envolver todas las rutas API excepto `/health`.
- Tests unitarios (TDD) para DTOs, service (reglas), repository y controller (con `firebase-admin` mockeado).

**Non-Goals:**

- NO se implementan `subcategorias` (va en change posterior).
- NO se implementan `productos` (el check de asociación consulta la colección `productos` que existirá en el futuro; el query funciona aunque el módulo no esté construido).
- NO se añaden dependencias nuevas.
- NO se toca `docs/api-spec.yml` (los contratos ya existen; este change solo los cumple).

## Decisions

1. **Prefijo global `/api/v1` (excluyendo `/health`).** Se añade `app.setGlobalPrefix('api/v1', { exclude: ['health'] })` en `main.ts`. Así `/users` y `/categories` pasan a servirse en `/api/v1/users` y `/api/v1/categories`, y el `ResponseInterceptor` existente (que envuelve `/api/v1/**`) las envuelve sin necesitar modificarlo. `/health` queda **excluido** del prefijo, por lo que sigue en raíz (`/health`), sin desplazarse, y el interceptor y el health-throttler guard (que omiten `/health`) siguen aplicando correctamente. Los paths del spec se actualizan a `/api/v1/...` para las rutas API. Esto corrige la incoherencia actual donde `/users` y `/categories` no se envolvían.

2. **GET público; escrituras con roles diferenciados.** `GET /categories` y `GET /categories/{id}` sin guards (catálogo público). `POST` y `DELETE` con `@UseGuards(FirebaseAuthGuard, RolesGuard)` + `@Roles('superadmin','admin')` (solo roles administrativos crean y borran). `PUT`/`PATCH` permiten también `editor` (`@Roles('superadmin','admin','editor')`): el editor puede **editar** categorías pero no crearlas ni borrarlas, según lo acordado. De esta forma el editor contribuye al catálogo sin poder alterar su estructura base.

3. **`esDefault` no editable por cliente.** Ni `CategoriaCreateDto` ni `CategoriaUpdateDto` incluyen `esDefault`; siempre `false` salvo la semilla de "Sin categoría". Evita que un cliente marque otra categoría como default.

4. **Unicidad de slug global → 409.** El service consulta al repository por slug antes de crear/actualizar; si existe y no es el mismo documento → `ConflictException` (409), igual que el spec.

5. **Borrado protegido → 409.** `DELETE` valida: si `esDefault === true` → 409; si existe al menos un producto con `categoriaId === id` (query a `productos`, `limit(1)`) → 409; si no existe el doc → 404.

6. **Check de productos asociados vía colección `productos`.** El repository ejecuta `firestore.collection('productos').where('categoriaId','==',id).limit(1).get()`; funciona aunque el módulo productos no esté implementado. Cumple la regla de integridad de `data-model.md`.

7. **Seed idempotente de "Sin categoría" en arranque.** `CategoriasModule.onModuleInit()` (o un `CategoriaSeeder` invocado desde ahí) llama a `repository.ensureDefault()` que crea `sin-categoria` solo si no existe. Idempotente y sin romper en entornos ya poblados.

8. **Clean Architecture / DIP.** `domain/` y `application/` no importan `firebase-admin`; el repository (en `infrastructure/`) implementa `ICategoriaRepository` y recibe `FIRESTORE` por token. Igual que `backend-usuarios`.

9. **Cero dependencias nuevas.** Firebase Admin SDK ya presente; se reutiliza `AuthModule`.

## Risks / Trade-offs

- **Risk**: borrar categoría con productos → 409 bien manejado; el frontend debe reasignar/mover productos antes de borrar. → **Mitigation**: test del service/repository cubre el camino.
- **Risk**: borrar "Sin categoría" → 409. → **Mitigation**: test cubre.
- **Risk**: dejar el catálogo sin default. → **Mitigation**: seed idempotente en arranque.
- **Trade-off**: corregir el interceptor afecta también a `/users` (ahora sí envuelto). Es deseable y acerca el BFF al contrato; se actualiza `response.interceptor.spec.ts` para cubrir la nueva condición.
- **Trade-off**: GET público expone las categorías (incluida inactivas si no se filtra). El filtro `?activa` permite al catálogo pedir solo activas; por defecto se devuelven todas (el panel admin las necesita).

## Migration Plan

- Semilla de "Sin categoría" en el primer arranque tras el deploy (idempotente, no requiere migración manual).
- Deploy: compatible con `backend-commons` y `backend-usuarios`. Habilita auth en escrituras de categorías y corrige el envelope en todas las rutas API.
- Variables de entorno: ninguna nueva (reusa credenciales Firebase).
- Rollback: revertir commit — `CategoriasModule` deja de importarse; las rutas vuelven a no existir y el interceptor queda en su estado previo (solo `/api/v1/**`). El seed no corre.

## Open Questions

- ¿El filtro `?activa` por defecto debe devolver solo activas o todas? Se eligió "todas" (el admin las necesita); el catálogo público puede pedir `?activa=true`. Confirmable en review. (El rol de editor en escrituras de categorías ya se definió: editor edita vía PUT/PATCH, pero no crea ni borra.)
