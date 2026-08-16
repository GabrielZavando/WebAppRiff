# backend-categorias Specification — DELTA (backend-seed-catalog)

> This delta modifies requirements from the canonical spec at `openspec/specs/backend-categorias/spec.md`.
> Archived at: `openspec/changes/backend-seed-catalog/`

## ADDED Requirements

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
