# backend-subcategorias Specification

## Purpose
Backend CRUD for product subcategorías (Firestore `subcategorias` collection) in the NestJS BFF. Public read endpoints under `/api/v1/subcategories`; authenticated write endpoints restricted by Firebase role claims (admin/superadmin create/delete, editor may edit). Enforces composite slug uniqueness (`categoriaId+slug`), existence of the parent category, and blocks deletion of subcategorías with associated products. Exposes `belongsToCategoria` so the future productos module can validate category/subcategory consistency.
## Requirements
### Requirement: Backend SHALL expose public subcategoria read endpoints
The backend-subcategorias SHALL provide `GET /api/v1/subcategories` (optionally filtered by `?categoriaId=<id>` and/or `?activa=<boolean>`) and `GET /api/v1/subcategories/{id}`, both publicly accessible (no authentication required), returning the standard response envelope `{ data, error, meta }`. `GET /api/v1/subcategories/{id}` SHALL return 404 when the subcategoria does not exist.

#### Scenario: List subcategorias publicly
- **WHEN** `GET /api/v1/subcategories` is requested without a token
- **THEN** the response is 200 with the subcategorias array wrapped in `data`

#### Scenario: List subcategorias filtered by parent category
- **WHEN** `GET /api/v1/subcategories?categoriaId=cat-1` is requested
- **THEN** only subcategorias with `categoriaId: "cat-1"` are returned in `data`

#### Scenario: Get a single subcategoria by id
- **WHEN** `GET /api/v1/subcategories/{id}` is requested for an existing subcategoria
- **THEN** the response is 200 with that subcategoria in `data`

#### Scenario: Get a missing subcategoria returns 404
- **WHEN** `GET /api/v1/subcategories/{id}` is requested for a non-existent subcategoria
- **THEN** the response status is 404

### Requirement: Backend SHALL expose authenticated subcategoria write endpoints
The backend-subcategorias SHALL provide `POST /api/v1/subcategories`, `PUT /api/v1/subcategories/{id}`, `PATCH /api/v1/subcategories/{id}` and `DELETE /api/v1/subcategories/{id}`. `POST` and `DELETE` SHALL require a valid Firebase ID token and the caller SHALL have role `superadmin` OR `admin`. `PUT`/`PATCH` SHALL additionally allow role `editor` (an editor may edit but not create or delete subcategorias, consistent with backend-categorias). Missing/invalid token → 401; insufficient role → 403. `POST` returns 201; `PUT`/`PATCH` return 200; `DELETE` returns 204.

#### Scenario: Admin creates a subcategoria
- **WHEN** an authenticated `admin` sends `POST /api/v1/subcategories` with valid `categoriaId`, `nombre` and `slug`
- **THEN** the response is 201 and the subcategoria is created

#### Scenario: Unauthenticated create is rejected
- **WHEN** `POST /api/v1/subcategories` is requested without a token
- **THEN** the response status is 401

#### Scenario: Editor cannot create a subcategoria
- **WHEN** an authenticated `editor` sends `POST /api/v1/subcategories`
- **THEN** the response status is 403

#### Scenario: Editor can update a subcategoria
- **WHEN** an authenticated `editor` sends `PUT /api/v1/subcategories/{id}` with valid fields
- **THEN** the response is 200 and the subcategoria is updated

#### Scenario: Editor cannot delete a subcategoria
- **WHEN** an authenticated `editor` sends `DELETE /api/v1/subcategories/{id}`
- **THEN** the response status is 403

#### Scenario: Admin deletes a subcategoria
- **WHEN** an authenticated `admin` sends `DELETE /api/v1/subcategories/{id}` for a deletable subcategoria
- **THEN** the response status is 204

### Requirement: Backend SHALL enforce subcategoria business rules
The backend-subcategorias SHALL enforce, in `SubcategoriaService`: (a) composite slug uniqueness — a subcategoria with the same `slug` AND `categoriaId` as an existing one SHALL return 409; (b) the parent category (`categoriaId`) MUST exist, otherwise 404; (c) a subcategoria with associated products (any `productos` document with `subcategoriaId === id`) SHALL NOT be deleted (409); (d) operations on a non-existent subcategoria SHALL return 404.

#### Scenario: Duplicate composite slug is rejected with 409
- **WHEN** a subcategoria is created or updated to a `slug` already used by another subcategoria in the same `categoriaId`
- **THEN** the response status is 409

#### Scenario: Creating under a non-existent parent category returns 404
- **WHEN** `POST /api/v1/subcategories` is sent with a `categoriaId` that does not exist
- **THEN** the response status is 404

#### Scenario: Deleting a subcategoria with associated products is rejected with 409
- **WHEN** `DELETE /api/v1/subcategories/{id}` is requested for a subcategoria that has at least one product
- **THEN** the response status is 409

#### Scenario: Updating a missing subcategoria returns 404
- **WHEN** `PUT /api/v1/subcategories/{id}` is requested for a non-existent subcategoria
- **THEN** the response status is 404

### Requirement: Backend SHALL expose subcategoria integrity queries for product consistency
The backend-subcategorias SHALL provide `belongsToCategoria(subcategoriaId, categoriaId)` on `ISubcategoriaIntegrityRepository` so that the future productos module can verify that a product's `subcategoriaId` belongs to its `categoriaId`. The repository SHALL implement it by reading the subcategoria document and comparing its `categoriaId`.

#### Scenario: Subcategoria belongs to the given category
- **WHEN** `belongsToCategoria(sub-1, cat-1)` is called for a subcategoria whose `categoriaId` is `cat-1`
- **THEN** the result is `true`

#### Scenario: Subcategoria does not belong to the given category
- **WHEN** `belongsToCategoria(sub-1, cat-2)` is called for a subcategoria whose `categoriaId` is `cat-1`
- **THEN** the result is `false`

### Requirement: Backend SHALL auto-generate subcategory slug from nombre when omitted
The backend-subcategorias `POST /api/v1/subcategories` SHALL accept `slug` as optional. When `slug` is omitted, the `SubcategoriaService.create` SHALL derive it from `nombre` using the shared `slugify` utility (lowercase, diacritics stripped, non-alphanumeric runs replaced by a single hyphen), exactly like `productos`. The composite slug-uniqueness check (`categoriaId + slug`, 409 on conflict) SHALL run against the resolved slug. When `slug` is provided explicitly, it SHALL be used as-is. This is backward compatible: clients that still send `slug` behave unchanged.

#### Scenario: Create subcategory without slug derives it from nombre
- **WHEN** an authenticated `admin` sends `POST /api/v1/subcategories` with `categoriaId: "medicion-de-fluidos"`, `nombre: "Medidores Electromagnéticos"` and no `slug`
- **THEN** the response is 201
- **AND** the created subcategory has `slug` equal to `medidores-electromagneticos`

#### Scenario: Create subcategory with explicit slug uses it
- **WHEN** an authenticated `admin` sends `POST /api/v1/subcategories` with `categoriaId: "medicion-de-fluidos"`, `nombre: "Medidores Electromagnéticos"` and `slug: "medidores-electromagneticos"`
- **THEN** the response is 201
- **AND** the created subcategory has `slug` equal to `medidores-electromagneticos`

#### Scenario: Derived composite slug collision returns 409
- **WHEN** a subcategory is created (with or without explicit slug) and the resolved `categoriaId + slug` already belongs to another subcategory
- **THEN** the response status is 409

#### Scenario: Empty slug is rejected
- **WHEN** `POST /api/v1/subcategories` is sent with `slug: ""`
- **THEN** the response status is 422 (validation error)

