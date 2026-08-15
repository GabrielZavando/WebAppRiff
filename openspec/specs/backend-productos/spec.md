# backend-productos Specification

## Purpose
TBD - created by archiving change backend-productos. Update Purpose after archive.
## Requirements
### Requirement: Backend SHALL expose public product read endpoints
The backend-productos SHALL provide `GET /api/v1/products` (optionally filtered by `?categoriaId=`, `?subcategoriaId=`, `?destacado=<boolean>`, `?publicado=<boolean>`, `?search=<string>`, `?sortBy=`, `?sortDir=`), `GET /api/v1/products/slug/:slug`, and `GET /api/v1/products/:id`. Unauthenticated requests SHALL return only products with `publicado: true`. Authenticated requests (any role, optional token) SHALL be allowed to see all products (including unpublished) by passing `?publicado=`. All responses SHALL use the standard envelope `{ data, error, meta }`. `GET /api/v1/products/:id` and `GET /api/v1/products/slug/:slug` SHALL return 404 when the product does not exist or is not published for an anonymous caller.

#### Scenario: List products publicly returns only published
- **WHEN** `GET /api/v1/products` is requested without a token
- **THEN** the response is 200 and `data` contains only products with `publicado: true`

#### Scenario: List products filtered by parent category
- **WHEN** `GET /api/v1/products?categoriaId=cat-1` is requested
- **THEN** only products with `categoriaId: "cat-1"` (and published for anonymous) are returned

#### Scenario: List products filtered by subcategory
- **WHEN** `GET /api/v1/products?subcategoriaId=sub-1` is requested
- **THEN** only products with `subcategoriaId: "sub-1"` are returned

#### Scenario: List products filtered by destacado
- **WHEN** `GET /api/v1/products?destacado=true` is requested
- **THEN** only products with `destacado: true` are returned

#### Scenario: Search products by text
- **WHEN** `GET /api/v1/products?search=valvula` is requested
- **THEN** only products whose `titulo`, `sku`, or `descripcionBreve` contain the term are returned

#### Scenario: Get a single product by id
- **WHEN** `GET /api/v1/products/{id}` is requested for an existing published product
- **THEN** the response is 200 with that product in `data`

#### Scenario: Get a single product by slug
- **WHEN** `GET /api/v1/products/slug/{slug}` is requested for an existing published product
- **THEN** the response is 200 with that product in `data`

#### Scenario: Get a missing product returns 404
- **WHEN** `GET /api/v1/products/{id}` is requested for a non-existent or unpublished product (anonymous)
- **THEN** the response status is 404

#### Scenario: Authenticated user can see unpublished products
- **WHEN** an authenticated user requests `GET /api/v1/products?publicado=false`
- **THEN** unpublished products are included in `data`

### Requirement: Backend SHALL expose authenticated product write endpoints
The backend-productos SHALL provide `POST /api/v1/products`, `PUT /api/v1/products/{id}`, `PATCH /api/v1/products/{id}` and `DELETE /api/v1/products/{id}`. `POST` and `DELETE` SHALL require a valid Firebase ID token and the caller SHALL have role `superadmin` OR `admin`. `PUT`/`PATCH` SHALL additionally allow role `editor` (an editor may edit but not create or delete products, consistent with categorías/subcategorías). Missing/invalid token → 401; insufficient role → 403. `POST` returns 201; `PUT`/`PATCH` return 200; `DELETE` returns 204.

#### Scenario: Admin creates a product
- **WHEN** an authenticated `admin` sends `POST /api/v1/products` with valid `sku`, `titulo` and `categoriaId`
- **THEN** the response is 201 and the product is created

#### Scenario: Unauthenticated create is rejected
- **WHEN** `POST /api/v1/products` is requested without a token
- **THEN** the response status is 401

#### Scenario: Editor cannot create a product
- **WHEN** an authenticated `editor` sends `POST /api/v1/products`
- **THEN** the response status is 403

#### Scenario: Editor can update a product
- **WHEN** an authenticated `editor` sends `PUT /api/v1/products/{id}` with valid fields
- **THEN** the response is 200 and the product is updated

#### Scenario: Editor cannot delete a product
- **WHEN** an authenticated `editor` sends `DELETE /api/v1/products/{id}`
- **THEN** the response status is 403

#### Scenario: Admin deletes a product
- **WHEN** an authenticated `admin` sends `DELETE /api/v1/products/{id}` for an existing product
- **THEN** the response status is 204

### Requirement: Backend SHALL enforce product business rules
The backend-productos SHALL enforce, in `ProductoWriteService`: (a) global `sku` uniqueness — creating/updating to a `sku` already used by another product SHALL return 409; (b) global `slug` uniqueness — a `slug` already used by another product SHALL return 409; if `slug` is omitted on create it SHALL be auto-generated from `titulo` (and still must be unique); (c) the referenced `categoriaId` MUST exist (defaulting to `"sin-categoria"` when omitted), otherwise 404; (d) if `subcategoriaId` is provided it MUST belong to `categoriaId` (via `ISubcategoriaIntegrityRepository.belongsToCategoria`), otherwise 409; (e) `galeria` SHALL have at most 10 elements, otherwise 422; (f) `fichaTecnica`, when provided, SHALL have `url`, `storagePath`, `nombreArchivo` and `nombreArchivo` SHALL match `/\.pdf$/i`, otherwise 422; (g) operations on a non-existent product SHALL return 404.

#### Scenario: Duplicate SKU is rejected with 409
- **WHEN** a product is created or updated to a `sku` already used by another product
- **THEN** the response status is 409

#### Scenario: Duplicate slug is rejected with 409
- **WHEN** a product is created or updated to a `slug` already used by another product
- **THEN** the response status is 409

#### Scenario: Slug is auto-generated from titulo when omitted
- **WHEN** a product is created without a `slug`
- **THEN** the `slug` is derived from `titulo` and the product is created (409 if the derived slug collides)

#### Scenario: Creating under a non-existent category returns 404
- **WHEN** `POST /api/v1/products` is sent with a `categoriaId` that does not exist
- **THEN** the response status is 404

#### Scenario: Inconsistent category/subcategory is rejected with 409
- **WHEN** a product is created/updated with a `subcategoriaId` that does not belong to its `categoriaId`
- **THEN** the response status is 409

#### Scenario: Gallery with more than 10 images is rejected with 422
- **WHEN** a product is created/updated with `galeria` having more than 10 elements
- **THEN** the response status is 422

#### Scenario: Malformed ficha técnica is rejected with 422
- **WHEN** a product is created/updated with a `fichaTecnica` missing fields or whose `nombreArchivo` is not a `.pdf`
- **THEN** the response status is 422

#### Scenario: Updating a missing product returns 404
- **WHEN** `PUT /api/v1/products/{id}` is requested for a non-existent product
- **THEN** the response status is 404

#### Scenario: Updating uniqueness excludes the product itself
- **WHEN** a product is updated keeping its own `sku`/`slug` unchanged
- **THEN** the update succeeds (no false 409 on self)

### Requirement: Backend SHALL default category and control published visibility
The backend-productos SHALL default `categoriaId` to `"sin-categoria"` when omitted on create. Public read endpoints SHALL return only `publicado: true` products for anonymous callers; authenticated callers MAY see unpublished products.

#### Scenario: Default category is assigned when omitted
- **WHEN** a product is created without `categoriaId`
- **THEN** the product is created with `categoriaId: "sin-categoria"`

#### Scenario: Public read shows only published products
- **WHEN** `GET /api/v1/products` is requested anonymously
- **THEN** no product with `publicado: false` appears in `data`

