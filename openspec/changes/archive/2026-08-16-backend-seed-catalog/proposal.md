## Why

Los servicios de creación de `categorias` y `subcategorias` (Firestore) ya existen y están cubiertos por `backend-categorias` y `backend-subcategorias`. Sin embargo, las colecciones están vacías: no hay forma operativa de poblarlas con la taxonomía real del catálogo Riff de manera repetible y segura. El cliente entregó `seed-categorias-subcategorias.json` en la raíz del repo (contrapropuesta consolidada: 5 categorías + 23 subcategorías, pendiente de aprobación formal antes de producción) con una regla de IDs determinista:

- Categoría: el ID del documento = su `slug`.
- Subcategoría: el ID del documento = `{categoriaSlug}--{subcategoriaSlug}`.

Además, hoy el `slug` de categorías/subcategorías es **obligatorio y se guarda tal cual** (a diferencia de `productos`, que lo autogenera desde `titulo` con `slugify`). Para que el seed y el panel admin sean consistentes con productos, se decide que el `slug` se **autogenere desde `nombre`** (opcional en el DTO, derivado si no se envía), igual que en productos.

Este change entrega (a) el comportamiento de autogeneración de slug para categorías y subcategorías (API + admin), y (b) un comando CLI idempotente `npm run seed:catalog` que lee el JSON y puebla ambas colecciones respetando los IDs deterministas y la regla "omitir si existe".

## What Changes

- **Común**: se mueve `productos/application/slugify.ts` → `common/utils/slugify.ts` (reutilizable por categorías y subcategorías). Sin cambio de comportamiento.
- **Categorías**: `CategoriaCreateDto.slug` pasa a ser opcional (`slug?: string`); `CategoriaService.create` resuelve `const slug = dto.slug ?? slugify(dto.nombre)` antes del check de unicidad global.
- **Subcategorías**: `SubcategoriaCreateDto.slug` pasa a ser opcional; `SubcategoriaService.create` resuelve el slug desde `nombre` antes del check de unicidad compuesta.
- **Repository (soporte seed)**: `CategoriaInput` gana `id?: string` y `esDefault?: boolean`; `SubcategoriaInput` gana `id?: string`. Los `create()` de ambos repos respetan el `id` provisto (si existe) en vez de autogenerarlo, y `esDefault` (categorías, default `false`). Los DTOs HTTP no cambian → el contrato público se mantiene (quien envíe `slug` sigue funcionando). ISP preservado (5 métodos por interfaz).
- **Seed CLI**:
  - `cli/seed/catalog-seed.loader.ts` (application): lee y valida `seed-categorias-subcategorias.json` (ruta por `SEED_FILE_PATH`, default a la raíz del monorepo), resuelve `slug = entry.slug ?? slugify(entry.nombre)`, calcula IDs deterministas y valida que el `categoriaId` referenciado exista en el mapa de categorías del seed. Falla rápido si el JSON está mal formado.
  - `categorias/application/seed-catalog.use-case.ts` (o ubicación neutral): inyecta `ICategoriaRepository` + `ISubcategoriaRepository`; por cada entrada hace `findById(id)` → omite si existe, sino `create({..., id, esDefault})`. Devuelve conteos.
  - `cli/seed-catalog.module.ts` + `cli/seed-catalog.ts`: clona el patrón de `bootstrap-superadmin.ts` (`createApplicationContext`, resuelve el use case, ejecuta, loguea conteos, cierra).
  - `apps/backend/package.json`: `"seed:catalog": "nest build && node dist/cli/seed-catalog.js"`.
- **API spec**: `docs/api-spec.yml` — `CategoriaCreate.required` → `[nombre]`; `SubcategoriaCreate.required` → `[categoriaId, nombre]`; se documenta el autogenerado de slug.
- **Docs**: breve documentación de uso del seed (README o `docs/seed-catalog.md`).

## Capabilities

### New Capabilities
- `backend-seed-catalog`: comando operativo CLI para poblar idempotentemente las colecciones `categorias` y `subcategorias` de Firestore desde `seed-categorias-subcategorias.json`. Usa IDs de documento deterministas (slug para categorías, `{categoriaSlug}--{subcategoriaSlug}` para subcategorías), crea `sin-categoria` con `esDefault: true`, omite entradas ya existentes (por `findBySlug`/`findById`), y deriva el slug desde `nombre` cuando no se provee explícitamente. Incluye un loader con validación de forma del JSON y de referencias padre-hijo.

### Modified Capabilities
- `backend-categorias`: el `slug` deja de ser obligatorio en `POST /api/v1/categories`; si se omite se autogenera desde `nombre` con `slugify` (igual que productos). El check de unicidad global de slug se mantiene sobre el slug resuelto.
- `backend-subcategorias`: el `slug` deja de ser obligatorio en `POST /api/v1/subcategories`; si se omite se autogenera desde `nombre`. El check de unicidad compuesta (`categoriaId + slug`) se mantiene sobre el slug resuelto.

## Impact

- **Código afectado**: `apps/backend/src/common/utils/slugify.ts` (nuevo), `apps/backend/src/productos/application/producto-write.service.ts` (cambia import), `apps/backend/src/categorias/infrastructure/categoria-create.dto.ts`, `apps/backend/src/categorias/application/categoria.service.ts`, `apps/backend/src/categorias/domain/icategoria.repository.ts`, `apps/backend/src/categorias/infrastructure/categoria.repository.ts`, equivalentes de `subcategorias`, y nuevos archivos bajo `apps/backend/src/cli/` y `apps/backend/src/categorias/application/` (use case).
- **API / contratos**: `docs/api-spec.yml` se actualiza (`required` de `CategoriaCreate`/`SubcategoriaCreate`). No se crean ni eliminan endpoints. El sobre `{ data, error, meta }` ya aplica.
- **Dependencias**: cero nuevas (se reutiliza `slugify` existente).
- **Datos**: el seed escribe documentos con IDs deterministas; es idempotente. `sin-categoria` también es asegurado por `CategoriasModule.onModuleInit` (`ensureDefault`), ambos caminos idempotentes y sin conflicto.
- **Riesgo**: el seed usa IDs fijos basados en slug; si el JSON tuviera slugs duplicados o `categoriaId` inexistente, el loader falla rápido (validación). → **Mitigation**: validación estricta en el loader antes de escribir.
- **Riesgo**: cambiar `slug` a opcional en la API podría romper un consumidor que asuma obligatorio. → **Mitigation**: es retrocompatible; quien envíe `slug` funciona igual. Los tests de DTO se actualizan.
- **Riesgo**: `slugify(nombre)` podría colisionar con un slug existente auto-generado de otro `nombre`. → **Mitigation**: el check de unicidad (global/compuesta) sobre el slug resuelto sigue aplicando y retorna 409.
