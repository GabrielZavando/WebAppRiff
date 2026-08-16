## 1. ProductoInput.id opcional (TDD)

- [x] 1.1 En `apps/backend/src/productos/domain/producto.entity.ts`, añadir `id?: string` a `ProductoInput`.
- [x] 1.2 En `apps/backend/src/productos/infrastructure/producto.repository.ts` `create`: `const id = input.id ?? this.firestore.collection(COLLECTION).doc().id;` y usar `id` en `doc(id).set(...)`.
- [x] 1.3 Escribir/actualizar `apps/backend/src/productos/infrastructure/producto.repository.spec.ts` que falle primero para los nuevos casos. Verificar RED.
- [x] 1.4 Test repo: `create({ ..., id: 'prod-001' })` crea el documento con ese `id` exacto.
- [x] 1.5 Test repo: `create({ ... })` sin `id` autogenera un id distinto de `undefined`/vacío.
- [x] 1.6 Verificar GREEN, `typecheck`. (ISP preservado: `IProductRepository` sigue con 4 métodos.)

## 2. ProductoSeedLoader (TDD)

- [x] 2.1 Crear `apps/backend/src/cli/seed/producto-seed.loader.ts` con `loadProductoSeed(filePath?: string): ProductoSeed` que: resuelve la ruta (`filePath ?? process.env.SEED_FILE_PATH ?? 'seed-productos-71.json'`, caminata hacia la raíz del monorepo), lee y parsea el JSON, valida que `productos` sea un objeto; cada item con `sku`/`titulo` no vacíos y `precio.{valor:number, visible:boolean}`; resuelve `slug = item.slug ?? slugify(titulo)`; `categoriaId ?? 'sin-categoria'`; `subcategoriaId` opcional/null; `galeria` permitido vacío; **descarta `precio.moneda`**; asigna `id` = la clave del dict del seed.
- [x] 2.2 Escribir `apps/backend/src/cli/seed/producto-seed.loader.spec.ts` que falle primero. Verificar RED.
- [x] 2.3 Test loader: con un JSON de ejemplo, cada item resuelve `id` = clave del dict y `slug` explícito se respeta.
- [x] 2.4 Test loader: item sin `slug` deriva vía `slugify(titulo)`.
- [x] 2.5 Test loader: `precio.moneda` ausente en la salida del loader.
- [x] 2.6 Test loader: JSON mal formado (campo faltante / `productos` no es objeto) lanza error claro.
- [x] 2.7 Implementar el loader. Verificar GREEN.

## 3. SeedProductosUseCase (TDD)

- [x] 3.1 Crear `apps/backend/src/cli/seed/seed-productos.use-case.ts` con `SeedProductosUseCase` que inyecta `IProductRepository`, `IProductIntegrityRepository` y `ProductoConsistencyService` (3 deps) y expone `execute(seed: ProductoSeed): Promise<SeedResult>` (conteos: productosCreados/omitidos). Por cada producto: `findById(id)` → si existe `omitidos++` y continúa; sino `assertConsistency(categoriaId, subcategoriaId)` + `existsBySku`/`existsBySlug` y `create({ ...input, id })`, `creados++`.
- [x] 3.2 Escribir `apps/backend/src/cli/seed/seed-productos.use-case.spec.ts` que falle primero. Verificar RED.
- [x] 3.3 Test use case (repos mockeados): crea cada producto con el `id` determinista correcto; omite si `findById` retorna existente (idempotencia, no llama `create` dos veces).
- [x] 3.4 Test use case: llama `assertConsistency` y `existsBySku`/`existsBySlug` antes de crear (reutiliza reglas de dominio).
- [x] 3.5 Test use case: categoría inexistente ⇒ lanza error claro (vía `assertConsistency`).
- [x] 3.6 Implementar el use case. Verificar GREEN.

## 4. EnsureSeedSubcategorias (TDD)

- [x] 4.1 Crear `apps/backend/src/cli/seed/ensure-seed-subcategorias.ts` (provider `@Injectable()` con 1 dep `ISubcategoriaRepository`) que crea idempotentemente `medicion-de-fluidos--medidores-de-nivel` (nombre "Medidores de Nivel", slug "medidores-de-nivel", `categoriaId:"medicion-de-fluidos"`, `activa:true`, `orden:99`) si no existe (`findById` → `create` con `id` compuesto).
- [x] 4.2 Escribir `apps/backend/src/cli/seed/ensure-seed-subcategorias.spec.ts` que falle primero. Verificar RED.
- [x] 4.3 Test: al ejecutar sobre repo ya poblado, omite (no duplica); sobre vacío, crea con el `id` compuesto.
- [x] 4.4 Implementar. Verificar GREEN.

## 5. Seed module + CLI (TDD)

- [x] 5.1 Crear `apps/backend/src/cli/seed-productos.module.ts` (`@Module`) que importa `ConfigModule.forRoot({ isGlobal: true })`, `FirebaseModule`, `FirestoreModule`, `CategoriasModule`, `SubcategoriasModule`, `ProductosModule`, y provee `SeedProductosUseCase` + `EnsureSeedSubcategorias` + `ProductoConsistencyService`.
- [x] 5.2 Crear `apps/backend/src/cli/seed-productos.ts` que clona `seed-catalog.ts`: `NestFactory.createApplicationContext(SeedProductosModule)`, `const seed = loadProductoSeed(process.env.SEED_FILE_PATH)`, resuelve `EnsureSeedSubcategorias` y `SeedProductosUseCase`, ejecuta pre-paso + `execute(seed)`, `Logger.log` de conteos, `app.close()`; en `catch` loguea el mensaje (sin exponer secrets) y `process.exit(1)`.
- [x] 5.3 Escribir `apps/backend/src/cli/seed-productos.spec.ts` (wiring, como `seed-catalog.spec.ts`): con repositorios mockeados, verificar que el loader + use case resuelven y crean las entidades esperadas, y que un loader con JSON mal formado falla.
- [x] 5.4 En `apps/backend/package.json`, añadir `"seed:productos": "nest build && node dist/cli/seed-productos.js"`.
- [x] 5.5 Verificar `build --workspace=@riff/backend` y `typecheck`.

## 6. Documentación

- [x] 6.1 Crear/actualizar documentación breve de uso en `docs/seed-catalog.md` (sección "Seed de Productos"): comando `npm run seed:productos`, variable `SEED_FILE_PATH`, comportamiento idempotente, prerrequisito `seed:catalog`, subcategoría `Medidores de Nivel`, y que `galeria` queda vacía (migración de imágenes en ticket aparte).
- [x] 6.2 Confirmar que `docs/api-spec.yml` NO cambia (no hay cambio de contrato HTTP).

## 7. Validación & SDD

- [x] 7.1 `npm run lint --workspace=@riff/backend` → exit 0.
- [x] 7.2 `npm run typecheck --workspace=@riff/backend` → exit 0.
- [x] 7.3 `npm test --workspace=@riff/backend -- --coverage` → all pass + coverage ≥ 90% en archivos nuevos/modificados (global: 98.28% stmts / 92.22% branches / 97.09% funcs / 98.71% lines).
- [x] 7.4 `npm run build --workspace=@riff/backend` → exit 0.
- [x] 7.5 `openspec validate backend-seed-productos` → valid.
- [x] 7.6 `openspec status --change backend-seed-productos` → artefactos completos.
- [x] 7.7 Escenarios Gherkin de `backend-seed-productos` (R1–R5) verificados contra tests; delta de `backend-productos` (`ProductoInput.id`) verificado contra tests del repository.

## 8. Resolución de colisiones de slug (post-apply)

- [x] 8.1 En `apps/backend/src/cli/seed/producto-seed.loader.ts`, añadir constantes `SEED_PRODUCTOS_EXCLUIR: ReadonlySet<string> = new Set(['prod-054'])` y `SEED_PRODUCTOS_SLUG_OVERRIDE: Readonly<Record<string, string>> = { 'prod-069': 'medidor-cuenta-litros-flowtech-hil' }`.
- [x] 8.2 En `loadProductoSeed`, filtrar los ids excluidos antes de mapear y sobreescribir el `slug` según el mapa de override.
- [x] 8.3 Escribir test en `producto-seed.loader.spec.ts` (RED primero): `prod-054` ausente de la salida y `prod-069.slug === 'medidor-cuenta-litros-flowtech-hil'`.
- [x] 8.4 Implementar y verificar GREEN.
- [x] 8.5 `npm run lint` + `typecheck` del backend → exit 0.
- [x] 8.6 Re-ejecutar `npm run seed:productos` (idempotente): omite los existentes, crea los restantes (70 total). Verificado vía consulta directa a Firestore: 70 docs, 0 huérfanos, `prod-054` ausente, `prod-069.slug = medidor-cuenta-litros-flowtech-hil`.
- [x] 8.7 `openspec validate backend-seed-productos` → valid.
