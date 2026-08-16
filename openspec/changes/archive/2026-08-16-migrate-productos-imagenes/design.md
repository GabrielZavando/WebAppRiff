## Context

The catalog seed (`backend-seed-productos`) created the 70 published/non-published products with `galeria` deliberately empty; the image URLs from the old WordPress host were kept apart in `_imagenesPendientesMigracion` so they could be migrated later. The data model defines `galeria: array<{url, storagePath, alt, orden}>` capped at 10 items. `IProductRepository.update(id, Partial<ProductoInput>)` already exists, and `FirebaseModule` provides the admin app from repository env vars (`FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY`).

There is a strong existing precedent for this kind of work:
- `apps/backend/src/cli/migrate/migrate-firestore.*` — ports (`StorageCopier`) + adapter + pure, testable use-case with fakes.
- `apps/backend/src/cli/seed/seed-productos.*` — `NestFactory` CLI entry + DI module that reuses `IProductRepository`.

The user-supplied standalone script is a good **reference** for the download/optimize/upload logic, but it bypasses the architecture (raw `admin.initializeApp`, raw `db.collection` write, no DI, no tests, no coverage). We port its logic into the established CLI pattern.

## Goals / Non-Goals

**Goals:**
- Idempotent, failure-tolerant migration with a clear JSON report.
- Reuse `IProductRepository` (identical write path to the API) and `FirebaseModule` (no separate Firebase init).
- ≥ 90% test coverage on the new code, pure use-case testable with fakes.
- Optimized public-read WebP images (800px, q82) consistent with the existing public catalog image URLs.

**Non-Goals:**
- No changes to the public HTTP API (`docs/api-spec.yml` unchanged).
- No AVIF / responsive variant generation (out of scope).
- No change to the seed flow or to the 18 not-yet-confirmed products; only the 71 entries in the image map.

## Decisions

- **CLI NestJS over standalone script**: aligns with backend-standards (DI tokens, SRP, folder structure, 90% coverage) and reuses `IProductRepository` so the persisted shape is guaranteed. Cost: more code than a one-off script — accepted.
- **Ports behind interfaces** (`ImageSourcePort`, `ImageStoragePort`, `SeedImageMapLoader`) injected via tokens; adapters implement them (`WordPressImageSource`, `FirebaseStorageUploader`). Use-case is pure and testable with fakes (mirrors `migrate-firestore.use-case.ts`). Alternative considered: raw script — rejected for the reasons above.
- **Idempotency by completeness**: skip only when `galeria.length >= sourceUrls.length`. Partial failures reprocess on the next run and overwrite `galeria`. Storage paths are deterministic (`productos/{id}/{orden}.webp`) so uploads are overwrite-safe. Alternative (skip if `galeria.length > 0`) was rejected because it would permanently leave products with missing images.
- **800px WebP q82, `alt = titulo`** (per user confirmation).
- **Public-read + 1-year `cacheControl`**, consistent with the existing `StorageCopier` public URL pattern for catalog images.
- **≤10 guard in the use-case** before `update` (data-model rule; the API enforces 422 but the migration bypasses the API, so it must assert it itself). Max in current data is 2, so the guard is defensive.
- **Explicit Storage bucket from config**: `FirebaseModule` initializes the admin app **without** a default `storageBucket`, so `getStorage(app).bucket()` has no bucket to default to (the migration's first real run failed with "Bucket name not specified or invalid"). The uploader therefore targets an **explicit** bucket read from `FIREBASE_STORAGE_BUCKET` (fail-fast if missing). For this project the value is `webappriff.firebasestorage.app` (verified by introspection; `webappriff.appspot.com` does not exist).

## Risks / Trade-offs

- [Source images may 404 or return a non-image content-type] → caught per image, recorded in the report; the known 2 problematic products surface under `fallidos`. Migration continues.
- [Product document may not exist (e.g. `prod-054` excluded from seed)] → recorded as `omitido`, not an error.
- [Re-running reprocesses partial products and overwrites `galeria`] → deterministic Storage paths make uploads idempotent; acceptable for a one-time migration.
- [`sharp` adds a native build dependency] → pin a version; ensure the backend Docker build installs it (already in the monorepo toolchain for `apps/web`).
- [Rate limits / load on the old host] → 300ms pause between downloads + 2 retries with backoff.

## Migration Plan

1. Implement the command behind `npm run migrate:productos:imagenes` (build + run dist).
2. Run with `--dry-run` first (no Storage/Firestore writes) to validate the map and counts.
3. Execute against staging; verify a sample `galeria[0].url` is publicly reachable.
4. Smoke test `GET /api/v1/products` shows non-empty `galeria`.
5. Rollback: re-running is idempotent; to undo, clearing `galeria` is out of scope (would be a separate manual step) — the run report documents what was written.

## Open Questions

- None blocking. Image params (800px / q82) and idempotency-by-completeness were confirmed by the user.
