## Context

`backend-productos` entrega el CRUD de `productos` con validación de integridad (unicidad SKU/slug, categoría por defecto `sin-categoria`, consistencia categoría/subcategoría, galería ≤10, ficha técnica PDF). El catálogo está vacío. El cliente entregó `seed-productos-71.json` en la raíz del repo con 71 productos de confianza ALTA y un `_readme` que impone: (a) usar la clave de cada objeto (`prod-001`…) como ID del documento en Firestore, y (b) dejar `galeria` vacía hasta migrar imágenes.

Existe un patrón CLI de seed ya implementado y archivado (`backend-seed-catalog` → comando `seed:catalog`): un loader valida la forma del JSON, un use case usa los repositories con `findById(id)` para idempotencia, y `create` acepta un `id` explícito. Este ticket reutiliza exactamente ese patrón para productos.

Análisis del seed (verificado):
- `productos` es un dict keyed por `prod-001`…`prod-071`; `_readme`, `_pendientes` y `_imagenesPendientesMigracion` son metadatos (las imágenes NO se migran en este ticket).
- 68 `publicado=true` / 3 `publicado=false` en el archivo (`prod-014`, `prod-054`, `prod-069`). 40 productos traen SKU temporal `SKU-PEND-xxx` (todos únicos entre sí). Tras validación en staging se excluye `prod-054` (duplicado de `prod-050`) y `prod-069` conserva slug único `medidor-cuenta-litros-flowtech-hil` (SKU `FLO-CLT-HIL`, producto distinto). Resultado del seed: 70 documentos (68 publicados + 2 no publicados).
- `precio.moneda:"CLP"` presente en los 71, pero ausente del data model y de `PrecioDto`.
- Todas las referencias `categoriaId`/`subcategoriaId` resuelven contra `seed-categorias-subcategorias.json`: 0 colgantes, 0 violaciones de consistencia. `prod-014` tiene `subcategoriaId:null` y necesita la subcategoría `Medidores de Nivel` (inexistente) para publicarse.
- `ProductoRepository.create` hoy **autogenera** el ID del documento → debe aceptar un `id` opcional para honrar el `_readme`.
- `ProductoConsistencyService.assertConsistency` valida categoría existente (vía `ICategoriaRepository.findById`) y pertenencia de subcategoría (vía `ISubcategoriaIntegrityRepository.belongsToCategoria`).
- No existe adapter de Firebase Storage en el backend → refuerza diferir la migración de imágenes.

## Goals / Non-Goals

**Goals:**
- Comando `seed:productos` idempotente que crea 70 documentos con IDs deterministas (clave del dict, excluye el duplicado `prod-054`).
- Reutilizar las reglas de dominio (integridad SKU/slug + consistencia categoría/subcategoría) en el seed, no duplicarlas.
- Crear la subcategoría `medicion-de-fluidos--medidores-de-nivel` (idempotente) como prerrequisito para publicar `prod-014` en el futuro.
- Tests TDD (RED → GREEN → refactor) para toda lógica nueva/modificada, cobertura ≥90% en archivos nuevos/modificados.

**Non-Goals:**
- NO migrar imágenes (la `galeria` se siembra vacía; ticket aparte para `_imagenesPendientesMigracion` → Firebase Storage).
- NO cambiar endpoints HTTP ni `docs/api-spec.yml` (el seed usa repositories/puertos de dominio).
- NO sembrar los 18 productos pendientes de confirmación (no están en este archivo).
- NO hacer upsert: re-ejecutar omite existentes (igual que `seed:catalog`).

## Decisions

1. **`ProductoInput.id?` opcional; `create` lo usa si está presente.** Se añade `id?: string` a `ProductoInput` y `ProductoRepository.create` hace `const id = input.id ?? this.firestore.collection(COLLECTION).doc().id;`. No se añade un método nuevo (ISP: `IProductRepository` sigue con 4 métodos). Los DTOs HTTP (`ProductoCreateDto`/`ProductoUpdateDto`) no cambian → el contrato público queda intacto. Alternativa: método `createWithId` → descartada (violaría ISP y acoplaría semántica operativa al service HTTP).

2. **Loader `loadProductoSeed(filePath?)` con validación estricta.** Resuelve `filePath ?? process.env.SEED_FILE_PATH ?? 'seed-productos-71.json'` (caminata hacia la raíz del monorepo, igual que el loader de catálogo). Valida que `productos` sea un objeto; cada item con `sku`/`titulo` no vacíos y `precio.{valor:number, visible:boolean}`; resuelve `slug = item.slug ?? slugify(titulo)`; `categoriaId ?? 'sin-categoria'`; `subcategoriaId` opcional/null; `galeria` permitido vacío; **descarta `precio.moneda`**; asigna `id` = la clave del dict. Falla rápido con mensaje claro. Alternativa: escribir directo sin validar → descartada (silencia datos corruptos).

3. **`SeedProductosUseCase` reutiliza puertos de dominio (3 dependencias).** Inyecta `IProductRepository`, `IProductIntegrityRepository` y `ProductoConsistencyService`. Por cada item: `findById(id)` existe ⇒ `omitidos++` y continúa; si no, `assertConsistency(categoriaId, subcategoriaId)` + `existsBySku`/`existsBySlug` (seguridad de integridad) y `repository.create({ ...input, id })`. Esto mantiene una única fuente de verdad para las reglas de negocio (DIP/SRP) y es consistente con Clean Architecture. Alternativa: llamar `ProductoWriteService.create` (pasaría por DTOs HTTP y no acepta `id` determinista) → descartada.

4. **Pre-paso `EnsureSeedSubcategorias` (provider con 1 dependencia).** Crea idempotentemente `medicion-de-fluidos--medidores-de-nivel` (nombre "Medidores de Nivel", slug "medidores-de-nivel", `categoriaId:"medicion-de-fluidos"`, `activa:true`, `orden:99`) vía `ISubcategoriaRepository` si no existe. Se mantiene como provider separado (1 dependencia) para no romper el límite de 3 del `SeedProductosUseCase` y preservar SRP. `prod-014` se siembra `publicado=false` (fiel al archivo) hasta confirmación del cliente.

5. **Timestamps con `new Date()` (no `serverTimestamp`).** El `_readme` del seed pide `serverTimestamp()`, pero todos los repositories del proyecto usan `new Date()` en las escrituras. Se alinea el seed a esa convención (decisión #8 de `backend-seed-catalog`).

6. **CLI clona `seed-catalog.ts`.** `seed-productos.ts` usa `NestFactory.createApplicationContext(SeedProductosModule)`, ejecuta el pre-paso + `SeedProductosUseCase.execute`, `Logger.log` de conteos, `app.close()`; en `catch` loguea solo el mensaje (sin exponer credenciales Firebase) y `process.exit(1)`. Script `seed:productos` = `nest build && node dist/cli/seed-productos.js`.

7. **Exclusión de duplicado y de-duplicación de slug en el seed.** El seed de staging reveló 2 colisiones de slug bloqueadas por la regla de integridad: `prod-050`/`prod-054` (mismo slug; `prod-054` es duplicado no publicado de `prod-050`) y `prod-068`/`prod-069` (mismo título/slug pero SKU distintos `FLO-CLT-FLA`/`FLO-CLT-HIL`, productos distintos). Decisión del cliente: excluir solo `prod-054` y sembrar 70. Para no violar la invariante de slug único global, el loader excluye `prod-054` vía lista `SEED_PRODUCTOS_EXCLUIR` y sobreescribe el slug de `prod-069` a `medidor-cuenta-litros-flowtech-hil` vía `SEED_PRODUCTOS_SLUG_OVERRIDE`. Alternativa: suffix genérico a todos los no publicados → descartada (menos fiel; afectaría a `prod-014` innecesariamente).

## Risks / Trade-offs

- **[Risk]** Referencia colgante si no se corrió `seed:catalog` primero ⇒ `assertConsistency` lanza 404 claro. → **Mitigation**: documentar el prerrequisito en README; el error nombra la categoría faltante.
- **[Risk]** SKU temporales `SKU-PEND-xxx` expuestos en el catálogo público. → **Mitigation**: aceptado por decisión del cliente (fiel al archivo); el `_pendientes` del seed documenta que deben reemplazarse.
- **[Risk]** Re-ejecutar no actualiza productos editados a mano. → **Mitigation**: aceptado (omitir si existe), coherente con `seed:catalog`.
- **[Trade-off]** Desviación de `serverTimestamp` a `new Date()` en el seed → aceptada por consistencia con el código existente.
- **[Trade-off]** El seed usa el repository directamente (no el service HTTP) para fijar IDs → ligera duplicación conceptual del "arma el input", pero evita alterar el contrato del service HTTP.

## Migration Plan

- No hay migración de datos existente (la colección está vacía). El seed es idempotente y repetible.
- **Deploy**: comando operativo contra el entorno objetivo (staging/producción) con credenciales Firebase correspondientes. No requiere desplegar el servidor HTTP. Orden: `npm run seed:catalog` → `npm run seed:productos`.
- **Rollback**: eliminar los documentos `prod-001`…`prod-071` (y la subcategoría `medicion-de-fluidos--medidores-de-nivel` si se creó y no hay productos asociados; no aplica borrado de `sin-categoria`).
- **Variables de entorno**: las del backend Firebase (ya en `.env.example`); opcional `SEED_FILE_PATH` para apuntar a otro archivo de seed.

## Open Questions

- ¿El cliente aprueba formalmente los 71 productos y reemplaza los 40 SKU `SKU-PEND-xxx` antes de exponerlos públicamente? El change es agnóstico al contenido: pobló lo que el archivo diga (fiel al archivo, 68 publicados).
- Resuelto en staging: `prod-054` se excluye (duplicado de `prod-050`); `prod-069` conserva slug único `medidor-cuenta-litros-flowtech-hil` (producto distinto, SKU `FLO-CLT-HIL`). `prod-014` queda `publicado=false` hasta confirmación.
