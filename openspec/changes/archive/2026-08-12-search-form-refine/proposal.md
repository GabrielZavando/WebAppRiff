## Why

The SearchForm submit button currently uses the `--color-accent` token (#F26A21 orange), which is inconsistent with the "SABER MÁS" CTA in `SolutionSection.astro` that already uses `bg-primary`/`bg-primary-dark` (#41B3C4 / #2E9AAD). The button also lacks a search icon (lupa), reducing discoverability. Additionally, the form uses a 12px gap (`gap-3`) between controls on desktop and a 1280px max-width (`container`), when the design calls for a narrower, centered layout (860px) with minimal 1px separation between controls on the same horizontal row.

## What Changes

- **Submit button icon**: Add a `lucide:search` icon (via `astro-icon` `<Icon>`) before the "BUSCAR" text label, with `aria-hidden="true"` (decorative — the button already has visible text).
- **Submit button color**: Change from `bg-accent`/`hover:bg-accent-dark` (#F26A21 / #D14E12) to `bg-primary`/`hover:bg-primary-dark` (#41B3C4 / #2E9AAD), aligning with the "SABER MÁS" CTA pattern in `SolutionSection.astro`.
- **Component max-width**: Constrain the inner container (direct parent of `<form>`) from `container` (max-w-7xl = 1280px, includes px-4/padding) to `max-w-[860px]` with `mx-auto` (centered), without horizontal padding so the 860px width is exact. The outer `role="search"` wrapper retains full viewport width with its `bg-white border-b border-border`.
- **Desktop horizontal gap**: Change the form's gap from `gap-3` (12px) to `gap-3 md:gap-px` — keeping 12px vertical separation on mobile (flex-col) and reducing to exactly 1px between select, input, and button on desktop (md:flex-row).

## Capabilities

### New Capabilities

- `search-form-icon`: The submit button SHALL render a `lucide:search` icon before the text label, marked `aria-hidden` since the button has visible text content.
- `search-form-max-width`: The SearchForm SHALL be constrained to a maximum width of 860px and horizontally centered on its inner container.

### Modified Capabilities

- `search-form`: The submit button color changes from `--color-accent` to `--color-primary` (with `--color-primary-dark` hover). The desktop horizontal gap between form controls changes from 12px to 1px. These are spec-level behavior changes (visual design + layout contract) that override requirements in the canonical spec at `openspec/specs/search-form/spec.md`.

## Impact

**Affected code:**
- `apps/web/src/components/SearchForm.astro` — add `Icon` import, add search icon to button, add `flex items-center justify-center gap-2`, change `px-6` → `px-8`, change button color classes, change container `class` to `max-w-[860px]`, change form gap to `gap-3 md:gap-px`
- `apps/web/src/lib/config/search-form.ts` — change `SEARCH_FORM_DEFAULTS.inputPlaceholder` from "¿Qué solución está buscando?" to "¿Qué productos estás buscando?"
- `apps/web/src/components/__tests__/SearchForm.test.ts` — update `bg-accent` → `bg-primary` assertions, add icon/flex/px-8/max-width/gap-px assertions
- `apps/web/src/lib/config/__tests__/search-form.test.ts` — update default placeholder assertion
- `apps/web/src/components/__tests__/__snapshots__/SearchForm.test.ts.snap` — regenerate snapshot
- `apps/web/e2e/search-form.spec.ts` — update color assertion, add icon/flex/px-8/max-width/gap assertions, add placeholder text assertion

**Dependencies:** None new — `@iconify-json/lucide` and `astro-icon` are already installed and configured in `astro.config.mjs` (`astroIcon()` integration).

**Invariant tests affected:** None broken — `icon-catalog.test.ts` already lists `SearchForm.astro` as a base component and only checks for obsolete prefixes (`material-symbols:`, `logos:`), which are not used. `tokens.test.ts` checks no `rounded*` usage, which remains true. `package.test.ts` and `astro-config.test.ts` are unaffected.

**No breaking changes** to public APIs or data model. No backend or API spec changes.
