## 1. Shared sanitization package

- [x] 1.1 Scaffold `packages/html-sanitize` (package.json, tsconfig, `src/index.ts` exporting `sanitizeRichHtml`/`stripHtmlToText` + `RICH_HTML_CONFIG`)
- [x] 1.2 Add `@riff/html-sanitize` to root `workspaces`; build the package to `dist` as a **dual CJS+ESM** bundle (`dist/index.cjs` for the NestJS backend, `dist/index.js` ESM for Vite/Astro) via `exports.require`/`exports.import`, and consume it via the workspace symlink. `tsconfig` `paths` mappings were reverted (packaging avoids a `tsc` `rootDir` violation); the dual build fixes a `exports is not defined` error when Astro/Vite loaded the former CJS-only package in an ESM (SSR) context.
- [x] 1.3 Add dependencies `sanitize-html` (+`@types/sanitize-html`) and `he` to the shared package
- [x] 1.4 Write unit tests (Vitest/Jest) for `sanitizeRichHtml` (keeps safe tags; strips `script`/`iframe`/`on*`; strips `style`/`class`; `div→p`; decodes double-escaped; forces `rel`) and `stripHtmlToText` (removes tags; decodes; collapses whitespace)

## 2. Backend write-path sanitization

- [x] 2.1 Create `IHtmlSanitizer` port + `I_HTML_SANITIZER` token in `apps/backend/src/productos/domain/ihtml-sanitizer.ts`
- [x] 2.2 Create `HtmlSanitizerService` adapter in `apps/backend/src/productos/infrastructure/html-sanitizer.service.ts` delegating to `@riff/html-sanitize`; register via injection token in `productos.module.ts`
- [x] 2.3 Fold sanitization into `ProductoConsistencyService` (now 3 deps: integrity repo + subcategoria integrity repo + html sanitizer) via a new `sanitizeDescriptions()` method that sanitizes `descripcionLarga` (`sanitizeRichHtml`) and strips `descripcionBreve` (`stripHtmlToText`). `ProductoWriteService` create/update and `seed-productos.use-case` call `sanitizeDescriptions()` before the repository call. (Folded into the consistency service instead of `ProductoWriteService` to respect the ≤3-dependency rule.)
- [x] 2.4 Write tests: `producto-write.service.spec.ts` (mock consistency) asserts sanitize called on create/update; `producto-consistency.service.spec.ts` (mock `@riff/html-sanitize`) asserts sanitize/strip behavior and acceptance on missing/empty fields

## 3. Backend data migration

- [x] 3.1 Create `apps/backend/src/cli/normalize-descriptions.ts` CLI (reads all `productos` via `IProductQueryRepository.findAll`, applies `sanitizeRichHtml`/`stripHtmlToText`, writes back only on change via `IProductRepository.update`, with `--dry-run` flag)
- [x] 3.2 Add `migrate:descriptions` npm script in `apps/backend/package.json`
- [x] 3.3 Write unit test (`normalize-descriptions.use-case.spec.ts`) of the transform with double-escaped + stray-tag fixtures, asserting dry-run gating and write-back counts

## 4. Frontend mapping + render

- [x] 4.1 Update `toProductDetailModel`: `descripcionBreve = stripHtmlToText(...)`, `descripcionLarga = sanitizeRichHtml(...)`
- [x] 4.2 Update `toProductCardModel`: `descripcionBreve = stripHtmlToText(...)`
- [x] 4.3 Add Vitest tests for both mappers (sanitize/strip assertions)
- [x] 4.4 Render `descripcionLarga` via `set:html` in `apps/web/src/pages/productos/[slug].astro` inside a `.rich-text` container
- [x] 4.5 Add `.rich-text` scoped styles in `apps/web/src/styles/globals.css` using design tokens only (no raw hex, radius 0)
- [x] 4.6 Extend render tests: `[slug].test.ts` asserts a real `<p>` element and absence of `<script>`/`class="et_pb*`; `ProductCard`/`ProductListItem` tests assert plain-text `descripcionBreve`

## 5. Documentation

- [x] 5.1 Update `docs/api-spec.yml`: `descripcionLarga` (sanitized HTML subset, server sanitizes on write) and `descripcionBreve` (plain text, HTML stripped on write)
- [x] 5.2 Update `docs/data-model.md`: field descriptions + short sanitization-policy note

## 6. Verification

- [x] 6.1 `lint` + `typecheck` pass for `apps/backend` and `apps/web` (web has 8 pre-existing `astro check` errors unrelated to this change — none in touched files; `astro check` is clean for the new `.astro`/`.ts`/`.css`; backend ESLint: 0 errors in production files)
- [x] 6.2 Test suites green for `apps/backend` (359 passed) and `apps/web` (68 files passed)
- [x] 6.3 `build` succeeds for `apps/backend` (`nest build` OK; `dist/cli/normalize-descriptions.js` compiled). `apps/web` build (`astro build`) is gated by the live backend API for `getStaticPaths` data fetch — verified instead via `astro check` (clean for touched files) + mocked container render tests that exercise the new `set:html` + `.rich-text` output
- [x] 6.4 Manual: `migrate:descriptions --dry-run` → 70 scanned / 68 to change. Ejecutado sin flag → **68 written**. El rebuild del sitio público (SSG) es un paso de deploy (Coolify/`astro build`) y queda fuera de `/apply`.

## 7. Follow-up fixes (post-apply)

- [x] 7.1 Package `@riff/html-sanitize` was CJS-only → `exports is not defined` in Astro/Vite SSR. Fixed with a dual CJS+ESM build (`dist/index.cjs` + `dist/index.js`, `exports.require`/`exports.import`). (see Task 1.2 note)
- [x] 7.2 `descripcionBreve`/`descripcionLarga` still rendered literal `\n` because legacy seed data stored newlines as double-encoded `\r\n` (real CR + literal `\n`). `stripHtmlToText` and `sanitizeRichHtml` now also decode literal `\n`/`\r`/`\t` escapes and `stripHtmlToText` collapses all whitespace to single spaces. Re-run `migrate:descriptions` (no flag) to normalize existing Firestore docs.
- [x] 7.3 `NormalizeDescriptionsModule` failed to boot (`FIRESTORE` unresolved) because `ProductosModule` imports `FirebaseModule` but not the `@Global` `FirestoreModule`; added explicit `FirebaseModule` + `FirestoreModule` imports (mirrors `SeedProductosModule`). Dry-run result: 70 scanned, 68 to change, 0 written.
