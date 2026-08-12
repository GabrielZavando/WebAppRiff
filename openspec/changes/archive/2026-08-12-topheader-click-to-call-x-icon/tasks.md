## 1. Documentation & Standards

- [x] 1.1 Update `docs/design/style-guide/README.md` icon catalog: change `x/twitter` mapping from `lucide:twitter` to `simple-icons:x`; add exception note under "Set único autorizado".
- [x] 1.2 Update `docs/frontend-standards.md` icon sections (lines ~88, ~129): add the documented exception for `simple-icons:x`.

## 2. Dependency

- [x] 2.1 Add `@iconify-json/simple-icons` to `apps/web/package.json` dependencies (same `^1.2.0` range as `@iconify-json/lucide`); run install. **NOTE**: after install, clear Astro cache (`rm -rf apps/web/.astro apps/web/node_modules/.vite`) so the `virtual:astro-icon` module picks up the new icon set in dev mode.

## 3. Failing Tests (TDD Red)

- [x] 3.1 Create regression tests (vitest): assert X icon uses `simple-icons:x` (TopHeader + Footer), and `tel:+56229079067` normalization. Confirmed RED prior to implementation (2 tests failed with `lucide:twitter`).

## 4. Icon Change (TDD Green)

- [x] 4.1 In `apps/web/src/components/TopHeader.astro` line 19: change `X: 'lucide:twitter'` → `X: 'simple-icons:x'`.
- [x] 4.2 In `apps/web/src/components/Footer.astro` line 17: change `X: 'lucide:twitter'` → `X: 'simple-icons:x'`; update sync comment (lines 13-14) to note the X exception.

## 4.5 Compact TopHeader vertical footprint

- [x] 4.3 In `apps/web/src/components/TopHeader.astro` line 31: reduce root height `h-9` → `h-8`; assert no vertical margin/spacer separates TopHeader from Header in Layout.
- [x] 4.4 Add regression test: TopHeader root carries `h-8` (not `h-9`) and no root-level `mt-*`/`mb-*`/`py-*`.

## 4.6 Rebuild invariant tests for h-8 (intentional change)

- [x] 4.6 Existing test "applies brand navy background, h-9 height" updated to assert root `h-8`; scoped `h-9` check to root element (inner social cells still use `h-9`).

## 4.5 Update Invariant Tests (intentional spec change)

- [x] 4.5 Update `src/config/__tests__/package.test.ts`: allow `@iconify-json/simple-icons` alongside `lucide` (sole documented exception).
- [x] 4.6 Update `src/styles/__tests__/icon-catalog.test.ts`: remove `lucide:twitter` from LUCIDE_REFS; add `simple-icons:x` exception checks for TopHeader + Footer.

## 5. Verification

- [x] 5.1 `npm run typecheck` (apps/web) → 0 errors, 0 warnings.
- [x] 5.2 `npm run lint` (apps/web) → clean.
- [x] 5.3 `npm run build` (apps/web SSG) → `simple-icons:x` resolves; `data-icon="simple-icons:x"` present in `dist/*.html`.
- [x] 5.4 `npm run test` (vitest) → 506 passed, 0 failed.
- [x] 5.5 Visual smoke: built HTML confirms `href="tel:+56229079067"` (E.164) + `data-icon="simple-icons:x"` X logo + `h-8` (compact root height) across all 3 built pages. Dev server (`astro dev`) also confirms `data-icon="simple-icons:x"` renders and X anchors link to `https://x.com/riff` in both header and footer chrome — after clearing `.astro`/`.vite` cache.

## 6. Final Check

- [x] 6.1 OpenSpec artifacts: proposal, design, specs, tasks all `status: done`.
- [x] 6.2 All tasks complete.