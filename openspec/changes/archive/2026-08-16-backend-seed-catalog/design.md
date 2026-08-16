## Context

`backend-categorias` y `backend-subcategorias` (archivados) entregan el CRUD de Firestore con validación de integridad, pero las colecciones están vacías. El cliente entregó `seed-categorias-subcategorias.json` en la raíz del repo con la taxonomía (5 categorías + 23 subcategorías) y una regla de IDs determinista explícita en su `_readme`: ID de categoría = `slug`; ID de subcategoría = `{categoriaSlug}--{subcategoriaSlug}`.

Hoy el `slug` de categorías/subcategorías es **obligatorio y se guarda tal cual** (no hay `slugify` para ellos; solo `productos` lo tiene en `productos/application/slugify.ts`). El usuario definió definitivamente que el slug **se autogenere desde `nombre`** a nivel API + seed, igual que en productos. Verifiqué que todos los `slug` del JSON ya equivalen a `slugify(nombre)`, por lo que la autogeneración es consistente con los IDs deterministas del seed.

Existe un patrón CLI de bootstrap (`cli/bootstrap-superadmin.ts` + `BootstrapModule` + `BootstrapSuperadminUseCase`) que el seed reutiliza como plantilla (contexto de aplicación sin HTTP, resuelve un use case, cierra). `CategoriasModule.onModuleInit` ya asegura `sin-categoria` vía `ensureDefault()` (idempotente).

`docs/backend-standards.md` exige Clean Architecture: `domain/`/`application/` no importan `firebase-admin`; las dependencias externas se declaran como interfaces en `domain/` y se inyectan. ISP: ≤5 métodos por interfaz de puerto. Esto guía el diseño del seed (use case en `application` que inyecta los repositorios ya existentes).

## Goals / Non-Goals

**Goals:**
- Slug opcional en `CategoriaCreateDto`/`SubcategoriaCreateDto`, autogenerado desde `nombre` con `slugify` cuando no se provee; check de unicidad (global/compuesta) sobre el slug resuelto.
- `slugify` compartido en `common/utils` (DRY), reutilizado por productos, categorías y subcategorías.
- Comando CLI `seed:catalog` que lee `seed-categorias-subcategorias.json` y puebla ambas colecciones con IDs deterministas, idempotente ("omitir si existe").
- `sin-categoria` creada con `esDefault: true` e id `sin-categoria`.
- Tests TDD (RED → GREEN → refactor) para toda lógica nueva y modificada.

**Non-Goals:**
- NO se modifican endpoints existentes ni se crean nuevos HTTP.
- NO se cambia el comportamiento de `productos` (solo se mueve su `slugify` de carpeta).
- NO se puebla la colección `productos` (fuera de alcance).
- NO se cambia `ensureDefault` ni la lógica de borrado protegido.
- NO se introducen dependencias nuevas.

## Decisions

1. **`slugify` compartido en `common/utils/slugify.ts`.** Se mueve desde `productos/application/slugify.ts` (y su spec) y se actualiza el import en `producto-write.service.ts`. Alternativa: duplicar la función en cada módulo → descartada (DRY, riesgo de divergencia).

2. **Slug opcional + autogenerado en servicios.** `CategoriaService.create`/`SubcategoriaService.create` resuelven `const slug = dto.slug ?? slugify(dto.nombre)` antes del check de unicidad. El DTO usa `@IsOptional() @IsString() @IsNotEmpty()` sobre `slug`. Alternativa: generar el slug en el controller → descartada (la lógica de negocio vive en el service, no en presentación).

3. **Extensión mínima del contrato del repository (sin nuevos métodos).** `CategoriaInput` gana `id?: string` y `esDefault?: boolean`; `SubcategoriaInput` gana `id?: string`. Los `create()` usan `input.id ?? firestore.collection(...).doc().id` y (categoría) `esDefault: input.esDefault ?? false`. Esto permite al seed crear documentos con ID determinista y `esDefault` sin tocar los DTOs HTTP → el contrato público queda intacto. Alternativa: añadir métodos `createWithId` → descartada (violaría ISP, 6 métodos).

4. **IDs deterministas desde el seed.** Categoría: `id = slug` (resuelto). Subcategoría: `id = \`${entry.categoriaId}--${slug}\``, con `categoriaId = entry.categoriaId` (que coincide con el ID de la categoría padre). El seed usa `findById(id)` para idempotencia (no depende de unicidad por slug). Alternativa: dejar que Firestore autogenere el ID y guardar el slug → descartada (el `_readme` del JSON exige IDs deterministas para evitar colisiones entre subcategorías de distintas categorías).

5. **El seed usa el repository directamente (no el service HTTP).** `SeedCatalogUseCase` inyecta `ICategoriaRepository`/`ISubcategoriaRepository` y llama `create({..., id, esDefault})` + `findById(id)` para idempotencia. No pasa por `CategoriaService` (que no acepta `id` ni `esDefault` y lanzaría 409 en duplicados). Esto es consistente con Clean Architecture: el use case orquesta puertos de dominio. Alternativa: exponer un método en el service → descartada (acoplaría la semántica operativa al service HTTP).

6. **Loader con validación estricta.** `CatalogSeedLoader` lee el JSON (vía `SEED_FILE_PATH` o default a raíz del monorepo), valida la forma (tipos, presencia de `nombre`/`slug` o capacidad de derivar, `categoriaId` de subcategorías presente y resoluble entre las categorías del propio seed) y falla rápido con mensaje claro. Alternativa: escribir directo sin validar → descartada (silencia datos corruptos).

7. **`sin-categoria` en el seed y vía `ensureDefault`.** El seed incluye la entrada `sin-categoria` (esDefault true, id `sin-categoria`). `CategoriasModule.onModuleInit` → `ensureDefault()` también la crea si falta. Ambos idempotentes y producen el mismo documento; al correr el seed, `ensureDefault` ya la habrá creado y el loader la omite. No hay conflicto.

8. **Timestamps con `new Date()` (no `serverTimestamp`).** El `_readme` del JSON pide `serverTimestamp()`, pero todos los repos del proyecto usan `new Date()` en las escrituras. Se alinea el seed a esa convención para consistencia. Desviación menor y deliberada, documentada.

9. **Patrón CLI clonado de `bootstrap-superadmin`.** `seed-catalog.ts` usa `NestFactory.createApplicationContext(SeedCatalogModule)`, resuelve `SeedCatalogUseCase`, ejecuta `execute(loader.load())`, loguea conteos y cierra. Script `seed:catalog` = `nest build && node dist/cli/seed-catalog.js`.

10. **Actualizar `docs/api-spec.yml`.** `CategoriaCreate.required` → `[nombre]`; `SubcategoriaCreate.required` → `[categoriaId, nombre]`; se añade descripción de autogenerado. El api-spec es fuente de verdad y se actualiza antes de implementar (SDD).

## Risks / Trade-offs

- **Risk**: el seed crea documentos con IDs fijos; un JSON con `slug` duplicado entre categorías o `categoriaId` inexistente podría causar errores de Firestore. → **Mitigation**: el loader valida forma y referencias antes de escribir; falla rápido.
- **Risk**: hacer `slug` opcional en la API podría romper un cliente que lo envíe vacío esperando error. → **Mitigation**: `@IsNotEmpty()` sigue aplicando si se envía; solo es opcional su ausencia. Retrocompatible.
- **Risk**: `slugify(nombre)` colisiona con slug ya existente de otro nombre. → **Mitigation**: el check de unicidad sobre el slug resuelto retorna 409 (comportamiento existente preservado).
- **Trade-off**: desviación de `serverTimestamp` a `new Date()` en el seed → aceptada por consistencia con el código existente.
- **Trade-off**: el seed usa el repository (no el service) para fijar IDs → ligera duplicación conceptual del "arma el input", pero evita alterar el contrato del service HTTP.

## Migration Plan

- No hay migración de datos existente (las colecciones están vacías). El seed escula y repetible.
- Deploy: el seed se ejecuta como comando operativo (`npm run seed:catalog`) contra el entorno objetivo (staging/producción) con las credenciales Firebase correspondientes. No requiere desplegar el servidor HTTP.
- Rollback: no aplica (es poblado inicial); si se requiere limpiar, se eliminan los documentos creados (respetando que `sin-categoria` está protegida contra borrado manual—el seed la puede dejar).
- Variables de entorno: las del backend Firebase (ya en `.env.example`); opcional `SEED_FILE_PATH` para apuntar a otro archivo de seed.

## Open Questions

- ¿El cliente aprueba formalmente la taxonomía del JSON antes de correr en producción? (El `_readme` del archivo lo marca como "pendiente de aprobación formal del cliente".) El change es agnóstico al contenido: pobló lo que el archivo diga.
- ¿Se desea que el seed también pueda actualizar (upsert) en vez de solo omitir? Acordado: "omitir si existe" (idempotente, no pisa ediciones manuales).
