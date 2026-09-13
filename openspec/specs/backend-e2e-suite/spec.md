# backend-e2e-suite Specification

## Purpose
TBD - created by archiving change ampliar-e2e. Update Purpose after archive.
## Requirements
### Requirement: Backend e2e infrastructure with shared Firestore fake

The system SHALL provide a shared in-memory Firestore fake (`apps/backend/test/fake-firestore.ts`) that implements the collection/document/query chain used by the repository layer (`where`, `orderBy`, `select`, `offset`, `limit`, `count`, `get`, `doc`, `add`). The fake SHALL be seeded with fixture data (categories, subcategories, products, quotes).

#### Scenario: fake Firestore supports repository operations

- **WHEN** the fake Firestore is instantiated with seed data
- **THEN** it supports `collection('productos').where('publicado', '==', true).orderBy('creadoEn', 'desc').offset(0).limit(24).get()` and returns matching documents

#### Scenario: fake Firestore supports count

- **WHEN** `collection('productos').where('publicado', '==', true).count().get()` is called
- **THEN** it returns `{ data: () => ({ count: N }) }` where N is the number of matching documents

### Requirement: e2e test suite covers all public endpoints

The system SHALL provide `apps/backend/test/app.e2e-spec.ts` that boots the full NestJS AppModule with the Firestore fake override and tests all public endpoints via supertest.

#### Scenario: GET /health returns 200

- **WHEN** a GET request is made to `/health`
- **THEN** the response is HTTP 200 with `{ "status": "ok", "firebase": "up" }`

#### Scenario: GET /api/v1/products returns paginated envelope

- **WHEN** a GET request is made to `/api/v1/products?page=1&limit=24`
- **THEN** the response is HTTP 200 with envelope `{ "data": [<products>], "error": null, "meta": { "timestamp": ..., "path": ... } }`; server-side pagination is applied (products returned respect `page`/`limit`) but the list is a plain array (no pagination fields in `meta` — the catalog pagination contract lives in the e2e of `/api/v1/quotes` which returns `{page, limit, total}` in `meta`)

#### Scenario: GET /api/v1/products card projection (anonymous)

- **WHEN** a GET request is made to `/api/v1/products` without authentication
- **THEN** each product in `data` has only card fields (no `descripcionLarga`, no full `galeria`)

#### Scenario: GET /api/v1/products/slug/:slug returns product detail

- **WHEN** a GET request is made to `/api/v1/products/slug/{known-slug}`
- **THEN** the response is HTTP 200 with the full product in `data`

#### Scenario: GET /api/v1/categories returns active categories

- **WHEN** a GET request is made to `/api/v1/categories?activa=true`
- **THEN** the response is HTTP 200 with `{ "data": [...] }` containing only active categories

#### Scenario: GET /api/v1/subcategories returns active subcategories

- **WHEN** a GET request is made to `/api/v1/subcategories?activa=true`
- **THEN** the response is HTTP 200 with `{ "data": [...] }` containing only active subcategories

#### Scenario: POST /api/v1/quotes creates quote (201)

- **WHEN** a POST request is made to `/api/v1/quotes` with valid body
- **THEN** the response is HTTP 201 with the quote in `data` and `estado: "pendiente"`

#### Scenario: POST /api/v1/quotes rejects invalid body (400)

- **WHEN** a POST request is made to `/api/v1/quotes` with missing required fields
- **THEN** the response is HTTP 400

### Requirement: e2e test suite covers admin guard behavior

The e2e suite SHALL verify that admin-guarded endpoints enforce authentication and authorization.

#### Scenario: GET /api/v1/quotes without token — 401

- **WHEN** a GET request is made to `/api/v1/quotes` without Firebase token
- **THEN** the response is HTTP 401

#### Scenario: GET /api/v1/quotes with non-admin token — 403

- **WHEN** a GET request is made to `/api/v1/quotes` with a valid Firebase token that has role `editor`
- **THEN** the response is HTTP 403

### Requirement: jest-e2e.json removes passWithNoTests

The `apps/backend/jest-e2e.json` configuration SHALL NOT include `passWithNoTests: true`. CI SHALL fail if the e2e test directory is empty.

#### Scenario: CI fails on empty test directory

- **WHEN** all files in `apps/backend/test/` are deleted
- **THEN** `npm run test:e2e --workspace=apps/backend` exits with non-zero status

### Requirement: npm run test:smoke maps to e2e suite

The `test:smoke` script in `apps/backend/package.json` SHALL execute the e2e test suite (same as `npm run test:e2e`).

#### Scenario: test:smoke runs e2e

- **WHEN** `npm run test:smoke` is executed in the backend workspace
- **THEN** the same test files as `npm run test:e2e` are executed

