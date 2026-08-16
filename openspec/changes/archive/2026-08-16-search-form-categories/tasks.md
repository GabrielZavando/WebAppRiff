## 1. Backend — Domain port and event types

- [x] 1.1 Create `categorias/domain/icategory-change-notifier.ts` with `CategoryChangeAction`, `CategoryChangeEvent`, `ICategoryChangeNotifier` (single `notifyChange` method) and the `I_CATEGORY_CHANGE_NOTIFIER` token.
- [x] 1.2 Write a contract test asserting any `ICategoryChangeNotifier` implementation satisfies the interface shape and that `notifyChange` accepts the event type.

## 2. Backend — Webhook notifier (infrastructure) + DI

- [x] 2.1 Write `webhook-category-change-notifier.spec.ts`: with `CATEGORIES_WEBHOOK_URL` set, a `POST` is sent with method/headers/JSON body; with it unset, no request is made; on transport failure it does not throw.
- [x] 2.2 Implement `categorias/infrastructure/webhook-category-change-notifier.ts` reading `process.env.CATEGORIES_WEBHOOK_URL` (Node 20 global `fetch`), fire-and-forget, catching errors and logging a warning.
- [x] 2.3 Register `{ provide: I_CATEGORY_CHANGE_NOTIFIER, useClass: WebhookCategoryChangeNotifier }` in `categorias/categorias.module.ts`.

## 3. Backend — Service emits on mutation

- [x] 3.1 Write `categoria.service.spec.ts` asserting `notifyChange` is called with the correct event after `create`/`update`/`remove` (mock the notifier).
- [x] 3.2 Inject `I_CATEGORY_CHANGE_NOTIFIER` into `CategoriaService` and invoke `notifyChange` after each successful mutation (without awaiting).

## 4. Frontend — Build-time categories module + tests

- [x] 4.1 Write `lib/api/__tests__/categories.test.ts`: `toCategoryOptions` prepends default, sorts by `orden` then `nombre`, maps `label = nombre`; `getSearchFormCategories` maps+prepends on success, returns cached on 2nd call, falls back to default-only on error, and hits `?activa=true` with the configured base URL.
- [x] 4.2 Implement `lib/api/categories.ts`: `CategoriaApi` type, `getSearchFormCategories()` (module cache, `process.env.NESTJS_API_URL` default, `toCategoryOptions`, safe fallback), and `DEFAULT_CATEGORY_OPTION`.

## 5. Frontend — Layout wiring + config cleanup

- [x] 5.1 In `layouts/Layout.astro`, replace `categories: CATEGORY_OPTIONS` with `categories: await getSearchFormCategories()` (no `fetch`/`import.meta.env` in frontmatter).
- [x] 5.2 Remove the hardcoded `CATEGORY_OPTIONS` from `lib/config/search-form.ts` (keep `getSearchFormConfig` and `buildSearchHref`); update `lib/config/__tests__/search-form.test.ts` to drop the `CATEGORY_OPTIONS` assertions.
- [x] 5.3 Verify `SearchForm.astro` still renders correctly with dynamic `categories` (no component change required).

## 6. Documentation

- [x] 6.1 Update `docs/api-spec.yml` with a note on the `POST`/`PUT`/`PATCH`/`DELETE /api/v1/categories` side-effect and the `CATEGORIES_WEBHOOK_URL` env var.
- [x] 6.2 Add `CATEGORIES_WEBHOOK_URL` to the environment variables table in `docs/deploy-standards.md`.

## 7. Verification

- [x] 7.1 Run backend tests (`CategoriasModule` suite) and frontend tests (vitest) — all green.
- [x] 7.2 `openspec validate search-form-categories` passes.
