# response-envelope-meta Specification

## Purpose
TBD - created by archiving change products-pagination. Update Purpose after archive.
## Requirements
### Requirement: Standardized response envelope
All endpoints under `/api/v1/` SHALL be wrapped by the ResponseInterceptor in `{ data, error: null, meta }`. When the handler returns an object with a `meta` property (e.g. `{ data, meta: { total, page, limit } }`), the interceptor SHALL merge the handler's meta with its own `{ timestamp, path }` — handler meta keys win in case of conflict. When the handler returns a plain value (array, object) without `meta`, the interceptor SHALL produce `{ data, error: null, meta: { timestamp, path } }` (current behavior, no-op merge).

#### Scenario: Handler with pagination meta gets merged
- **WHEN** the handler returns `{ data: [...], meta: { total: 100, page: 1, limit: 24 } }`
- **THEN** the interceptor produces `{ data: [...], error: null, meta: { timestamp, path, total: 100, page: 1, limit: 24 } }`

#### Scenario: Handler without meta preserves current behavior
- **WHEN** the handler returns a plain array `[{ id: '1' }, { id: '2' }]`
- **THEN** the interceptor produces `{ data: [...], error: null, meta: { timestamp, path } }`
- **AND** `meta` does NOT contain `total`, `page`, or `limit`

#### Scenario: Categories endpoint unaffected (regression)
- **WHEN** `GET /api/v1/categories` is called
- **THEN** the response is `{ data: [...], error: null, meta: { timestamp, path } }` without pagination fields

#### Scenario: Product detail endpoint unaffected (regression)
- **WHEN** `GET /api/v1/products/:id` is called
- **THEN** the response is `{ data: {...}, error: null, meta: { timestamp, path } }` without pagination fields

#### Scenario: Subcategories endpoint unaffected (regression)
- **WHEN** `GET /api/v1/subcategories` is called
- **THEN** the response is `{ data: [...], error: null, meta: { timestamp, path } }` without pagination fields

