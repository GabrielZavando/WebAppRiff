# backend-seed-productos Specification — DELTA (backend-seed-productos)

> This delta adds a new capability spec at `openspec/specs/backend-seed-productos/spec.md`.
> The seed CLI populates the `productos` Firestore collection idempotently from `seed-productos-71.json`, using deterministic document ids (`prod-001`…`prod-071`), reusing domain integrity rules, creating the `Medidores de Nivel` subcategory as a prerequisite, and leaving `galeria` empty (image migration is a separate change).

## ADDED Requirements

### Requirement: Seed CLI SHALL populate productos idempotently from the JSON file
`npm run seed:productos` SHALL read `seed-productos-71.json` (path override via `SEED_FILE_PATH`, default repo root) and create the products it describes. For each entry, if a document with the resolved deterministic id already exists, it SHALL be skipped (no duplicate, no overwrite); otherwise it SHALL be created. The command SHALL log a summary with created/skipped counts and exit 0 on success.

#### Scenario: First run creates 70 entries
- **WHEN** `seed:productos` runs against an empty `productos` collection
- **THEN** 70 products are created (the known duplicate `prod-054` is excluded)
- **AND** the omitted count is 0
- **AND** the process exits 0 with a summary reporting created counts > 0

#### Scenario: Re-run skips existing entries (idempotent)
- **WHEN** `seed:productos` runs a second time
- **THEN** 0 new documents are created
- **AND** every entry is reported as omitted
- **AND** no duplicate documents exist

### Requirement: Seed SHALL use deterministic document ids
The backend-seed-productos SHALL create each product document with `id` equal to the key of the product object in the seed dict (`prod-001`…`prod-071`, excluding known duplicate entries such as `prod-054`). The `slug` SHALL be resolved as `item.slug ?? slugify(titulo)`, except where a slug override is defined (see below).

#### Scenario: Document id equals the seed key
- **WHEN** a product with seed key `prod-001` is seeded
- **THEN** the created document has id `prod-001`

#### Scenario: Missing slug is derived from titulo
- **WHEN** a seed product has no explicit `slug`
- **THEN** its resolved slug equals `slugify(titulo)`

### Requirement: Seed SHALL reuse domain integrity rules
Before creating a product, the backend-seed-productos SHALL validate it via `ProductoConsistencyService.assertConsistency(categoriaId, subcategoriaId)` and `IProductIntegrityRepository.existsBySku`/`existsBySlug`. If the referenced category does not exist in Firestore, the seed SHALL fail with a clear error and create no documents.

#### Scenario: Missing category aborts with a clear error
- **WHEN** a product references a `categoriaId` not present in Firestore
- **THEN** the seed throws an error naming the missing category
- **AND** no product document is created

#### Scenario: Duplicate SKU is rejected
- **WHEN** a product's `sku` already exists in Firestore (for a different id)
- **THEN** the seed throws a conflict error and creates no document

### Requirement: Seed SHALL drop precio.moneda and seed galeria empty
The backend-seed-productos loader SHALL ignore `precio.moneda` from the seed (the data model fixes CLP). The `galeria` field SHALL be persisted as an empty array for every seeded product.

#### Scenario: moneda is not persisted
- **WHEN** a product carries `precio.moneda:"CLP"`
- **THEN** the stored document has no `precio.moneda` field

#### Scenario: galeria is seeded empty
- **WHEN** any product is seeded
- **THEN** its `galeria` field is an empty array

### Requirement: Seed SHALL exclude known duplicate entries and de-duplicate colliding slugs
The backend-seed-productos loader SHALL exclude `prod-054` (a not-published duplicate of `prod-050` sharing its slug) from the seeded set. It SHALL assign `prod-069` (a distinct product with SKU `FLO-CLT-HIL` that otherwise collides on slug with `prod-068`) the de-duplicated slug `medidor-cuenta-litros-flowtech-hil`. This keeps the global slug-uniqueness invariant intact while honoring the seed file's intent for the two not-published distinct entries, yielding 70 seeded products (68 published + 2 not-published).

#### Scenario: prod-054 is excluded from the seed
- **WHEN** the loader reads the seed file
- **THEN** `prod-054` is not present in the returned productos
- **AND** the total returned count is 70

#### Scenario: prod-069 slug is de-duplicated
- **WHEN** `prod-069` is loaded
- **THEN** its slug is `medidor-cuenta-litros-flowtech-hil` (not `medidor-cuenta-litros-flowtech`)

### Requirement: Seed SHALL create the Medidores de Nivel subcategory as prerequisite
As an idempotent prerequisite step, the backend-seed-productos SHALL create the subcategory `medicion-de-fluidos--medidores-de-nivel` (nombre "Medidores de Nivel", `categoriaId:"medicion-de-fluidos"`, `activa:true`) if it does not already exist. `prod-014` SHALL be seeded with `publicado:false` (faithful to the seed file) until the client confirms publication. `prod-069` SHALL be seeded with `publicado:false` and the de-duplicated slug `medidor-cuenta-litros-flowtech-hil` (distinct product, SKU `FLO-CLT-HIL`).

#### Scenario: Missing subcategory is created
- **WHEN** `seed:productos` runs and the subcategory does not exist
- **THEN** a document `subcategorias/medicion-de-fluidos--medidores-de-nivel` exists with `activa:true`

#### Scenario: Subcategory creation is idempotent
- **WHEN** `seed:productos` runs a second time
- **THEN** no duplicate subcategory document is created
