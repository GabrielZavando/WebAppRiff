## 1. Subcategoria entity, repository ports and DTOs (TDD)

- [x] 1.1 Crear `apps/backend/src/subcategorias/domain/subcategoria.entity.ts` con `export interface Subcategoria { id: string; categoriaId: string; nombre: string; slug: string; orden: number; activa: boolean; creadoEn: Date; actualizadoEn: Date }`.
- [x] 1.2 Crear `apps/backend/src/subcategorias/domain/isubcategoria.repository.ts` con dos puertos (ISP, ≤5 métodos c/u): `ISubcategoriaRepository` (`create`, `findAll(filter?)`, `findById`, `update`, `remove`) e `ISubcategoriaIntegrityRepository` (`findByCategoriaAndSlug`, `existsById`, `belongsToCategoria`, `hasAssociatedProducts`), cada uno con su token de inyección (`I_SUBCATEGORIA_REPOSITORY`, `I_SUBCATEGORIA_INTEGRITY_REPOSITORY`).
- [x] 1.3 Crear `apps/backend/src/subcategorias/infrastructure/subcategoria-create.dto.ts` (`categoriaId`, `nombre`, `slug` requeridos; `orden?` number default 0; `activa?` boolean default true) y `subcategoria-update.dto.ts` (todo opcional) con `class-validator`.
- [x] 1.4 Escribir `apps/backend/src/subcategorias/infrastructure/subcategoria-create.dto.spec.ts` y `subcategoria-update.dto.spec.ts` que fallen primero. Verificar RED.
- [x] 1.5 Test: `SubcategoriaCreateDto` con `categoriaId`+`nombre`+`slug` válidos → válido; sin `slug` → inválido. `SubcategoriaUpdateDto` acepta subset.
- [x] 1.6 Implementar DTOs. Verificar GREEN.

## 2. SubcategoriaService — business rules (TDD)

- [x] 2.1 Crear `apps/backend/src/subcategorias/application/subcategoria.service.ts` con `findAll(activa?)`, `findById(id)`, `create(dto)`, `update(id, dto)`, `remove(id)` que aplican las reglas de `docs/data-model.md` y delegan en `ISubcategoriaRepository` + `ISubcategoriaIntegrityRepository` (inyectados por token) y validan la categoría padre vía `ICategoriaRepository` (inyectado por token, de `backend-categorias`).
- [x] 2.2 Escribir `apps/backend/src/subcategorias/application/subcategoria.service.spec.ts` que falle primero. Verificar RED.
- [x] 2.3 Test: `findAll` con filtro `categoriaId`/`activa` delega el filtro al repository.
- [x] 2.4 Test: `create` con `categoriaId` inexistente → `NotFoundException` (404); slug duplicado en la misma categoría → `ConflictException` (409); válido → crea.
- [x] 2.5 Test: `update` inexistente → 404; slug duplicado (o cambio de categoría con slug conflicto) → 409; cambio de `categoriaId` a una inexistente → 404; válido → delega.
- [x] 2.6 Test: `remove` inexistente → 404; con productos asociados → 409; válido → delega.
- [x] 2.7 Implementar el service. Verificar GREEN.

## 3. SubcategoriaRepository — Firestore (TDD, firebase-admin mockeado)

- [x] 3.1 Crear `apps/backend/src/subcategorias/infrastructure/subcategoria.repository.ts` que implementa ambos puertos usando Firestore (`collection('subcategorias')`) y consulta `collection('productos').where('subcategoriaId','==',id).limit(1)` para `hasAssociatedProducts`. Respeta DIP (no importa `firebase-admin` en domain/application).
- [x] 3.2 Escribir `apps/backend/src/subcategorias/infrastructure/subcategoria.repository.spec.ts` con `firebase-admin/firestore` (y `getFirestore`) mockeados. Verificar RED.
- [x] 3.3 Test: `create` escribe `subcategorias/{auto-id}` con los campos y timestamps.
- [x] 3.4 Test: `findByCategoriaAndSlug` retorna el doc correcto o `null`.
- [x] 3.5 Test: `hasAssociatedProducts` / `existsById` / `belongsToCategoria` retornan lo esperado.
- [x] 3.6 Test: `findById`/`findAll`/`update`/`remove` leen/escriben en Firestore y mapean a `Subcategoria`.
- [x] 3.7 Implementar el repository. Verificar GREEN.

## 4. SubcategoriaController — /subcategories CRUD with guards (TDD)

- [x] 4.1 Crear `apps/backend/src/subcategorias/infrastructure/subcategoria.controller.ts` con `@Controller('subcategories')`: `GET` (público), `GET /:id` (público); `POST` y `DELETE` con `@UseGuards(FirebaseAuthGuard, RolesGuard)` + `@Roles('superadmin','admin')`; `PUT /:id` y `PATCH /:id` con `@UseGuards(FirebaseAuthGuard, RolesGuard)` + `@Roles('superadmin','admin','editor')` (el editor edita pero no crea ni borra). El prefijo `/api/v1` lo aporta `main.ts`, por lo que la ruta real es `/api/v1/subcategories`.
- [x] 4.2 Escribir `apps/backend/src/subcategorias/infrastructure/subcategoria.controller.spec.ts` que falle primero. Verificar RED.
- [x] 4.3 Test: `GET /subcategories` → delega a `findAll` y retorna el array (será envuelto por el interceptor en runtime).
- [x] 4.4 Test: `POST /subcategories` con `admin` delega a `create`; `editor` → 403; sin token → 401.
- [x] 4.5 Test: `PUT /subcategories/:id` con `editor` delega a `update` (editor puede editar); `DELETE /subcategories/:id` con `editor` → 403.
- [x] 4.6 Implementar el controller. Verificar GREEN.

## 5. SubcategoriasModule + AppModule wiring + CategoriasModule export

- [x] 5.1 Crear `apps/backend/src/subcategorias/subcategorias.module.ts` (`@Module`) que importa `AuthModule`, `FirebaseModule` y `CategoriasModule`, declara `SubcategoriaController` + providers (`SubcategoriaService`, `{ provide: I_SUBCATEGORIA_REPOSITORY, useClass: SubcategoriaRepository }`, `{ provide: I_SUBCATEGORIA_INTEGRITY_REPOSITORY, useClass: SubcategoriaRepository }`). No requiere seed en `onModuleInit` (no hay subcategoría por defecto).
- [x] 5.2 Editar `apps/backend/src/categorias/categorias.module.ts` para exportar `I_CATEGORIA_REPOSITORY` (y `I_CATEGORIA_INTEGRITY_REPOSITORY`) en `exports`, de modo que `SubcategoriaService` pueda inyectarlos.
- [x] 5.3 Importar `SubcategoriasModule` en `apps/backend/src/app.module.ts`.
- [x] 5.4 `npm run typecheck` y `npm run build` → exit 0.

## 6. API spec polish

- [x] 6.1 Editar `docs/api-spec.yml`: actualizar las descripciones de `/api/v1/subcategories` y `/api/v1/subcategories/{id}` para reflejar que el editor edita (PUT/PATCH) pero no crea (POST) ni borra (DELETE), alineado con `backend-categorias`.

## 7. Validation & SDD

- [x] 7.1 `npm run lint` → exit 0.
- [x] 7.2 `npm test -- --coverage` → all pass, coverage ≥ 90% (branches incluidas).
- [x] 7.3 `openspec validate backend-subcategorias` → valid.
- [x] 7.4 `openspec status --change backend-subcategorias` → 4/4 artefactos completos.
