## Why

The product catalog was seeded from `seed-productos-71.json` with `galeria` left **empty by design**; the original product images still live on the legacy WordPress hosting (`yellowgreen-penguin-726314.hostingersite.com`) and are referenced only in the `_imagenesPendientesMigracion` block of the seed file. To make the public catalog functional we must copy those images into Firebase Storage, optimize them (WebP, max 800px), and link each image set to its product by populating `productos.{id}.galeria`.

## What Changes

- Add a new NestJS CLI command `migrate:productos:imagenes` that reads `_imagenesPendientesMigracion` from the seed JSON.
- For each product whose Firestore document exists, download each source image (with retries + backoff), optimize it with `sharp` (resize ≤ 800px width, WebP quality 82), and upload it to Firebase Storage at `productos/{id}/{orden}.webp` (public read, 1-year cache).
- Persist the resulting `GaleriaItem[]` on the product via `IProductRepository.update`, enforcing the data-model invariant of ≤ 10 images.
- The migration is **idempotent** (skips only fully-migrated products) and **failure-tolerant** (continues on per-image/per-product errors), emitting a JSON report (`migracion-imagenes-reporte.json`).
- No HTTP API contract changes.

## Capabilities

### New Capabilities
- `migrate-productos-imagenes`: CLI command + domain logic to migrate legacy product images into Firebase Storage and populate each product's `galeria`, idempotently and with a failure report.

### Modified Capabilities
<!-- none: no existing spec-level behavior changes -->

## Impact

- New code under `apps/backend/src/cli/migrate-imagenes/`.
- Depends on `firebase-admin` (already present) + `sharp` (new dependency in `@riff/backend`).
- Writes to Firestore (`productos` collection) and Firebase Storage (bucket configured via existing env vars).
- No changes to `docs/api-spec.yml` (no public API change).
