# backend-seed-catalog Specification

## Purpose
TBD - created by archiving change backend-seed-catalog. Update Purpose after archive.
## Requirements
### Requirement: Seed CLI SHALL populate categories and subcategorias idempotently from the JSON file
The backend-seed-catalog SHALL provide the command `npm run seed:catalog` (mirroring `bootstrap:superadmin`) that reads `seed-categorias-subcategorias.json` (path override via `SEED_FILE_PATH`, default repo root) and creates the categories and subcategorias it describes. For each entry, if a document with the resolved deterministic id already exists, it SHALL be skipped (no duplicate, no overwrite); otherwise it SHALL be created. The command SHALL log a summary with created/skipped counts and exit 0 on success.

#### Scenario: First run creates all entries
- **WHEN** `seed:catalog` runs against empty collections
- **THEN** all 5 categories and 23 subcategorias from the JSON are created
- **AND** the process exits 0 with a summary reporting created counts > 0 and skipped counts = 0

#### Scenario: Re-run skips existing entries (idempotent)
- **WHEN** `seed:catalog` runs a second time
- **THEN** no new documents are created
- **AND** every entry is reported as skipped
- **AND** no duplicate documents exist

### Requirement: Seed SHALL use deterministic document ids
The backend-seed-catalog SHALL create each category document with id equal to its resolved `slug`, and each subcategory document with id equal to `{categoriaSlug}--{subcategoriaSlug}` (where `categoriaSlug` is the parent category's resolved slug). The subcategory's `categoriaId` field SHALL equal the parent category's resolved slug/id.

#### Scenario: Category document id equals its slug
- **WHEN** a category with `nombre: "Medición de Fluidos"` (slug `medicion-de-fluidos`) is seeded
- **THEN** the created document has id `medicion-de-fluidos`

#### Scenario: Subcategory document id is the composite key
- **WHEN** a subcategory `Medidores Electromagnéticos` under category `medicion-de-fluidos` is seeded
- **THEN** the created document has id `medicion-de-fluidos--medidores-electromagneticos`
- **AND** its `categoriaId` equals `medicion-de-fluidos`

### Requirement: Seed SHALL create the default category with esDefault true
The backend-seed-catalog SHALL create the `sin-categoria` category (from the JSON entry) with `esDefault: true`, `activa: true`, `orden: 0` and id `sin-categoria`. This is idempotent with `CategoriasModule.onModuleInit` `ensureDefault()`.

#### Scenario: Default category seeded as esDefault
- **WHEN** the seed processes the `sin-categoria` entry
- **THEN** a document with id `sin-categoria` exists with `esDefault: true`

### Requirement: Repository create SHALL support an optional explicit id (and esDefault for categories) without changing the public API
The backend-seed-catalog SHALL extend `CategoriaInput` with optional `id?: string` and `esDefault?: boolean`, and `SubcategoriaInput` with optional `id?: string`. The repository `create()` SHALL use the provided `id` (instead of auto-generating) when present, and persist `esDefault` (default `false` for categories) when provided. The HTTP DTOs (`CategoriaCreateDto`/`SubcategoriaCreateDto`) SHALL remain unchanged so the public API contract is unaffected. The interface method count SHALL remain ≤ 5 (ISP).

#### Scenario: Create with explicit id stores that exact id
- **WHEN** `repository.create({ ..., id: 'medicion-de-fluidos' })` is called
- **THEN** the stored document has id `medicion-de-fluidos`

#### Scenario: Create without id auto-generates an id
- **WHEN** `repository.create({ ... })` is called without `id`
- **THEN** the stored document has a non-empty auto-generated id

#### Scenario: Create with esDefault true persists it for categories
- **WHEN** `repository.create({ ..., esDefault: true })` is called for a category
- **THEN** the stored document has `esDefault: true`

### Requirement: Seed SHALL derive slug from nombre when not provided
The backend-seed-catalog SHALL resolve each entry's slug as `entry.slug ?? slugify(entry.nombre)` (using the shared `common/utils/slugify`). This applies both to the seed loader and to the category/subcategory creation services (the slug becomes optional in the HTTP DTOs, auto-generated from `nombre` like products).

#### Scenario: Seed entry without slug derives it from nombre
- **WHEN** a seed category has `nombre: "Medición de Fluidos"` and no `slug`
- **THEN** its resolved slug (and therefore its document id) is `medicion-de-fluidos`

#### Scenario: Seed entry with explicit slug uses it
- **WHEN** a seed category provides `slug: "medicion-de-fluidos"`
- **THEN** the resolved slug is `medicion-de-fluidos` (explicit value wins)

### Requirement: Seed loader SHALL fail fast on malformed input or dangling parent reference
The backend-seed-catalog loader SHALL validate the JSON shape (objects `categorias` and `subcategorias`; each category with `nombre`; each subcategory with `categoriaId` and `nombre`; types correct) and SHALL validate that every subcategory's `categoriaId` resolves to a category present in the same seed. On any violation it SHALL throw a clear error before writing anything.

#### Scenario: Malformed JSON aborts with a clear error
- **WHEN** the loader reads a JSON missing required fields or with wrong types
- **THEN** it throws an error describing the problem and creates no documents

#### Scenario: Dangling parent reference aborts with a clear error
- **WHEN** a subcategory references a `categoriaId` not present among the seed categories
- **THEN** the loader throws an error naming the missing parent, and creates no documents

