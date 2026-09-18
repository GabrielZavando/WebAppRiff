# Delta: catalog-image-migration

## ADDED Requirements

### Requirement: Public accessibility validation of migrated image URLs
The image-migration CLI SHALL validate, via an HTTP HEAD request through a domain port (UrlAccessibilityPort), that each image URL responds with HTTP 200 before persisting it into the galeria field of a productos document.

#### Scenario: URL accessible
- **WHEN** the migration uploads an image and a HEAD request to its URL returns HTTP 200
- **THEN** the URL is persisted in the product's galeria array

#### Scenario: URL not accessible
- **WHEN** a HEAD request to an uploaded image URL returns 403, 404 or times out
- **THEN** the URL is NOT persisted, the product is recorded as failed with the cause, and the migration continues with the remaining products

### Requirement: Idempotent re-run with retry of previously omitted products
The image-migration CLI SHALL skip already-migrated products without creating duplicate Storage objects, and retry products that were omitted by a previous partial run.

#### Scenario: Re-run after partial migration
- **WHEN** the command is re-executed after a partial run
- **THEN** migrated products are skipped without duplicates and previously omitted products are retried

#### Scenario: Product without pending images
- **WHEN** a product has no entries in _imagenesPendientesMigracion
- **THEN** it is omitted, its galeria remains empty, and the frontend shows the placeholder

### Requirement: Complete migration report with validated URLs
The CLI SHALL produce a final report classifying every product as migrated, omitted-with-reason, or failed-with-cause; no persisted URL may lack a successful accessibility validation.

#### Scenario: Report contains no reasonless omissions
- **WHEN** the migration finishes
- **THEN** the report lists each product's outcome with explicit reason and accessibility validation status

#### Scenario: Legacy relative URL would survive
- **WHEN** a missing blob would leave a relative legacy URL (e.g. old/galeria/...)
- **THEN** the URL is discarded or re-resolved and never persisted into galeria

### Requirement: Automatic static-site rebuild notification
When the CLI finishes with migrated changes, a RebuildNotifierService SHALL POST to CATALOG_REBUILD_WEBHOOK_URL to trigger the Astro static site rebuild; a webhook failure MUST be logged and reported without aborting the migration.

#### Scenario: Migration with changes
- **WHEN** the migration completes successfully with at least one migrated product
- **THEN** a request is sent to CATALOG_REBUILD_WEBHOOK_URL

#### Scenario: Webhook failure
- **WHEN** the webhook request fails
- **THEN** the failure is logged as a warning and the report indicates a manual rebuild is required

### Requirement: Fail-fast configuration validation
Before any write operation, the CLI SHALL validate that all required configuration (e.g. FIREBASE_STORAGE_BUCKET and Firebase credentials) is present and abort with an explicit message otherwise.

#### Scenario: Missing required variable
- **WHEN** the command runs without FIREBASE_STORAGE_BUCKET
- **THEN** it fails immediately with an explicit error message and performs no writes to Firestore or Storage

### Requirement: Domain rules enforcement during migration
The migration SHALL enforce the product domain gallery rules: maximum 10 images per product and absolute URLs only.

#### Scenario: Product with more than 10 images
- **WHEN** a product has more than 10 pending images
- **THEN** only 10 are migrated and the truncation is noted in the report
