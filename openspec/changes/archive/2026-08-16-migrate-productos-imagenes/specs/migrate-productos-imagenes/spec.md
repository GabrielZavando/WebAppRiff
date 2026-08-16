# migrate-productos-imagenes Specification — DELTA (migrate-productos-imagenes)

> This delta adds a new capability spec at `openspec/specs/migrate-productos-imagenes/spec.md`.
> It introduces a NestJS CLI command that migrates legacy WordPress product images into
> Firebase Storage and populates each product's `galeria`, idempotently and with a failure report.

## ADDED Requirements

### Requirement: Migration CLI SHALL read the image map and migrate only existing products
The backend-migrate-productos-imagenes SHALL provide `npm run migrate:productos:imagenes` that reads `_imagenesPendientesMigracion` from `seed-productos-71.json` (path override via `SEED_FILE_PATH`, default repo root). For each `productoId` whose Firestore document exists in `productos`, it SHALL migrate its source image URLs. Products whose document does not exist (e.g. `prod-054`, excluded from the seed) SHALL be recorded as `omitidos` and SHALL NOT be treated as errors.

#### Scenario: Processes only existing documents
- **WHEN** the CLI runs against the current seed (70 seeded docs; `prod-054` excluded)
- **THEN** 70 products are attempted for migration
- **AND** `prod-054` appears in the report under `omitidos`
- **AND** no fatal error is raised

#### Scenario: Dry run performs no writes
- **WHEN** the CLI runs with `--dry-run`
- **THEN** no Storage objects are uploaded and no Firestore `galeria` is written
- **AND** the report reflects what would be migrated

### Requirement: Migration SHALL download and optimize each image
For each source URL the backend-migrate-productos-imagenes SHALL download the image using a descriptive `User-Agent`, validate that the response `content-type` starts with `image/`, retry up to 2 times with backoff on failure, optimize it with `sharp` (resize to a maximum width of 800px with `withoutEnlargement`, encode as WebP at quality 82), and build a `GaleriaItem` with `orden` equal to the 1-based index, `alt` equal to the product `titulo`, `storagePath` of `productos/{productoId}/{orden}.webp`, and the resulting public `url`.

#### Scenario: Valid image is downloaded and optimized
- **WHEN** a source URL returns a valid JPEG with `content-type: image/jpeg`
- **THEN** an optimized WebP of at most 800px width is produced
- **AND** a `GaleriaItem` is built with the correct `orden`, `alt`, `storagePath` and `url`

#### Scenario: Non-image response is rejected
- **WHEN** a source URL returns a non-image `content-type`
- **THEN** the image is not optimized or uploaded
- **AND** the error is recorded for that product

#### Scenario: Unreachable URL after retries is recorded
- **WHEN** a source URL returns HTTP 404 and exhausts the 2 retries
- **THEN** the failure is recorded and the product migration continues

### Requirement: Migration SHALL persist galeria via the product repository
The backend-migrate-productos-imagenes SHALL persist the migrated `GaleriaItem[]` on the product using `IProductRepository.update(id, { galeria })`, reusing the domain `GaleriaItem` type. Before writing, it SHALL assert `galeria.length <= 10` (data-model invariant); if a product's source map exceeds 10 URLs, it SHALL migrate only the first 10 and record a warning.

#### Scenario: Galeria written through the repository
- **WHEN** a product's images are migrated successfully
- **THEN** `IProductRepository.update(productoId, { galeria })` is called with the built `GaleriaItem[]`

#### Scenario: More than 10 source URLs are truncated
- **WHEN** a product has more than 10 source URLs
- **THEN** only the first 10 are migrated
- **AND** a warning is recorded in the report

### Requirement: Migration SHALL be idempotent by completeness
The backend-migrate-productos-imagenes SHALL skip a product only when its existing `galeria.length >= sourceUrls.length` (fully migrated). A product with a partial or empty `galeria` SHALL be reprocessed on the next run, overwriting `galeria` idempotently (Storage paths are deterministic, uploads are overwrite-safe). Re-running the migration after a full successful run SHALL perform zero writes.

#### Scenario: Partial migration is completed on re-run
- **WHEN** a first run migrates 1 of 2 images for a product due to a transient failure
- **THEN** a second run reprocesses the product and completes the missing image

#### Scenario: Fully migrated product is skipped
- **WHEN** a product already has `galeria.length >= sourceUrls.length`
- **THEN** the second run performs no Storage upload and no Firestore write for that product

### Requirement: Migration SHALL be failure-tolerant and emit a report
The backend-migrate-productos-imagenes SHALL catch per-image and per-product errors, record them, and continue processing the remaining products. It SHALL terminate with a non-zero exit code only on fatal configuration errors (missing environment variables or invalid seed JSON). It SHALL write a JSON report `migracion-imagenes-reporte.json` with `exitosos`, `fallidos` and `omitidos` arrays, and print a console summary.

#### Scenario: Product with failing images appears in fallidos
- **WHEN** one or more source URLs of a product fail after retries
- **THEN** the product is listed in `fallidos` with its errors
- **AND** the remaining products are still migrated

#### Scenario: Missing required environment variable fails fast
- **WHEN** a required Firebase environment variable is missing
- **THEN** the CLI exits with code 1 and a clear error message (no secrets logged)

### Requirement: Migration SHALL reuse backend infrastructure
The backend-migrate-productos-imagenes SHALL obtain the Firebase app via the existing `FirebaseModule` (credentials from repository environment variables, no separate `admin.initializeApp`) and the product repository via `I_PRODUCT_REPOSITORY`. The download/optimize/upload logic SHALL live behind injected ports (`ImageSourcePort`, `ImageStoragePort`, `SeedImageMapLoader`) so the use-case is testable with fakes. No raw `db.collection` writes are used.

#### Scenario: Ports resolve via dependency injection
- **WHEN** the CLI module is constructed
- **THEN** `IProductRepository`, `ImageSourcePort`, `ImageStoragePort` and `SeedImageMapLoader` are provided and injected into the use-case

#### Scenario: Use-case runs with fakes in tests
- **WHEN** the use-case is executed with fake ports (no network)
- **THEN** the migration logic (idempotency, truncation, reporting) is verified without touching Firebase
