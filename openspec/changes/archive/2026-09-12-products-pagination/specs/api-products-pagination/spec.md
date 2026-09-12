## ADDED Requirements

### Requirement: Public product listing is paginated with offset page/limit
The system SHALL support `page` (integer, default 1, min 1) and `limit` (integer, default 24, max 100) query parameters on `GET /api/v1/products`. The response SHALL include `meta: { total, page, limit, timestamp, path }` via the ResponseInterceptor merge. Invalid non-numeric values SHALL return HTTP 400. Values outside range SHALL be clamped (page ≥ 1, limit ≤ 100).

#### Scenario: Default public listing returns paginated card projection
- **WHEN** an unauthenticated client calls `GET /api/v1/products` with no parameters
- **THEN** the response contains `data` with up to 24 items of type ProductoCard (lean fields: id, sku, titulo, slug, descripcionBreve, categoriaId, subcategoriaId, precio, destacado, publicado, creadoEn, galeria[0])
- **AND** each item does NOT contain `descripcionLarga`, `atributos`, `fichaTecnica`, `stock`, `actualizadoEn`, `idExterno`
- **AND** `meta.total` is the real count of published products
- **AND** `meta.page` is 1 and `meta.limit` is 24

#### Scenario: Custom page/limit parameters
- **WHEN** a client calls `GET /api/v1/products?page=2&limit=10`
- **THEN** `data` contains between 0 and 10 items
- **AND** `meta.page` is 2 and `meta.limit` is 10 and `meta.total` is the real count

#### Scenario: Limit exceeds maximum is clamped
- **WHEN** a client calls `GET /api/v1/products?limit=200`
- **THEN** `meta.limit` is 100 (clamped) and response is HTTP 200

#### Scenario: Non-numeric page returns 400
- **WHEN** a client calls `GET /api/v1/products?page=abc`
- **THEN** the response is HTTP 400 with an error message

#### Scenario: Page beyond total returns empty data
- **WHEN** a client calls `GET /api/v1/products?page=999` with 50 total products
- **THEN** `data` is `[]` and `meta.page` is clamped to the last valid page

### Requirement: Authenticated listing returns full entities paginated
The system SHALL return complete Producto entities (all fields including galeria completa, descripcionLarga, atributos, fichaTecnica, stock, actualizadoEn, idExterno) when a valid Firebase Auth token is provided, paginated with the same `page`/`limit` parameters and `meta` envelope.

#### Scenario: Authenticated listing returns full entities
- **WHEN** a client with a valid Firebase token calls `GET /api/v1/products`
- **THEN** `data` contains complete Producto entities with all fields
- **AND** `meta.total` includes both published and unpublished products (not forced to `publicado: true`)
- **AND** pagination meta (page, limit, total) is present

### Requirement: Filtering with pagination
The system SHALL support existing filters (categoriaId, subcategoriaId, destacado, publicado, search) combined with pagination. Filters are applied before pagination.

#### Scenario: Filter by category with pagination
- **WHEN** a client calls `GET /api/v1/products?categoriaId=cat-bombeo&page=1&limit=12`
- **THEN** `data` contains up to 12 items all with `categoriaId = 'cat-bombeo'`
- **AND** `meta.total` is the count of matching products (≤ total published)

#### Scenario: Filter by subcategory and destacado
- **WHEN** a client calls `GET /api/v1/products?subcategoriaId=sub-1&destacado=true`
- **THEN** `data` contains only items matching both filters, with card projection

#### Scenario: Search with pagination (in-memory path)
- **WHEN** a client calls `GET /api/v1/products?search=bomba&page=1&limit=12`
- **THEN** `data` contains up to 12 items whose titulo, sku, slug, or descripcionBreve contain "bomba" (case-insensitive)
- **AND** `meta.total` is the count of matching items
- **AND** the projection is card

### Requirement: Sorting with pagination
The system SHALL support sortBy (titulo, precio.valor, creadoEn, actualizadoEn) with sortDir (asc, desc). Default sort is creadoEn desc. For sortBy in [titulo, precio.valor, actualizadoEn], the system SHALL use in-memory sorting (Firestore cannot paginate in-memory sorted results natively).

#### Scenario: Sort by price ascending with pagination
- **WHEN** a client calls `GET /api/v1/products?sortBy=precio.valor&sortDir=asc&page=1&limit=12`
- **THEN** `data` contains up to 12 items sorted by precio.valor ascending
- **AND** `meta.total` is the total count of the filtered set
- **AND** the projection is card

### Requirement: Default sort uses native Firestore pagination
When no search and no sortBy alternativo is provided, the system SHALL use Firestore native orderBy('creadoEn', 'desc') with .offset()/.limit() and .select(CARD_FIELDS) for the card projection path. A separate count() aggregation query SHALL provide meta.total.

#### Scenario: Default listing uses Firestore native pagination
- **WHEN** `findAll` is called with no search and no sortBy (or sortBy = 'creadoEn')
- **THEN** the repository invokes `.select(CARD_FIELDS)` on the Firestore query
- **AND** invokes `.orderBy('creadoEn', 'desc')`
- **AND** invokes `.offset()` with `(page-1)*limit`
- **AND** invokes `.limit()` with the limit value
- **AND** executes a separate `count()` aggregation query for the total

### Requirement: Card projection fields via Firestore select
The system SHALL define `CARD_FIELDS` constant containing: id, sku, titulo, slug, descripcionBreve, categoriaId, subcategoriaId, precio, destacado, publicado, creadoEn, galeria. The `toProductoCard` mapper SHALL be tolerant of missing fields (defaults: descripcionBreve → '', galeria → [], precio → {valor:0, visible:false}).

#### Scenario: Card projection mapper handles partial documents
- **WHEN** `toProductoCard` receives a Firestore document with only CARD_FIELDS selected
- **THEN** it returns a valid ProductoCard with defaults for any absent optional fields
- **AND** the result is assignable to ProductoCard type without errors
