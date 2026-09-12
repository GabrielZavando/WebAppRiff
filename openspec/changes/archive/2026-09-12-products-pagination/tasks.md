# Tasks — W2: Paginación y proyección en listados públicos de productos + índices Firestore

> **Change**: products-pagination
> **Ticket**: W2
> **Tag**: `[fullstack]`

---

## T1 — Documentación: api-spec.yml actualizado (antes del código)

> **Priority**: Alta | **Layer**: docs | **Estimate**: S (0.5 días)
> **Traceability**: SC-015 | **Dependency**: ninguna (pre-requisito SDD)

### Subtasks

- [x] T1.1 — Params `page` (integer, default 1) y `limit` (integer, default 24, max 100) al endpoint `GET /api/v1/products` en `paths` y en el array `parameters`
- [x] T1.2 — Schema `ProductoCard` (campos lean: sin `descripcionLarga`, `atributos`, `fichaTecnica`, `stock`, `actualizadoEn`, `idExterno`) bajo `components.schemas`
- [x] T1.3 — Actualizar `ProductoListResponse.data.items` para referenciar `Producto` (full) o alternar con nota de proyección card para anónimos
- [x] T1.4 — Quitar "Sin paginación en esta versión" de la descripción del endpoint
- [x] T1.5 — Verificar que `Pagination` schema (`total`, `page`, `limit`) se usa correctamente en `ProductoListResponse.meta`

### Suggested Path
`docs/api/api-spec.yml`

### Test Path
no aplica (validación manual del YAML + verificación de coherencia con `openspec validate`)

---

## T2 — Documentación: data-model.md con índices compuestos + firestore.indexes.json

> **Priority**: Alta | **Layer**: docs/infrastructure | **Estimate**: S (0.5 días)
> **Traceability**: SC-016, SC-017 | **Dependency**: ninguna

### Subtasks

- [x] T2.1 — Añadir sección "Índices compuestos (Firestore)" a `docs/data-model/data-model.md` con la matriz: publicado+creadoEn DESC, publicado+categoriaId+creadoEn DESC, publicado+subcategoriaId+creadoEn DESC, publicado+destacado+creadoEn DESC
- [x] T2.2 — Documentar uso de `count()` aggregation para `meta.total` (sin `orderBy`/`limit`)
- [x] T2.3 — Documentar tradeoff: offset facturas lecturas saltadas; búsqueda/sort alternativo resuelve en memoria
- [x] T2.4 — Declarar los 4 índices compuestos en `apps/backend/firestore.indexes.json` (`indexes` array con `collectionGroup: "productos"`, campos ASC/DESC)
- [x] T2.5 — Verificar coherencia entre data-model.md y firestore.indexes.json

### Suggested Path
`docs/data-model/data-model.md`, `apps/backend/firestore.indexes.json`

### Test Path
no aplica (validación de estructura JSON + verificación de coherencia)

---

## T3 — Domain: tipos ProductoCard, ProductoListResult, ProductoFilter extendido, IProductQueryRepository

> **Priority**: Alta | **Layer**: domain | **Estimate**: S (0.5 días)
> **Traceability**: SC-001, SC-002, SC-012 | **Dependency**: T1 (api-spec actualizado)

### Subtasks

- [x] T3.1 — **RED**: Escribir spec que importa `ProductoCard` y verifica que tiene los campos: id, sku, titulo, slug, descripcionBreve, categoriaId, subcategoriaId, precio{valor,visible}, destacado, publicado, creadoEn, galeria (array). Verificar que NO tiene descripcionLarga, atributos, fichaTecnica, stock, actualizadoEn, idExterno
- [x] T3.2 — **GREEN**: Crear `ProductoCard` interface en `apps/backend/src/productos/domain/producto.entity.ts` (o archivo dedicado `producto-card.entity.ts` si la entidad crece)
- [x] T3.3 — **RED**: Escribir spec que importa `ProductoListResult` y verifica que tiene `items: T[]` y `total: number`
- [x] T3.4 — **GREEN**: Crear `ProductoListResult<T>` generic type en domain
- [x] T3.5 — **RED**: Escribir spec que verifica `ProductoFilter` acepta `page?: number` y `limit?: number` (además de los campos existentes)
- [x] T3.6 — **GREEN**: Extender `ProductoFilter` en `producto.entity.ts` con `page?` y `limit?`
- [x] T3.7 — **RED**: Escribir spec que verifica `IProductQueryRepository.findAll` retorna `Promise<ProductoListResult>` (no `Promise<Producto[]>`)
- [x] T3.8 — **GREEN**: Cambiar firma de `findAll` en `iproducto.repository.ts` a `Promise<ProductoListResult>`

### Suggested Path
`apps/backend/src/productos/domain/producto.entity.ts`, `apps/backend/src/productos/domain/iproducto.repository.ts`

### Test Path
`apps/backend/src/productos/domain/producto.entity.spec.ts` (nuevo) o `apps/backend/src/productos/domain/iproducto.repository.spec.ts` (nuevo)

---

## T4 — Infrastructure: CARD_FIELDS, toProductoCard, Repository dual path + count

> **Priority**: Alta | **Layer**: infrastructure | **Estimate**: M (1 día)
> **Traceability**: SC-012, SC-008, SC-009 | **Dependency**: T3 (domain types)

### Subtasks

- [x] T4.1 — **RED**: Escribir spec que verifica `toProductoCard` convierte un documento Firestore parcial en `ProductoCard` con defaults correctos (descripcionBreve → '', galeria → [], precio → {valor:0, visible:false})
- [x] T4.2 — **GREEN**: Crear función `toProductoCard` en `producto.repository.ts` (o archivo dedicado `producto-card.mapper.ts`)
- [x] T4.3 — **RED**: Escribir spec que verifica `CARD_FIELDS` contiene los campos exactos de la proyección card (id, sku, titulo, slug, descripcionBreve, categoriaId, subcategoriaId, precio, destacado, publicado, creadoEn, galeria)
- [x] T4.4 — **GREEN**: Crear constante `CARD_FIELDS` en `producto.repository.ts`
- [x] T4.5 — **RED**: Escribir spec para camino nativo Firestore: `findAll` con `projection: 'card'`, sin search, sin sortBy alternativo → invoca `.select(CARD_FIELDS)`, `.orderBy('creadoEn', 'desc')`, `.offset()`, `.limit()`, y `count()` separado
- [x] T4.6 — **RED**: Escribir spec para camino en memoria: `findAll` con `search: 'bomba'` → fetch completo, filtro in-memory, sort in-memory, slice paginado
- [x] T4.7 — **RED**: Escribir spec para camino en memoria: `findAll` con `sortBy: 'precio.valor'` → fetch completo, sort in-memory, slice paginado
- [x] T4.8 — **GREEN**: Implementar `findAll` dual path en `ProductoRepository`:
  - Camino nativo: `.where()` + `.orderBy()` + `.select()` + `.offset()` + `.limit()` + `count()` aggregation
  - Camino memoria: `query.get()` + filter/search + sort + slice con paginación
  - Decisión: si `filter.search` o `filter.sortBy` ∈ ['titulo', 'precio.valor', 'actualizadoEn'] → camino memoria; sino → camino nativo
- [x] T4.9 — **RED**: Escribir spec que verifica `count()` se ejecuta con los mismos filtros `where` (sin orderBy/limit)
- [x] T4.10 — **GREEN**: Añadir método `buildCountQuery(filter)` o inline `collection.where(filters).count().get()` en `findAll` nativo
- [x] T4.11 — **RED**: Escribir spec para `page` mayor al total de páginas → retorna `items: []`, `total: N`, `page` clampeado
- [x] T4.12 — **GREEN**: Añadir clampeo de page en repository: `effectivePage = Math.max(1, Math.min(page, totalPages))` donde `totalPages = Math.ceil(total / limit)`

### Suggested Path
`apps/backend/src/productos/infrastructure/producto.repository.ts`

### Test Path
`apps/backend/src/productos/infrastructure/producto.repository.spec.ts`

---

## T5 — Application: ProductoReadService con proyección y paginación

> **Priority**: Alta | **Layer**: application | **Estimate**: S (0.5 días)
> **Traceability**: SC-001, SC-002 | **Dependency**: T4 (repository)

### Subtasks

- [x] T5.1 — **RED**: Escribir spec que verifica: `findAll(filter, false)` (anónimo) fuerza `publicado: true` y pasa `projection: 'card'` al repository
- [x] T5.2 — **RED**: Escribir spec que verifica: `findAll(filter, true)` (autenticado) NO fuerza publicado y pasa `projection: 'full'` (o sin proyección) al repository
- [x] T5.3 — **RED**: Escribir spec que verifica: el resultado del repository se retorna tal cual (sin transformación adicional) — el servicio delega, no transforma
- [x] T5.4 — **GREEN**: Modificar `ProductoReadService.findAll` para propagar `page`/`limit` del filtro y añadir `projection` según estado de autenticación
- [x] T5.5 — **RED**: Escribir spec que verifica: `page`/`limit` del filtro se pasan al repository (no se pierden)
- [x] T5.6 — **GREEN**: Asegurar que `effectiveFilter` incluye `page` y `limit` (ya están en el spread)

### Suggested Path
`apps/backend/src/productos/application/producto-read.service.ts`

### Test Path
`apps/backend/src/productos/application/producto-read.service.spec.ts`

---

## T6 — Infrastructure: Controller parse/clamp de page/limit + validación

> **Priority**: Alta | **Layer**: infrastructure | **Estimate**: S (0.5 días)
> **Traceability**: SC-003, SC-004, SC-005 | **Dependency**: T5 (service)

### Subtasks

- [x] T6.1 — **RED**: Escribir spec que verifica: `findAll` con `page='2', limit='10'` → `readService.findAll` recibe filter con `page: 2, limit: 10`
- [x] T6.2 — **RED**: Escribir spec que verifica: `findAll` con `page='abc'` → lanza `BadRequestException`
- [x] T6.3 — **RED**: Escribir spec que verifica: `findAll` con `limit='200'` → `readService.findAll` recibe filter con `limit: 100` (clampeado)
- [x] T6.4 — **RED**: Escribir spec que verifica: `findAll` sin page/limit → `readService.findAll` recibe filter con `page: 1, limit: 24` (defaults)
- [x] T6.5 — **GREEN**: Modificar `ProductoController.findAll` para parsear `page`/`limit` de `@Query`, validar numérico, clampear, y pasar al service via filter
- [x] T6.6 — Añadir constantes `DEFAULT_LIMIT = 24`, `MAX_LIMIT = 100` en el controller

### Suggested Path
`apps/backend/src/productos/infrastructure/producto.controller.ts`

### Test Path
`apps/backend/src/productos/infrastructure/producto.controller.spec.ts`

---

## T7 — Common: ResponseInterceptor merge de meta del handler

> **Priority**: Alta | **Layer**: common | **Estimate**: S (0.5 días)
> **Traceability**: SC-010, SC-011 | **Dependency**: T6 (controller retorna `{ data, meta }`)

### Subtasks

- [x] T7.1 — **RED**: Escribir spec que verifica: si el handler retorna `{ data: [...], meta: { total: 100, page: 1, limit: 24 } }`, el interceptor produce `{ data: [...], error: null, meta: { timestamp, path, total: 100, page: 1, limit: 24 } }`
- [x] T7.2 — **RED**: Escribir spec que verifica: si el handler retorna un array simple `[{...}]` (sin meta), el interceptor produce `{ data: [...], error: null, meta: { timestamp, path } }` (comportamiento actual)
- [x] T7.3 — **RED**: Escribir spec de regresión: endpoint de categorías (mock handler retorna `[]`) → interceptor sin campos de paginación
- [x] T7.4 — **GREEN**: Modificar `ResponseInterceptor.intercept` para detectar si `data` tiene forma `{ data, meta }` y merge ambos meta (handler wins en conflicto de keys)
- [x] T7.5 — Verificar que el tipo `ResponseEnvelope<T>` se mantiene compatible con endpoints existentes

### Suggested Path
`apps/backend/src/common/interceptors/response.interceptor.ts`

### Test Path
`apps/backend/src/common/interceptors/response.interceptor.spec.ts`

---

## T8 — Web: ProductoCardApi, getProductBySlug, toProductCardModel

> **Priority**: Media | **Layer**: frontend | **Estimate**: S (0.5 días)
> **Traceability**: SC-013, SC-014 | **Dependency**: T7 (API funciona con paginación + proyección)

### Subtasks

- [x] T8.1 — **RED**: Escribir test que verifica `ProductoCardApi` tiene campos opcionales: descripcionLarga, atributos, fichaTecnica, stock, actualizadoEn, idExterno (pueden ser undefined). Campos requeridos: id, sku, titulo, slug, descripcionBreve, categoriaId, subcategoriaId, precio, galeria, creadoEn
- [x] T8.2 — **GREEN**: Crear tipo `ProductoCardApi` en `apps/web/src/lib/types/products-page.ts` (campos lean con opcionales)
- [x] T8.3 — **RED**: Escribir test que verifica `getProductBySlug('slug')` llama a `fetch` con la URL del slug (no reutiliza cache de `cached`)
- [x] T8.4 — **GREEN**: Modificar `getProductBySlug` en `apps/web/src/lib/api/products.ts` para eliminar la rama `if (cached) { const found = cached.find(...) }` — siempre fetch por slug
- [x] T8.5 — **RED**: Escribir test que verifica `toProductCardModel` acepta `ProductoCardApi` (campos opcionales undefined) y produce `ProductCardModel` correcto
- [x] T8.6 — **GREEN**: Actualizar tipo de input de `toProductCardModel` para aceptar `ProductoCardApi` (compatible con `ProductoApi` por campos opcionales)
- [x] T8.7 — Verificar que `applyProductFilters` funciona sin cambios sobre `ProductoCardApi[]` (campos titulo, descripcionBreve, sku, slug, categoriaId, subcategoriaId, precio.valor, creadoEn están presentes)

### Suggested Path
`apps/web/src/lib/types/products-page.ts`, `apps/web/src/lib/api/products.ts`, `apps/web/src/lib/products/toProductCardModel.ts`

### Test Path
`apps/web/src/lib/types/__tests__/products-page.test.ts` (nuevo), `apps/web/src/lib/products/__tests__/toProductCardModel.test.ts` (existente, verificar compatibilidad)

---

## T9 — Validación final y verificación

> **Priority**: Alta | **Layer**: cross-cutting | **Estimate**: S (0.5 días)
> **Traceability**: todos los SC | **Dependency**: T1-T8

### Subtasks

- [x] T9.1 — Ejecutar `npm test` en `apps/backend` — todos los specs verdes, cobertura ≥ 90% en archivos tocados
- [x] T9.2 — Ejecutar `npm test` en `apps/web` — todos los specs verdes
- [x] T9.3 — Ejecutar `astro build` en `apps/web` — build verde, catálogo embebido funcional
- [x] T9.4 — Ejecutar `bash check-refs.sh` — 0 errores
- [x] T9.5 — Ejecutar `bash specboot.sh --ci` — 0 errores
- [ ] T9.6 — Ejecutar `/verify W2` — produce evidencia en `openspec/state/verify-results.json`
- [ ] T9.7 — Ejecutar `/adversarial-review` — produce veredicto en `openspec/state/adversarial-result.json`

### Suggested Path
no aplica (comandos de verificación)

### Test Path
no aplica

---

## Mandatory Steps

> Inyectado de `docs/openspec-tasks-mandatory-steps.md` al momento de generación.

### Pre-implementación

- [ ] La **rama activa** sigue la convención vigente del proyecto (`feature/W2-products-list-pagination`); trabajar sobre ella, nunca directamente sobre la rama principal.
- [ ] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de empezar; si hay trabajo en curso, resolverlo primero.

### Durante la implementación

- [ ] **Test nuevo que falla antes de implementar (RED)**: escribir el test del escenario (`SC-NNN`) y verificar que falla antes de escribir código de producción.
- [ ] Ejecutar los **tests unitarios del módulo** tocado mientras se itera (ciclo RED-GREEN-REFACTOR), no solo al final.

### Post-implementación

- [ ] **Ejecutar `verify`**: la verificación del change corre y produce evidencia persistente (`openspec/state/verify-results.json`).
- [ ] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y produce veredicto persistente (`openspec/state/adversarial-result.json`).

> Ambos pasos post alimentan los gates duros de `/commit` (M-901): sin `PASS` + `SHIP` vigentes para el change activo, el commit bloquea.
