## Why

The global `SearchForm` currently renders a hardcoded `CATEGORY_OPTIONS` list in `lib/config/search-form.ts`. Real categories already live in Firestore and are exposed via `GET /api/v1/categories`, so the form should consume them instead. Because the site is statically generated (SSG), categories are already baked into the HTML at build time — meaning there is **no per-page-load API call today**. The problem to solve is keeping that list *dynamic* (sourced from the DB) and *fresh* (updated when an admin edits a category) without manual rebuilds or runtime fetches.

## What Changes

- The `SearchForm` category list is sourced at build time from `GET /api/v1/categories?activa=true` (via a new `lib/api/categories.ts` module), replacing the hardcoded `CATEGORY_OPTIONS` constant.
- The list keeps the `"Todas las categorías"` default option first, maps active categories to `{ id, label: nombre }`, and is ordered by `orden` then `nombre`.
- A module-level cache ensures a single fetch per build; if the API is unreachable the form falls back to only the default option so the build never fails.
- The backend gains a `CategoryChangeNotifier` (injected Strategy). After a successful category `create`/`update`/`delete`, it fires a `POST` to `CATEGORIES_WEBHOOK_URL` (e.g. a Coolify deploy webhook) to trigger a site rebuild. It is a no-op when the env var is unset and never blocks or fails the mutation.
- `docs/api-spec.yml` documents the webhook side-effect; `docs/deploy-standards.md` adds the `CATEGORIES_WEBHOOK_URL` env var.

## Capabilities

### New Capabilities

### Modified Capabilities

- `search-form`: the category list is now sourced from the backend at build time instead of a hardcoded constant (default option and ordering preserved).
- `backend-categorias`: the write endpoints now notify a configured webhook when a category is created, updated, or deleted.

## Impact

- `apps/web/src/lib/api/categories.ts` (new), `apps/web/src/layouts/Layout.astro` (wiring), `apps/web/src/lib/config/search-form.ts` (remove hardcoded options).
- `apps/backend/src/categorias/domain/icategory-change-notifier.ts` (new port), `apps/backend/src/categorias/infrastructure/webhook-category-change-notifier.ts` (new), `apps/backend/src/categorias/application/categoria.service.ts` (emit), `apps/backend/src/categorias/categorias.module.ts` (DI).
- Docs: `docs/api-spec.yml`, `docs/deploy-standards.md`.
