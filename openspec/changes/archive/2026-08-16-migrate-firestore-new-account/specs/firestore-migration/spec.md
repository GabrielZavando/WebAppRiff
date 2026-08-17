## ADDED Requirements

### Requirement: Copy catalog data preserving document IDs
The migration tool SHALL copy the `categorias`, `subcategorias`, `productos` and
`cotizaciones` collections from a source Firebase project to a destination project,
preserving each document's original ID (including `categorias/sin-categoria`).

#### Scenario: Catalog collections copied with original IDs
- **WHEN** the migration tool runs against a configured source and destination project
- **THEN** every document in `categorias`, `subcategorias`, `productos` and `cotizaciones` is written to the destination using its original document ID, and `categorias/sin-categoria` exists with `esDefault: true`

#### Scenario: Idempotent re-execution
- **WHEN** the migration tool runs and a target document already exists in the destination
- **THEN** the existing document is not overwritten or duplicated (the document is skipped)

#### Scenario: Usuarios collection excluded
- **WHEN** the migration tool runs
- **THEN** the `usuarios` collection is NOT copied to the destination (it is recreated via superadmin bootstrap)

### Requirement: Conditional Storage blob migration
The migration tool SHALL, for each product, inspect `galeria[].storagePath` and
`fichaTecnica.storagePath` and copy referenced blobs from the source Storage bucket to
the destination bucket, rewriting `url` and `storagePath` accordingly — only when such
blobs exist.

#### Scenario: Blobs present in source bucket
- **WHEN** a product references a `storagePath` that exists in the source Storage bucket
- **THEN** the blob is copied to the destination bucket and the product's `url` and `storagePath` are rewritten to point at the destination

#### Scenario: No blobs referenced
- **WHEN** the source Storage bucket contains no blobs referenced by any product
- **THEN** the tool reports zero blobs copied and completes the data migration without error

### Requirement: Dry-run reporting without writes
The migration tool SHALL support a `--dry-run` mode that reports collection counts and
the Storage pre-check without writing any data to the destination.

#### Scenario: Dry-run produces a report only
- **WHEN** the tool is invoked with `--dry-run`
- **THEN** it outputs source/destination document counts and the Storage pre-check report and performs no writes to Firestore or Storage

<!-- Requirement "Post-migration integrity validation" removed (2026-08-16): the data
has already been migrated (5 categorías, 24 subcategorías, 70 productos) and confirmed in
the destination console; the destination is now the source of truth. Automated post-copy
count/uniqueness checks and non-zero exit on discrepancy are no longer required. Uniqueness
of sku/slug remains enforced by backend business rules and validated in smoke tests. -->
