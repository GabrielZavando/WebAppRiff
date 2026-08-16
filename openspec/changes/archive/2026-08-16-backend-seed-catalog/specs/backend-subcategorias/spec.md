# backend-subcategorias Specification — DELTA (backend-seed-catalog)

> This delta modifies requirements from the canonical spec at `openspec/specs/backend-subcategorias/spec.md`.
> Archived at: `openspec/changes/backend-seed-catalog/`

## ADDED Requirements

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
