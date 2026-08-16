## 1. slugify compartido en common (TDD)

- [x] 1.1 Crear `apps/backend/src/common/utils/slugify.ts` con la función `slugify(input: string): string` (mover la lógica actual de `productos/application/slugify.ts`: NFD, quita diacríticos, minúsculas, no-alfanuméricos → `-`, trim de guiones).
- [x] 1.2 Escribir `apps/backend/src/common/utils/slugify.spec.ts` que falle primero (la función no existe en common). Verificar RED.
- [x] 1.3 Test: `slugify('Válvula de Control')` → `'valvula-de-control'`.
- [x] 1.4 Test: `slugify('Conexión Rápida 10mm')` → `'conexion-rapida-10mm'`; `slugify('Producto (Edición Especial)')` → `'producto-edicion-especial'`; `slugify('  --Tubo  -- ')` → `'tubo'`; `slugify('Tubo PVC 110')` → `'tubo-pvc-110'`.
- [x] 1.5 Implementar `common/utils/slugify.ts` y su spec. Verificar GREEN.
- [x] 1.6 En `apps/backend/src/productos/application/producto-write.service.ts`, cambiar el import de `./slugify` a `@/common/utils/slugify` (o ruta relativa correspondiente). Eliminar `productos/application/slugify.ts` y su spec. Verificar `test --workspace=@riff/backend` y `typecheck`.

## 2. Categorías: slug opcional + autogenerado (TDD)

- [x] 2.1 En `apps/backend/src/categorias/infrastructure/categoria-create.dto.ts`, cambiar `slug` a `@IsOptional() @IsString() @IsNotEmpty() slug?: string`.
- [x] 2.2 Escribir/actualizar `apps/backend/src/categorias/infrastructure/categoria-create.dto.spec.ts` que falle primero en los nuevos casos. Verificar RED.
- [x] 2.3 Test DTO: un DTO sin `slug` pero con `nombre` válido pasa la validación (ya no es inválido por falta de slug).
- [x] 2.4 Test DTO: si `slug` se envía vacío (`''`), sigue siendo inválido (`@IsNotEmpty()`).
- [x] 2.5 En `apps/backend/src/categorias/application/categoria.service.ts` `create`: `const slug = dto.slug ?? slugify(dto.nombre);` e usar `slug` en el check de unicidad y en el `CategoriaInput`. Importar `slugify` desde common.
- [x] 2.6 Escribir/actualizar `apps/backend/src/categorias/application/categoria.service.spec.ts` que falle primero. Verificar RED.
- [x] 2.7 Test service: crear sin `slug` deriva `slug` desde `nombre` (p. ej. `nombre: 'Medición de Fluidos'` → `slug: 'medicion-de-fluidos'`).
- [x] 2.8 Test service: crear con `slug` explícito lo usa tal cual.
- [x] 2.9 Test service: slug resuelto duplicado retorna 409 (ConflictException) — comportamiento existente preservado.
- [x] 2.10 Actualizar `openspec/changes/backend-seed-catalog/specs/backend-categorias/spec.md` (delta ADDED: slug opcional + autogen).
- [x] 2.11 Verificar GREEN, `typecheck`, `build`.

## 3. Subcategorías: slug opcional + autogenerado (TDD)

- [x] 3.1 En `apps/backend/src/subcategorias/infrastructure/subcategoria-create.dto.ts`, cambiar `slug` a opcional (`@IsOptional() @IsString() @IsNotEmpty() slug?: string`).
- [x] 3.2 Escribir/actualizar `apps/backend/src/subcategorias/infrastructure/subcategoria-create.dto.spec.ts` que falle primero. Verificar RED.
- [x] 3.3 Test DTO: válido sin `slug` (con `categoriaId` y `nombre`).
- [x] 3.4 Test DTO: `slug` vacío sigue inválido.
- [x] 3.5 En `apps/backend/src/subcategorias/application/subcategoria.service.ts` `create`: validar padre primero, luego `const slug = dto.slug ?? slugify(dto.nombre);` y usar `slug` en `findByCategoriaAndSlug` y en el `SubcategoriaInput`. Importar `slugify` desde common.
- [x] 3.6 Escribir/actualizar `apps/backend/src/subcategorias/application/subcategoria.service.spec.ts` que falle primero. Verificar RED.
- [x] 3.7 Test service: crear sin `slug` deriva desde `nombre` (p. ej. `nombre: 'Medidores Electromagnéticos'` → `slug: 'medidores-electromagneticos'`), padre existe.
- [x] 3.8 Test service: slug compuesto duplicado retorna 409.
- [x] 3.9 Actualizar `openspec/changes/backend-seed-catalog/specs/backend-subcategorias/spec.md` (delta ADDED: slug opcional + autogen).
- [x] 3.10 Verificar GREEN, `typecheck`, `build`.

## 4. Repository: soporte de id explícito + esDefault (TDD)

- [x] 4.1 En `apps/backend/src/categorias/domain/icategoria.repository.ts`, añadir `id?: string` y `esDefault?: boolean` a `CategoriaInput`.
- [x] 4.2 En `apps/backend/src/subcategorias/domain/isubcategoria.repository.ts`, añadir `id?: string` a `SubcategoriaInput`.
- [x] 4.3 En `apps/backend/src/categorias/infrastructure/categoria.repository.ts` `create`: `const id = input.id ?? this.firestore.collection(COLLECTION).doc().id;` y `esDefault: input.esDefault ?? false;`.
- [x] 4.4 En `apps/backend/src/subcategorias/infrastructure/subcategoria.repository.ts` `create`: `const id = input.id ?? this.firestore.collection(COLLECTION).doc().id;`.
- [x] 4.5 Escribir/actualizar `apps/backend/src/categorias/infrastructure/categoria.repository.spec.ts` que falle primero para los nuevos casos. Verificar RED.
- [x] 4.6 Test repo categoría: `create({..., id: 'medicion-de-fluidos' })` crea el documento con ese `id` exacto.
- [x] 4.7 Test repo categoría: `create({..., esDefault: true })` persiste `esDefault: true`; sin `esDefault` persiste `false`.
- [x] 4.8 Test repo categoría: `create` sin `id` autogenera un id distinto de `undefined`/vacío.
- [x] 4.9 Escribir/actualizar `apps/backend/src/subcategorias/infrastructure/subcategoria.repository.spec.ts` que falle primero. Verificar RED.
- [x] 4.10 Test repo subcategoría: `create({..., id: 'x--y' })` crea con ese `id`.
- [x] 4.11 Verificar GREEN, `typecheck`, `build`. (ISP preservado: sigue habiendo 5 métodos por interfaz.)

## 5. CatalogSeedLoader (TDD)

- [x] 5.1 Crear `apps/backend/src/cli/seed/catalog-seed.loader.ts` con `loadCatalogSeed(filePath?: string): CatalogSeed` que: resuelve la ruta (`filePath ?? process.env.SEED_FILE_PATH ?? <default raíz monorepo>`), lee y parsea el JSON, valida la forma (tipos, `categorias` y `subcategorias` objetos; cada categoría con `nombre`; cada subcategoría con `categoriaId` y `nombre`), resuelve `slug = entry.slug ?? slugify(entry.nombre)`, asigna `id` (categoría = slug; subcategoría = `${categoriaId}--${slug}`), y valida que cada `categoriaId` de subcategoría exista entre las categorías del seed.
- [x] 5.2 Escribir `apps/backend/src/cli/seed/catalog-seed.loader.spec.ts` que falle primero. Verificar RED.
- [x] 5.3 Test loader: con un JSON de ejemplo, las categorías resuelven `id === slug` y las subcategorías `id === \`${categoriaId}--${slug}\``; `sin-categoria` trae `esDefault: true`.
- [x] 5.4 Test loader: `slug` ausente en una entrada se deriva vía `slugify(nombre)`.
- [x] 5.5 Test loader: JSON mal formado (campo faltante / no es objeto) lanza error claro.
- [x] 5.6 Test loader: subcategoría con `categoriaId` inexistente lanza error claro.
- [x] 5.7 Implementar el loader. Verificar GREEN.

## 6. SeedCatalogUseCase (TDD)

- [x] 6.1 Crear `apps/backend/src/categorias/application/seed-catalog.use-case.ts` (o ubicación neutral `apps/backend/src/cli/seed/seed-catalog.use-case.ts`) con `SeedCatalogUseCase` que inyecta `ICategoriaRepository` + `ISubcategoriaRepository` y expone `execute(seed: CatalogSeed): Promise<SeedResult>` (conteos: categoriasCreadas/omitidas, subcategoriasCreadas/omitidas). Por cada categoría: `findById(id)` → si existe `omitidas++` y continúa; sino `create({ nombre, slug, orden, activa, id, esDefault: entry.esDefault ?? false })` y `creadas++`. Igual para subcategorías (con `id` compuesto). El `SeedResult` se devuelve para el logging del CLI.
- [x] 6.2 Escribir `apps/backend/src/categorias/application/seed-catalog.use-case.spec.ts` que falle primero. Verificar RED.
- [x] 6.3 Test use case (repos mockeados): crea cada categoría con el `id` correcto y `esDefault` correcto (incl. `sin-categoria` true).
- [x] 6.4 Test use case: crea cada subcategoría con `id` compuesto y `categoriaId` resuelto.
- [x] 6.5 Test use case: al re-ejecutar sobre repos ya poblados (findById retorna existente), omite todas (idempotencia) y no llama a `create` una segunda vez.
- [x] 6.6 Test use case: el orden de creación es categorías primero, luego subcategorías.
- [x] 6.7 Implementar el use case. Verificar GREEN.

## 7. Seed module + CLI (TDD)

- [x] 7.1 Crear `apps/backend/src/cli/seed-catalog.module.ts` (`@Module`) que importa `ConfigModule.forRoot({ isGlobal: true })`, `FirebaseModule`, `FirestoreModule`, `CategoriasModule`, `SubcategoriasModule`, y provee `SeedCatalogUseCase` (y `CatalogSeedLoader` si aplica como provider/export).
- [x] 7.2 Crear `apps/backend/src/cli/seed-catalog.ts` que clona `bootstrap-superadmin.ts`: `NestFactory.createApplicationContext(SeedCatalogModule)`, `const seed = loadCatalogSeed(process.env.SEED_FILE_PATH)`, resuelve `SeedCatalogUseCase`, `execute(seed)`, `Logger.log` de conteos, `app.close()`; en `catch` loguea el mensaje (sin exponer secrets) y `process.exit(1)`.
- [x] 7.3 Escribir `apps/backend/src/cli/seed-catalog.spec.ts` (wiring, como `bootstrap-superadmin.spec.ts`): con repositorios mockeados, `loadCatalogSeed` + `SeedCatalogUseCase` resueltos en un módulo de testing, verificar que `execute` crea las entidades esperadas y que un loader con JSON mal formado falla. Verificar RED→GREEN.
- [x] 7.4 En `apps/backend/package.json`, añadir `"seed:catalog": "nest build && node dist/cli/seed-catalog.js"`.
- [x] 7.5 Verificar `build --workspace=@riff/backend` y `typecheck`.

## 8. API spec + documentación

- [x] 8.1 En `docs/api-spec.yml`: `CategoriaCreate` → `required: [nombre]` (quitar `slug`); `SubcategoriaCreate` → `required: [categoriaId, nombre]` (quitar `slug`). Añadir descripción a ambos `slug` indicando que se autogenera desde `nombre` si se omite.
- [x] 8.2 Crear/actualizar documentación breve de uso (`docs/seed-catalog.md` o sección en README): comando `npm run seed:catalog`, variable `SEED_FILE_PATH`, comportamiento idempotente, y que `sin-categoria` se crea con `esDefault: true`.
- [x] 8.3 Verificar GREEN y `typecheck`.

## 9. Validación & SDD

- [x] 9.1 `npm run lint --workspace=@riff/backend` → exit 0.
- [x] 9.2 `npm run typecheck --workspace=@riff/backend` → exit 0.
- [x] 9.3 `npm test --workspace=@riff/backend -- --coverage` → all pass + coverage ≥ 90% en archivos nuevos/modificados.
- [x] 9.4 `npm run build --workspace=@riff/backend` → exit 0.
- [x] 9.5 `openspec validate backend-seed-catalog` → valid.
- [x] 9.6 `openspec status --change backend-seed-catalog` → artefactos completos.
- [x] 9.7 Escenarios Gherkin de `backend-seed-catalog` (R1–R6) verificados contra tests; deltas de `backend-categorias`/`backend-subcategorias` (slug autogen) verificados contra tests de DTO/service.
