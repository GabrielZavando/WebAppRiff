## 1. Categoria entity, repository port and DTOs (TDD)

- [x] 1.1 Crear `apps/backend/src/categorias/domain/categoria.entity.ts` con `export interface Categoria { id: string; nombre: string; slug: string; orden: number; activa: boolean; esDefault: boolean; creadoEn: Date; actualizadoEn: Date }`.
- [x] 1.2 Crear `apps/backend/src/categorias/domain/icategoria.repository.ts` con dos puertos (ISP, ≤5 métodos c/u): `ICategoriaRepository` (`create`, `findAll(filter?)`, `findById`, `update`, `remove`) y `ICategoriaIntegrityRepository` (`findBySlug`, `hasAssociatedProducts`, `ensureDefault`), cada uno con su token de inyección (`I_CATEGORIA_REPOSITORY`, `I_CATEGORIA_INTEGRITY_REPOSITORY`).
- [x] 1.3 Crear `apps/backend/src/categorias/infrastructure/categoria-create.dto.ts` (`nombre`, `slug` requeridos; `orden?` number default 0; `activa?` boolean default true) y `categoria-update.dto.ts` (`nombre?`, `slug?`, `orden?`, `activa?`) con `class-validator` (sin `esDefault` editable).
- [x] 1.4 Escribir `apps/backend/src/categorias/infrastructure/categoria-create.dto.spec.ts` y `categoria-update.dto.spec.ts` que fallen primero. Verificar RED.
- [x] 1.5 Test: `CategoriaCreateDto` con `nombre`+`slug` válidos → válido; sin `slug` → inválido. `CategoriaUpdateDto` acepta subset.
- [x] 1.6 Implementar DTOs. Verificar GREEN.

## 2. CategoriaService — business rules (TDD)

- [x] 2.1 Crear `apps/backend/src/categorias/application/categoria.service.ts` con `findAll(activa?)`, `findById(id)`, `create(dto)`, `update(id, dto)`, `remove(id)`, `ensureDefault()` que aplican las reglas de `docs/data-model.md` y delegan en `ICategoriaRepository` (inyectado por token).
- [x] 2.2 Escribir `apps/backend/src/categorias/application/categoria.service.spec.ts` que falle primero. Verificar RED.
- [x] 2.3 Test: `findAll` con filtro `activa` delega el filtro al repository.
- [x] 2.4 Test: `create` con slug duplicado → `ConflictException` (409); slug único → crea.
- [x] 2.5 Test: `remove` de `esDefault` → 409; `remove` con productos asociados → 409; `remove` inexistente → 404; `remove` válido → delega.
- [x] 2.6 Test: `update` inexistente → 404; `update` con slug duplicado → 409; `update` válido → delega.
- [x] 2.7 Test: `ensureDefault` crea la categoría por defecto si falta y no la duplica.
- [x] 2.8 Implementar el service. Verificar GREEN.

## 3. CategoriaRepository — Firestore (TDD, firebase-admin mockeado)

- [x] 3.1 Crear `apps/backend/src/categorias/infrastructure/categoria.repository.ts` que implementa `ICategoriaRepository` usando Firestore (`collection('categorias')`) y consulta `collection('productos').where('categoriaId','==',id).limit(1)` para `hasAssociatedProducts`. Respeta DIP (no importa `firebase-admin` en domain/application).
- [x] 3.2 Escribir `apps/backend/src/categorias/infrastructure/categoria.repository.spec.ts` con `firebase-admin/firestore` (y `getFirestore`) mockeados. Verificar RED.
- [x] 3.3 Test: `create` escribe `categorias/{auto-id}` con los campos y `esDefault: false`.
- [x] 3.4 Test: `findBySlug` retorna el doc correcto o `null`.
- [x] 3.5 Test: `hasAssociatedProducts` retorna `true` si existe un `producto` con `categoriaId`; `false` si no.
- [x] 3.6 Test: `findById`/`findAll`/`update`/`remove` leen/escriben en Firestore y mapean a `Categoria`.
- [x] 3.7 Test: `ensureDefault` crea `sin-categoria` solo si no existe (idempotente).
- [x] 3.8 Implementar el repository. Verificar GREEN.

## 4. CategoriaController — /categories CRUD with guards (TDD)

- [x] 4.1 Crear `apps/backend/src/categorias/infrastructure/categoria.controller.ts` con `@Controller('categories')`: `GET` (público), `GET /:id` (público); `POST` y `DELETE` con `@UseGuards(FirebaseAuthGuard, RolesGuard)` + `@Roles('superadmin','admin')`; `PUT /:id` y `PATCH /:id` con `@UseGuards(FirebaseAuthGuard, RolesGuard)` + `@Roles('superadmin','admin','editor')` (el editor edita pero no crea ni borra). El prefijo `/api/v1` lo aporta `main.ts`, por lo que la ruta real es `/api/v1/categories`.
- [x] 4.2 Escribir `apps/backend/src/categorias/infrastructure/categoria.controller.spec.ts` que falle primero. Verificar RED.
- [x] 4.3 Test: `GET /categories` → delega a `findAll` y retorna el array (será envuelto por el interceptor en runtime).
- [x] 4.4 Test: `POST /categories` con `admin` delega a `create`; `editor` → 403 (vía guard); sin token → 401.
- [x] 4.5 Test: `PUT /categories/:id` con `editor` delega a `update` (editor puede editar); `DELETE /categories/:id` con `editor` → 403.
- [x] 4.6 Implementar el controller. Verificar GREEN.

## 5. CategoriasModule + AppModule wiring

- [x] 5.1 Crear `apps/backend/src/categorias/categorias.module.ts` (`@Module`) que importa `AuthModule` y `FirebaseModule`, declara `CategoriaController` + providers (`CategoriaService`, `{ provide: ICategoriaRepository, useClass: CategoriaRepository }`), e implementa `onModuleInit()` para llamar `service.ensureDefault()`.
- [x] 5.2 Importar `CategoriasModule` en `apps/backend/src/app.module.ts`.
- [x] 5.3 `npm run typecheck` y `npm run build` → exit 0.

## 6. Global prefix /api/v1 (health excluded) + spec paths

- [x] 6.1 Editar `apps/backend/src/main.ts` para añadir `app.setGlobalPrefix('api/v1', { exclude: ['health'] })` antes de `app.listen(...)`. Esto hace que `/users` y `/categories` se sirvan bajo `/api/v1` y el `ResponseInterceptor` existente (envuelve `/api/v1/**`) las envuelva; `/health` queda en raíz sin envolver ni throttle.
- [x] 6.2 Actualizar `docs/api-spec.yml`: paths de rutas API a `/api/v1/...` (`/api/v1/categories`, `/api/v1/categories/{id}`, `/api/v1/users`, `/api/v1/users/{id}`, y análogos de `/products`, `/quotes` si existen). `/health` se mantiene en raíz.
- [x] 6.3 `npm run lint` y `npm test` → verde (el interceptor y el health-throttler guard ya excluyen `/health`, no requieren cambios).

## 7. Validation & SDD

- [x] 7.1 `npm run lint` → exit 0.
- [x] 7.2 `npm test -- --coverage` → all pass, coverage ≥ 90% (branches incluidas).
- [x] 7.3 `openspec validate backend-categorias` → valid.
- [x] 7.4 `openspec status --change backend-categorias` → 4/4 artefactos completos.
- [x] 7.5 Adversarial review (lente Architect/SOLID) sobre `src/categorias/**`.
