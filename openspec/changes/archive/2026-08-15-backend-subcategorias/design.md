# Design — backend-subcategorias

## Overview

Mismo patrón de Clean Architecture que `backend-categorias`. Nuevo módulo `subcategorias` bajo
`apps/backend/src/subcategorias/` con carpetas `domain/`, `application/`, `infrastructure/`.
Reutiliza `AuthModule` (guards + `@Roles`) y el puerto `ICategoriaRepository` de `backend-categorias`.

## Domain layer

`subcategoria.entity.ts`:

```ts
export interface Subcategoria {
  id: string;
  categoriaId: string;
  nombre: string;
  slug: string;
  orden: number;
  activa: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}
```

`isubcategoria.repository.ts` (split ISP, ≤5 métodos c/u):

- `ISubcategoriaRepository` (token `I_SUBCATEGORIA_REPOSITORY`):
  - `create(input: SubcategoriaInput): Promise<Subcategoria>`
  - `findAll(filter?: SubcategoriaFilter): Promise<Subcategoria[]>`
  - `findById(id: string): Promise<Subcategoria>`
  - `update(id: string, input: SubcategoriaUpdateInput): Promise<Subcategoria>`
  - `remove(id: string): Promise<void>`
- `ISubcategoriaIntegrityRepository` (token `I_SUBCATEGORIA_INTEGRITY_REPOSITORY`):
  - `findByCategoriaAndSlug(categoriaId: string, slug: string): Promise<Subcategoria | null>`
  - `existsById(id: string): Promise<boolean>`
  - `belongsToCategoria(subcategoriaId: string, categoriaId: string): Promise<boolean>`
  - `hasAssociatedProducts(subcategoriaId: string): Promise<boolean>`

Tipos:

```ts
export type SubcategoriaInput = {
  categoriaId: string;
  nombre: string;
  slug: string;
  orden?: number;
  activa?: boolean;
};
export type SubcategoriaUpdateInput = {
  categoriaId?: string;
  nombre?: string;
  slug?: string;
  orden?: number;
  activa?: boolean;
};
export type SubcategoriaFilter = { categoriaId?: string; activa?: boolean };
```

## Application layer

`subcategoria.service.ts` — constructor inyecta 3 dependencias (dentro del límite de ≤3 parámetros):

1. `@Inject(I_SUBCATEGORIA_REPOSITORY) repository: ISubcategoriaRepository`
2. `@Inject(I_SUBCATEGORIA_INTEGRITY_REPOSITORY) integrity: ISubcategoriaIntegrityRepository`
3. `@Inject(I_CATEGORIA_REPOSITORY) categoriaRepository: ICategoriaRepository` (de `backend-categorias`; valida la categoría padre)

Métodos y reglas:

- `findAll(filter?)`: delega a `repository.findAll`.
- `findById(id)`: `repository.findById`; si `null` → `NotFoundException` (404).
- `create(dto)`:
  - `categoriaRepository.findById(dto.categoriaId)` → si `null` → `NotFoundException` (404) "parent category not found".
  - `integrity.findByCategoriaAndSlug(dto.categoriaId, dto.slug)` → si existe → `ConflictException` (409).
  - `repository.create(dto)`.
- `update(id, dto)`:
  - `existing = findById(id)` (404 si falta).
  - `effectiveCategoriaId = dto.categoriaId ?? existing.categoriaId`.
  - si `dto.categoriaId` provisto y distinto → validar padre existe (404).
  - si cambia `slug` o la categoría → `findByCategoriaAndSlug(effectiveCategoriaId, effectiveSlug)` excluyendo el propio `id` → 409 si encontrado.
  - `repository.update(id, dto)`.
- `remove(id)`:
  - `findById(id)` (404 si falta).
  - `integrity.hasAssociatedProducts(id)` → si `true` → `ConflictException` (409).
  - `repository.remove(id)`.

## Infrastructure layer

DTOs (`class-validator`):

- `SubcategoriaCreateDto`: `@IsString() categoriaId`, `@IsString() nombre`, `@IsString() slug`;
  `@IsOptional() @IsInt() orden` (default 0), `@IsOptional() @IsBoolean() activa` (default true).
- `SubcategoriaUpdateDto`: todos `@IsOptional()` (`@IsString()` / `@IsInt()` / `@IsBoolean()`).

`subcategoria.repository.ts` (implementa ambos puertos; inyecta `FIRESTORE`):

- `create`: `addDoc(collection, { ...input, creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp() })`; retorna el doc mapeado.
- `findAll(filter)`: `collection('subcategorias')`; si `filter.categoriaId` → `where('categoriaId','==',...)`; si `filter.activa !== undefined` → `where('activa','==',...)`; `getDocs`; mapea.
- `findById`: `getDoc(doc(id))`; retorna mapeado o `null`.
- `update`: `updateDoc(doc(id), { ...input, actualizadoEn: serverTimestamp() })`.
- `remove`: `deleteDoc(doc(id))`.
- `findByCategoriaAndSlug`: `collection.where('categoriaId','==').where('slug','==').limit(1)` → primero o `null`.
- `existsById`: `getDoc(doc(id))` → `.exists`.
- `belongsToCategoria`: lee el doc; compara `data.categoriaId === categoriaId`.
- `hasAssociatedProducts`: `collection('productos').where('subcategoriaId','==',id).limit(1).get()` → `size > 0`.

`subcategoria.controller.ts` — `@Controller('subcategories')`:

- `GET` (público) → `findAll` (query `categoriaId`, `activa`).
- `GET /:id` (público) → `findById`.
- `POST` + `@UseGuards(FirebaseAuthGuard, RolesGuard)` + `@Roles('superadmin','admin')` → `create`.
- `PUT /:id` + `PATCH /:id` + guards + `@Roles('superadmin','admin','editor')` → `update`.
- `DELETE /:id` + guards + `@Roles('superadmin','admin')` → `remove`.

## Wiring

- `subcategorias.module.ts`: `imports: [AuthModule, FirebaseModule, CategoriasModule]`;
  `controllers: [SubcategoriaController]`; `providers: [SubcategoriaService,
  { provide: I_SUBCATEGORIA_REPOSITORY, useClass: SubcategoriaRepository },
  { provide: I_SUBCATEGORIA_INTEGRITY_REPOSITORY, useClass: SubcategoriaRepository }]`.
- `categorias.module.ts`: añadir `exports: [I_CATEGORIA_REPOSITORY, I_CATEGORIA_INTEGRITY_REPOSITORY]`
  para que el token inyectado sea visible desde `SubcategoriasModule`.
- `app.module.ts`: añadir `SubcategoriasModule` a los imports.
- Sin cambios en `main.ts` (prefijo global `/api/v1` ya aplicado).

## Testing (TDD)

- G1 DTOs (2 specs), G2 Service (reglas, repos fake), G3 Repository (Firestore mockeado),
  G4 Controller (guards / `@Roles`), G5 Module wiring (+ export de `categorias.module.ts`).

## Notes

- La restricción de editor espeja `backend-categorias` (solo edición) a pesar de que
  `docs/data-model.md` dice "Editor: CRUD catálogo". Decisión intencional del usuario para consistencia.
- No hay subcategoría "por defecto" (los productos pueden tener `subcategoriaId: null`).
- `belongsToCategoria` se especifica ahora para la futura regla de consistencia de `productos`.
