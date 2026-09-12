# Scenarios — W2: Paginación y proyección en listados públicos de productos

## SC-001: Listado público por defecto — paginado + proyección card

```gherkin
Given el endpoint "GET /api/v1/products" está disponible (sin token de autenticación)
  And existen 50 productos publicados
When se invoca sin parámetros de filtro
Then la respuesta contiene "data" con hasta 24 items de tipo ProductoCard
  And cada item tiene "id", "sku", "titulo", "slug", "descripcionBreve", "categoriaId", "subcategoriaId", "precio", "destacado", "publicado", "creadoEn", "galeria"
  And cada item NO tiene "descripcionLarga", "atributos", "fichaTecnica", "stock", "actualizadoEn", "idExterno"
  And "meta.total" es 50
  And "meta.page" es 1
  And "meta.limit" es 24
  And "meta.timestamp" es un ISO 8601 válido
  And "meta.path" contiene "/api/v1/products"
```

## SC-002: Listado autenticado — paginado + entidad completa

```gherkin
Given el endpoint "GET /api/v1/products" con token Firebase válido (rol "admin")
  And existen 30 productos (20 publicados, 10 borradores)
When se invoca sin parámetros de filtro
Then la respuesta contiene "data" con hasta 24 items de tipo Producto (entidad completa)
  And cada item tiene todos los campos incluyendo "descripcionLarga", "atributos", "fichaTecnica", "stock", "galeria" (completa), "actualizadoEn", "idExterno"
  And "meta.total" es 30 (incluye borradores porque el usuario está autenticado)
  And "meta.page" es 1
  And "meta.limit" es 24
```

## SC-003: Paginación con page/limit personalizados

```gherkin
Given el endpoint "GET /api/v1/products" (sin token)
  And existen 50 productos publicados
When se invoca con query params "page=2&limit=10"
Then "data" contiene entre 0 y 10 items
  And "meta.page" es 2
  And "meta.limit" es 10
  And "meta.total" es 50
```

## SC-004: Límite máximo excedido se clampea

```gherkin
Given el endpoint "GET /api/v1/products"
When se invoca con query params "limit=200"
Then el limit se clampea a 100
  And "meta.limit" es 100
  And la respuesta es HTTP 200
```

## SC-005: Parámetro page no numérico retorna 400

```gherkin
Given el endpoint "GET /api/v1/products"
When se invoca con query params "page=abc"
Then la respuesta es HTTP 400
  And el body contiene un campo "error" con mensaje descriptivo
```

## SC-006: Filtro por categoría con paginación

```gherkin
Given el endpoint "GET /api/v1/products" (sin token)
  And existen 50 productos publicados en la categoría "cat-bombeo"
When se invoca con query params "categoriaId=cat-bombeo&page=1&limit=12"
Then "data" contiene hasta 12 items
  And todos los items tienen "categoriaId" igual a "cat-bombeo"
  And "meta.total" es igual o menor a 50
  And la proyección es card (sin "descripcionLarga", etc.)
```

## SC-007: Filtro por subcategoría y destacado

```gherkin
Given el endpoint "GET /api/v1/products" (sin token)
  And existen productos publicados con subcategoriaId="sub-1" y destacado=true
When se invoca con query params "subcategoriaId=sub-1&destacado=true"
Then "data" contiene solo items que cumplan ambos filtros
  And la proyección es card
```

## SC-008: Búsqueda con paginación (camino en memoria)

```gherkin
Given el endpoint "GET /api/v1/products" (sin token)
  And existen 30 productos publicados, 8 de los cuales contienen "bomba" en titulo/sku/slug/descripcionBreve
When se invoca con query params "search=bomba&page=1&limit=12"
Then "data" contiene hasta 12 items cuyo titulo, sku, slug o descripcionBreve contienen "bomba" (case-insensitive)
  And "meta.total" es 8
  And la proyección es card
```

## SC-009: Ordenamiento alternativo con paginación (camino en memoria)

```gherkin
Given el endpoint "GET /api/v1/products" (sin token)
  And existen 40 productos publicados con distintos precios
When se invoca con query params "sortBy=precio.valor&sortDir=asc&page=1&limit=12"
Then "data" contiene hasta 12 items ordenados por "precio.valor" ascendente
  And "meta.total" es 40
  And la proyección es card
```

## SC-010: Interceptor mergea meta del handler

```gherkin
Given el handler "findAll" retorna "{ data: [...], meta: { total: 100, page: 1, limit: 24 } }"
When el ResponseInterceptor procesa la respuesta
Then la respuesta HTTP tiene "meta.timestamp" (ISO 8601)
  And "meta.path" contiene la URL del request
  And "meta.total" es 100
  And "meta.page" es 1
  And "meta.limit" es 24
  And "error" es null
```

## SC-011: Endpoints no paginados no afectados

```gherkin
Given los endpoints "GET /api/v1/categories", "GET /api/v1/subcategories", "GET /api/v1/products/:id"
When se invocan
Then el interceptor produce "{ data, error: null, meta: { timestamp, path } }"
  And "meta" NO contiene "total", "page", ni "limit"
  And el comportamiento es idéntico al actual
```

## SC-012: Firestore proyecta campos en camino card (repository)

```gherkin
Given el repository "ProductoRepository" recibe "findAll" con "projection: 'card'" y sin "search" ni "sortBy" alternativo
When se construye el query Firestore
Then se invoca ".select(CARD_FIELDS)" con la máscara correcta
  And se invoca ".orderBy('creadoEn', 'desc')"
  And se invoca ".offset()" con el valor calculado ((page-1)*limit)
  And se invoca ".limit()" con el valor del filtro
  And se ejecuta un "count()" aggregation separado para el total
```

## SC-013: Web — catálogo SSG construido con cards

```gherkin
Given "astro build" ejecuta el frontmatter de "index.astro"
When "getPublicProducts()" retorna el listado de la API
Then los productos incrustados en "#catalog-data" JSON son de tipo "ProductoCardApi"
  And el grid de cards renderiza correctamente con titulo, descripcionBreve, galeria[0]
  And "applyProductFilters" funciona sobre los campos disponibles (titulo, descripcionBreve, sku, slug, categoriaId, subcategoriaId, precio.valor, creadoEn)
```

## SC-014: Web — detalle por slug sin reutilizar cache del listado

```gherkin
Given un producto "bomba-centrifuga-500" existe publicado
When la página "/productos/[slug].astro" renderiza el detalle
Then "getProductBySlug" NO reutiliza el cache de "getPublicProducts()"
  And realiza un fetch independiente a "GET /api/v1/products/slug/bomba-centrifuga-500"
  And la respuesta contiene la entidad completa (descripcionLarga, atributos, fichaTecnica, galeria completa)
```

## SC-015: Documentación — api-spec.yml actualizado

```gherkin
Given el archivo "docs/api/api-spec.yml" es la fuente de verdad del contrato
When se revisa el endpoint "GET /api/v1/products"
Then los params "page" (integer, default 1) y "limit" (integer, default 24, max 100) están documentados
  And el schema de respuesta usa "ProductoListResponse" con "meta: Pagination"
  And la descripción NO contiene "Sin paginación en esta versión"
```

## SC-016: Documentación — data-model.md con índices compuestos

```gherkin
Given el archivo "docs/data-model/data-model.md"
When se revisa la sección "Índices compuestos (Firestore)"
Then se documentan los índices: publicado+creadoEn, publicado+categoriaId+creadoEn, publicado+subcategoriaId+creadoEn, publicado+destacado+creadoEn
  And se documenta el uso de "count()" para total
  And se documenta el tradeoff de offset en páginas profundas
```

## SC-017: firestore.indexes.json declara índices compuestos

```gherkin
Given el archivo "apps/backend/firestore.indexes.json"
When se revisa
Then contiene al menos 4 índices compuestos (publicado+creadoEn, publicado+categoriaId+creadoEn, publicado+subcategoriaId+creadoEn, publicado+destacado+creadoEn)
  And cada índice tiene "collectionGroup": "productos"
  And cada índice tiene los campos en el orden correcto (ASC/DESC)
```
