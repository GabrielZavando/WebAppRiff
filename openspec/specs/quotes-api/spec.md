# quotes-api Specification

## Purpose
TBD - created by archiving change ampliar-e2e. Update Purpose after archive.
## Requirements
### Requirement: POST /api/v1/quotes creates a quote request (public, no auth)

The system SHALL accept quote request submissions from unauthenticated users via `POST /api/v1/quotes`. The endpoint SHALL persist the quote to the `cotizaciones` Firestore collection with `estado=pendiente` and `creadoEn` set to the server timestamp.

#### Scenario: Successful quote creation with all fields

- **WHEN** an unauthenticated POST request is made to `/api/v1/quotes` with body `{ "nombre": "Juan Pérez", "email": "juan@empresa.com", "telefono": "+56912345678", "nombre_empresa": "Empresa SA", "rut": "12.345.678-9", "mensaje": "Necesito medición de caudal" }`
- **THEN** the system responds with HTTP 201 and the body `{ "data": { "id": "<auto>", "nombre": "Juan Pérez", "email": "juan@empresa.com", "telefono": "+56912345678", "nombre_empresa": "Empresa SA", "rut": "12.345.678-9", "mensaje": "Necesito medición de caudal", "estado": "pendiente", "creadoEn": "<timestamp>" } }` wrapped in the standard envelope `{ "data": ..., "error": null, "meta": { "timestamp": ..., "path": "/api/v1/quotes" } }`

#### Scenario: Successful quote creation without optional fields

- **WHEN** an unauthenticated POST request is made to `/api/v1/quotes` with body `{ "nombre": "Ana López", "email": "ana@corp.com", "nombre_empresa": "Corp Ltda", "mensaje": "Solicitud general" }` (no `telefono`, no `rut`)
- **THEN** the system responds with HTTP 201 and the persisted quote has `telefono: null` and `rut: null`

#### Scenario: Rejected — missing required field

- **WHEN** an unauthenticated POST request is made to `/api/v1/quotes` with body `{ "nombre": "Juan", "email": "j@e.com" }` (missing `nombre_empresa` and `mensaje`)
- **THEN** the system responds with HTTP 400 and an error envelope indicating validation failure

#### Scenario: Rejected — invalid email format

- **WHEN** an unauthenticated POST request is made to `/api/v1/quotes` with body `{ "nombre": "Juan", "email": "not-an-email", "nombre_empresa": "Emp", "mensaje": "Hola" }`
- **THEN** the system responds with HTTP 400

#### Scenario: Rejected — extra fields (whitelist)

- **WHEN** an unauthenticated POST request is made to `/api/v1/quotes` with body containing fields not in the DTO (e.g., `{ "nombre": "Juan", "email": "j@e.com", "nombre_empresa": "Emp", "mensaje": "Hola", "hackerfield": "injected" }`)
- **THEN** the system responds with HTTP 400 (forbidNonWhitelisted)

### Requirement: GET /api/v1/quotes lists quotes (admin, paginated)

The system SHALL return a paginated list of quotes to authenticated users with `superadmin` or `admin` roles. The list SHALL support filtering by `estado` and pagination via `page`/`limit` query parameters.

#### Scenario: Admin lists all quotes

- **WHEN** an authenticated request with role `admin` is made to `GET /api/v1/quotes`
- **THEN** the system responds with HTTP 200 and a paginated list `{ "data": [...], "meta": { "page": 1, "limit": 20, "total": N } }` (envelope wrapped)

#### Scenario: Admin filters by estado

- **WHEN** an authenticated request with role `admin` is made to `GET /api/v1/quotes?estado=pendiente`
- **THEN** the system responds with only quotes having `estado=pendiente`

#### Scenario: Unauthenticated — 401

- **WHEN** an unauthenticated request is made to `GET /api/v1/quotes`
- **THEN** the system responds with HTTP 401

#### Scenario: Non-admin role — 403

- **WHEN** an authenticated request with role `editor` is made to `GET /api/v1/quotes`
- **THEN** the system responds with HTTP 403

### Requirement: GET /api/v1/quotes/:id returns a single quote (admin)

The system SHALL return a single quote by ID to authenticated users with `superadmin` or `admin` roles.

#### Scenario: Admin retrieves quote by ID

- **WHEN** an authenticated request with role `admin` is made to `GET /api/v1/quotes/{id}` where the quote exists
- **THEN** the system responds with HTTP 200 and the quote data in the envelope

#### Scenario: Quote not found

- **WHEN** an authenticated request with role `admin` is made to `GET /api/v1/quotes/nonexistent-id`
- **THEN** the system responds with HTTP 404

### Requirement: PATCH /api/v1/quotes/:id updates quote estado (admin/editor)

The system SHALL allow authenticated users with `superadmin`, `admin`, or `editor` roles to update the `estado` field of a quote.

#### Scenario: Admin updates estado to atendida

- **WHEN** an authenticated request with role `admin` is made to `PATCH /api/v1/quotes/{id}` with body `{ "estado": "atendida" }`
- **THEN** the system responds with HTTP 200 and the updated quote with `estado: "atendida"`

#### Scenario: Rejected — invalid estado value

- **WHEN** an authenticated request with role `admin` is made to `PATCH /api/v1/quotes/{id}` with body `{ "estado": "invalido" }`
- **THEN** the system responds with HTTP 400

### Requirement: CotizacionCreate contract includes rut optional

The `CotizacionCreate` schema in `api-spec.yml` SHALL include `rut` as an optional string field. The `Cotizacion` schema SHALL include `rut` as an optional string field.

#### Scenario: api-spec.yml reflects rut

- **WHEN** `docs/api/api-spec.yml` is inspected
- **THEN** `CotizacionCreate` properties include `rut` (type: string, not in required[]) and `Cotizacion` properties include `rut` (type: string)

### Requirement: data-model.md documents cotizaciones collection

The `docs/data-model/data-model.md` file SHALL document the `cotizaciones` Firestore collection with its fields, types, and indexes.

#### Scenario: data-model includes cotizaciones

- **WHEN** `docs/data-model/data-model.md` is inspected
- **THEN** it contains a section documenting the `cotizaciones` collection with fields: `id`, `nombre`, `email`, `telefono`, `nombre_empresa`, `rut`, `mensaje`, `estado`, `creadoEn`, `actualizadoEn`

