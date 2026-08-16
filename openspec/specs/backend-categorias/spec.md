# backend-categorias Specification

## Purpose
TBD - created by archiving change backend-categorias. Update Purpose after archive.
## Requirements
### Requirement: Backend SHALL expose public category read endpoints
The backend-categorias SHALL provide `GET /api/v1/categories` (optionally filtered by `?activa=<boolean>`) and `GET /api/v1/categories/{id}`, both publicly accessible (no authentication required), returning the standard response envelope `{ data, error, meta }`. `GET /api/v1/categories/{id}` SHALL return 404 when the category does not exist.

#### Scenario: List categories publicly
- **WHEN** `GET /api/v1/categories` is requested without a token
- **THEN** the response is 200 with the categories array wrapped in `data`
- **AND** the response is NOT wrapped in an error envelope

#### Scenario: List categories filtered by active flag
- **WHEN** `GET /api/v1/categories?activa=true` is requested
- **THEN** only categories with `activa: true` are returned in `data`

#### Scenario: Get a single category by id
- **WHEN** `GET /api/v1/categories/{id}` is requested for an existing category
- **THEN** the response is 200 with that category in `data`

#### Scenario: Get a missing category returns 404
- **WHEN** `GET /api/v1/categories/{id}` is requested for a non-existent category
- **THEN** the response status is 404

### Requirement: Backend SHALL expose authenticated category write endpoints
The backend-categorias SHALL provide `POST /api/v1/categories`, `PUT /api/v1/categories/{id}`, `PATCH /api/v1/categories/{id}` and `DELETE /api/v1/categories/{id}`. `POST` and `DELETE` SHALL require a valid Firebase ID token and the caller SHALL have role `superadmin` OR `admin`. `PUT`/`PATCH` SHALL additionally allow role `editor` (an editor may edit but not create or delete categories). Missing/invalid token → 401; insufficient role → 403. `POST` returns 201; `PUT`/`PATCH` return 200; `DELETE` returns 204.

#### Scenario: Admin creates a category
- **WHEN** an authenticated `admin` sends `POST /api/v1/categories` with valid `nombre` and `slug`
- **THEN** the response is 201 and the category is created

#### Scenario: Unauthenticated create is rejected
- **WHEN** `POST /api/v1/categories` is requested without a token
- **THEN** the response status is 401

#### Scenario: Editor cannot create a category
- **WHEN** an authenticated `editor` sends `POST /api/v1/categories`
- **THEN** the response status is 403

#### Scenario: Editor can update a category
- **WHEN** an authenticated `editor` sends `PUT /api/v1/categories/{id}` with valid fields
- **THEN** the response is 200 and the category is updated

#### Scenario: Editor cannot delete a category
- **WHEN** an authenticated `editor` sends `DELETE /api/v1/categories/{id}`
- **THEN** the response status is 403

#### Scenario: Admin updates a category
- **WHEN** an authenticated `admin` sends `PUT /api/v1/categories/{id}` with valid fields
- **THEN** the response is 200 and the category is updated

#### Scenario: Admin deletes a category
- **WHEN** an authenticated `admin` sends `DELETE /api/v1/categories/{id}` for a deletable category
- **THEN** the response status is 204

### Requirement: Backend SHALL enforce category business rules
The backend-categorias SHALL enforce, in `CategoriaService`: (a) global slug uniqueness — creating/updating to a slug already used by another category SHALL return 409; (b) the default category (`esDefault: true`, id `sin-categoria`) SHALL never be deleted (409); (c) a category with associated products (any `productos` document with `categoriaId === id`) SHALL NOT be deleted (409); (d) operations on a non-existent category SHALL return 404.

#### Scenario: Duplicate slug is rejected with 409
- **WHEN** a category is created or updated to a `slug` already used by another category
- **THEN** the response status is 409

#### Scenario: Deleting the default category is rejected with 409
- **WHEN** `DELETE /categories/sin-categoria` is requested
- **THEN** the response status is 409

#### Scenario: Deleting a category with associated products is rejected with 409
- **WHEN** `DELETE /categories/{id}` is requested for a category that has at least one product
- **THEN** the response status is 409

#### Scenario: Updating a missing category returns 404
- **WHEN** `PUT /categories/{id}` is requested for a non-existent category
- **THEN** the response status is 404

### Requirement: Backend SHALL ensure the default category exists
The backend-categorias SHALL guarantee a default category with fixed id `sin-categoria`, `nombre` "Sin categoría", `esDefault: true` and `activa: true` exists. On module bootstrap it SHALL be created idempotently if missing.

#### Scenario: Default category is seeded idempotently
- **WHEN** the CategoriasModule initializes
- **THEN** a `categorias/sin-categoria` document exists with `esDefault: true`
- **AND** re-running bootstrap does not create a duplicate or error

### Requirement: Backend SHALL serve API routes under the /api/v1 prefix (health excluded)
The backend-categorias SHALL add a global route prefix `api/v1` (with `/health` excluded) so that API routes such as `/api/v1/users` and `/api/v1/categories` are wrapped by the existing `ResponseInterceptor` (which wraps `/api/v1/**`) and comply with the `{ data, error, meta }` envelope of `docs/api-spec.yml`. `GET /health` SHALL remain at the root path, unwrapped and unthrottled.

#### Scenario: Category response is wrapped in the envelope
- **WHEN** `GET /api/v1/categories` is requested
- **THEN** the response body has the shape `{ data: [...], error: null, meta: {...} }`

#### Scenario: Health remains at root and unwrapped
- **WHEN** `GET /health` is requested
- **THEN** the response is served at `/health` (not `/api/v1/health`)
- **AND** is NOT wrapped (raw `{ status, version, ... }`)

### Requirement: Backend SHALL auto-generate category slug from nombre when omitted
The backend-categorias `POST /api/v1/categories` SHALL accept `slug` as optional. When `slug` is omitted, the `CategoriaService.create` SHALL derive it from `nombre` using the shared `slugify` utility (lowercase, diacritics stripped, non-alphanumeric runs replaced by a single hyphen), exactly like `productos`. The global slug-uniqueness check (409 on conflict) SHALL run against the resolved slug. When `slug` is provided explicitly, it SHALL be used as-is. This is backward compatible: clients that still send `slug` behave unchanged.

#### Scenario: Create category without slug derives it from nombre
- **WHEN** an authenticated `admin` sends `POST /api/v1/categories` with `nombre: "Medición de Fluidos"` and no `slug`
- **THEN** the response is 201
- **AND** the created category has `slug` equal to `medicion-de-fluidos`

#### Scenario: Create category with explicit slug uses it
- **WHEN** an authenticated `admin` sends `POST /api/v1/categories` with `nombre: "Medición de Fluidos"` and `slug: "medicion-de-fluidos"`
- **THEN** the response is 201
- **AND** the created category has `slug` equal to `medicion-de-fluidos`

#### Scenario: Derived slug collision returns 409
- **WHEN** a category is created (with or without explicit slug) and the resolved slug already belongs to another category
- **THEN** the response status is 409

#### Scenario: Empty slug is rejected
- **WHEN** `POST /api/v1/categories` is sent with `slug: ""`
- **THEN** the response status is 422 (validation error)

### Requirement: Backend SHALL notify a configured webhook when a category is created, updated, or deleted
The backend-categorias SHALL emit a category-change notification after a successful `create`, `update`, or `remove` of a category in `CategoriaService`. The notification SHALL be dispatched through an `ICategoryChangeNotifier` port (injected abstraction), implemented by a `WebhookCategoryChangeNotifier` that performs an HTTP `POST` to the URL in the `CATEGORIES_WEBHOOK_URL` environment variable. When `CATEGORIES_WEBHOOK_URL` is unset the notifier SHALL be a no-op. The dispatch SHALL be fire-and-forget (it MUST NOT block the API response and MUST NOT cause the mutation to fail); the notifier SHALL catch and log any transport error without re-throwing. The notification payload SHALL be a JSON object `{ id: string, action: "created" | "updated" | "deleted", occurredAt: string (ISO-8601) }`.

#### Scenario: Webhook fires on create
- **WHEN** an authenticated `admin` creates a category and `CATEGORIES_WEBHOOK_URL` is configured
- **THEN** the API responds 201
- **AND** a `POST` is sent to `CATEGORIES_WEBHOOK_URL` with a JSON body containing `action: "created"` and the new category `id`

#### Scenario: Webhook fires on update
- **WHEN** an authenticated role mutates a category via `PUT`/`PATCH` and `CATEGORIES_WEBHOOK_URL` is configured
- **THEN** the API responds 200
- **AND** a `POST` is sent with `action: "updated"`

#### Scenario: Webhook fires on delete
- **WHEN** an authenticated `admin` deletes a deletable category and `CATEGORIES_WEBHOOK_URL` is configured
- **THEN** the API responds 204
- **AND** a `POST` is sent with `action: "deleted"`

#### Scenario: No-op when webhook URL is unset
- **WHEN** a category is mutated and `CATEGORIES_WEBHOOK_URL` is empty/unset
- **THEN** no outbound HTTP request is made
- **AND** the mutation completes normally

#### Scenario: Webhook failure does not break the mutation
- **WHEN** the `POST` to `CATEGORIES_WEBHOOK_URL` fails (network error / non-2xx)
- **THEN** the already-confirmed mutation response is unaffected (201/200/204)
- **AND** the error is logged as a warning without propagating to the client

