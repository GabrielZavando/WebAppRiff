## 1. Specs & Documentation

- [x] 1.1 Create delta spec at `openspec/changes/search-form-refine/specs/search-form/spec.md`
- [x] 1.2 Verify `docs/design/style-guide/README.md` already documents `search → lucide:search` (line 89) — no doc change needed
- [x] 1.3 Update `docs/design/style-guide/README.md` icon catalog if `lucide:search` missing — CONFIRMED present (no change)
- [x] 1.4 Update delta spec: add button width/flex decision + placeholder text change to MODIFIED requirements
- [x] 1.5 Update `docs/design/style-guide/README.md` icon catalog line 89 — `search` → `lucide:search` already present (no change)

## 2. Failing Tests — TDD Red (Phase 1: color, icon, max-width, gap)

### 2.1 Unit tests (`apps/web/src/components/__tests__/SearchForm.test.ts`)

- [x] 2.1.1 Update color assertion: `bg-accent` → `bg-primary`
- [x] 2.1.2 Update transparent mode: `bg-accent` → `bg-primary`, add `.not.toContain('bg-accent')`
- [x] 2.1.3 Add test: button contains `<svg` (lucide:search rendered) with `aria-hidden="true"`
- [x] 2.1.4 Add test: inner container carries `max-w-[860px]`, `mx-auto`, NOT `container`, NOT `px-4/6/8`
- [x] 2.1.5 Add test: form carries `md:gap-px` + `gap-3`, NOT `md:gap-3`
- [x] 2.1.6 Add test: button does NOT contain `bg-accent`
- [x] 2.1.7 Add test: button carries `hover:bg-primary-dark`
- [x] 2.1.8 Update placeholder assertion: "¿Qué productos estás buscando?" (was "¿Qué solución...")

### 2.2 Config tests (`apps/web/src/lib/config/__tests__/search-form.test.ts`)

- [x] 2.2.1 Update default config test: `inputPlaceholder` = "¿Qué productos estás buscando?"
- [x] 2.2.2 Update override test: placeholder reflects new default

### 2.3 Types tests (`apps/web/src/lib/types/__tests__/search-form.test.ts`)

- [x] 2.3.1 Update all 3 placeholder references to "¿Qué productos estás buscando?"

### 2.4 E2E tests (`apps/web/e2e/search-form.spec.ts`)

- [x] 2.4.1 Update color assertion: `rgb(242, 106, 33)` → `rgb(65, 179, 196)` (#41B3C4)
- [x] 2.4.2 Add e2e: button contains search icon SVG (`data-icon="lucide:search"`)
- [x] 2.4.3 Add e2e: form container has `max-w-[860px]`
- [x] 2.4.4 Add e2e: desktop controls separated by ≤ 2px (bounding box diff)
- [x] 2.4.5 Add e2e: button has `px-8` and `flex items-center justify-center gap-2`
- [x] 2.4.6 Add e2e: placeholder text = "¿Qué productos estás buscando?"

### 2.5 Run tests → confirm RED

- [x] 2.5.1 Run vitest → 6 tests failed as expected (Phase 1)
- [x] 2.5.2 Run vitest → 4 tests failed as expected (Phase 2: button flex, placeholder config)
- [x] 2.5.3 All failures confirmed RED before implementation

## 3. Implementation — TDD Green (Phase 1)

- [x] 3.1.1 Add `import { Icon } from 'astro-icon/components';` to frontmatter
- [x] 3.2.1 Add `<Icon name="lucide:search" class="h-4 w-4" aria-hidden="true" />` before `{config.submitLabel}`
- [x] 3.3.1 Change button color: `bg-accent hover:bg-accent-dark` → `bg-primary hover:bg-primary-dark`
- [x] 3.4.1 Change container: `container mx-auto py-4` → `max-w-[860px] mx-auto py-4`
- [x] 3.5.1 Change form gap: `gap-3` → `gap-3 md:gap-px`
- [x] 3.6.1 Run vitest → all 510 unit tests pass (GREEN)
- [x] 3.7.1 Regenerate snapshot with `npx vitest -u`
- [x] 3.8.1 Run e2e → all 18 e2e tests pass (GREEN)

## 4. Implementation — TDD Green (Phase 2: button width + placeholder)

### 4.1 SearchForm.astro — Button flex layout & wider padding

- [x] 4.1.1 Add `flex items-center justify-center gap-2` to button class
- [x] 4.1.2 Change button padding: `px-6` → `px-8`
- [x] 4.1.3 Comment updated to not contain literal "px-6" (would break `.not.toContain('px-6')` assertion)

### 4.2 Config — Placeholder text

- [x] 4.2.1 Change `SEARCH_FORM_DEFAULTS.inputPlaceholder` from "¿Qué solución está buscando?" to "¿Qué productos estás buscando?" in `apps/web/src/lib/config/search-form.ts`
- [x] 4.2.2 Update JSDoc in `apps/web/src/lib/types/search-form.ts` placeholder field doc

### 4.3 Run tests → confirm GREEN

- [x] 4.3.1 Run vitest → all 511 unit tests pass (GREEN)
- [x] 4.3.2 Run e2e → all 20 e2e tests pass (GREEN)

## 5. Build & Smoke

- [x] 5.1 `npm run typecheck` → 0 errors, 0 warnings (4 pre-existing hints)
- [x] 5.2 `npm run lint` → clean
- [x] 5.3 `npm run build` (apps/web SSG) → `data-icon="lucide:search"` present in built HTML; `bg-primary`, `px-8`, `flex items-center` on button; `max-w-[860px]` on container; placeholder "¿Qué productos estás buscando?"
- [x] 5.4 `npm run test` (vitest) → 511 passed, 0 failed
- [x] 5.5 E2E smoke → button color #41B3C4, icon present, max-width 860px, 1px gap, px-8, flex layout, placeholder text, navigation URLs canonical — all pass

## 6. Final Check

- [x] 6.1 OpenSpec artifacts: proposal, design, specs all populated
- [x] 6.2 All tasks complete
- [x] 6.3 Ready for `/archive search-form-refine`
