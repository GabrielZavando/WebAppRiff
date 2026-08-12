## Context

`SearchForm.astro` is the global search bar component (Astro SSG) rendered in `Layout.astro` below the `<Header>`. It renders a `<select>` (categorías), a `<input type="search">` (query), and a `<button type="submit">` (BUSCAR). The component is dumb/presentational — all data flows through props from `Layout.astro` which owns `CATEGORY_OPTIONS` and `getSearchFormConfig()`.

Current state of the three aspects being changed:

- **Button color**: uses `bg-accent hover:bg-accent-dark` (resolving to `--color-accent` #F26A21 / `--color-accent-dark` #D14E12). The "SABER MÁS" CTA in `SolutionSection.astro` (line 82) already uses `bg-primary hover:bg-primary-dark` (#41B3C4 / #2E9AAD). This change aligns the SearchForm button with that existing pattern.
- **Container width**: the inner wrapper uses the `.container` utility from `globals.css` (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`), giving 1280px max-width with horizontal padding that reduces the effective content width.
- **Form gap**: `class="flex flex-col md:flex-row gap-3"` — `gap-3` (12px) applies to both vertical (mobile flex-col) and horizontal (desktop flex-row) layouts.

The icon `lucide:search` is already documented in `docs/design/style-guide/README.md` (line 89) as the canonical search icon. The `@iconify-json/lucide` package is installed and `astroIcon()` is configured in `astro.config.mjs`. The import pattern `import { Icon } from 'astro-icon/components'` is used by all 5 base components (`TopHeader`, `Header`, `SolutionSection`, `ServicesSection`, `Footer`). Decorative icons in those components use `aria-hidden="true"`.

## Goals / Non-Goals

**Goals:**
- Add `lucide:search` icon to the BUSCAR button (before text, `aria-hidden="true"`).
- Change button color from accent to primary: `bg-primary hover:bg-primary-dark` (#41B3C4 / #2E9AAD).
- Constrain the inner container (direct parent of `<form>`) to `max-w-[860px]`, centered (`mx-auto`), **without horizontal padding** so the 860px width is exact.
- Reduce desktop horizontal gap between controls to 1px via `md:gap-px`; keep mobile vertical gap at `gap-3` (12px).

**Non-Goals:**
- No changes to the Header CTA button (it keeps `bg-accent`).
- No changes to the form `action`, field `name` attributes, labels, or the JS sanitisation script.
- No changes to mobile layout semantics (flex-col, full-width controls, `h-11` height).
- No changes to select/input border colors or focus states (they keep `border-border`, `focus:border-primary`).
- No new dependencies.
- No rounded corners (flat design, `--radius: 0`).
- No changes to `docs/api-spec.yml` or `docs/data-model.md` (this is purely a frontend presentational component change).

## Decisions

| Decision | Alternative considered | Rationale |
|---|---|---|
| Icon `lucide:search` placed **before** the "BUSCAR" text | After the text (matching SolutionSection's "SABER MÁS" arrow-after pattern) | Standard convention for search buttons; icon-to-left guides natural eye flow from icon to label. The SolutionSection pattern places the arrow *after* because it implies "next/forward" navigation; a search icon implies "action/enter" and reads left-to-right. |
| Icon `aria-hidden="true"` | No aria-hidden | The button has visible text content "BUSCAR", so the icon is purely decorative. `aria-hidden` prevents screen readers from announcing "BUSCAR search" (redundant). This matches the project convention (SolutionSection, Footer). |
| Color `bg-primary`/`hover:bg-primary-dark` | Keep `bg-accent` | Directly requested by the user (#41B3C4 / #2E9AAD). Also aligns with the existing "SABER MÁS" CTA that already uses these exact tokens. |
| `max-w-[860px]` on inner container **without padding** | Keep `px-4 sm:px-6 lg:px-8` padding on the container | The user explicitly requested 860px without padding interference. The outer `role="search"` wrapper retains full viewport width with `bg-white border-b border-border`. On mobile, the inner container is full-width (860px exceeds mobile viewport), so controls touch screen edges — this matches a full-bleed search bar aesthetic. If mobile edge-padding is needed, it can be added as `px-4` on the `<form>` itself (interior) without affecting the max-width constraint. |
| `gap-3 md:gap-px` (12px mobile, 1px desktop) | `gap-px` everywhere (1px on all breakpoints) | The user specified "mismo linea horizontal" (same horizontal line) = desktop only. Mobile stacking at 12px vertical separation is more usable. `gap-px` is the Tailwind v4 utility for `1px` gap, which is semantically correct for flex layouts (avoids negative-margin hacks that literal CSS margins would require). |
| Icon size `h-4 w-4` (16px) | `h-3 w-3` (12px) or `h-5 w-5` (20px) | 16px is legible at the button's `h-11` (44px) height and consistent with icon sizing norms. The SolutionSection arrow icon uses `h-3 w-3` but is on a text link; a submit button benefits from slightly more prominent icon. |
| `import { Icon } from 'astro-icon/components'` at component top | Inline SVG literal | Consistency with all 5 base components; leverages the already-configured `astroIcon()` SSR source set. No maintenance overhead of inline SVG. |
| `flex items-center justify-center gap-2` on button + `px-8` padding | Keep `px-6` without flex | User requested "un ancho un poco mayor" and "se vea mucho mejor tanto el ícono como el texto." Flex layout vertically centers the 16px icon with the 12px `text-xs` text; `gap-2` (8px) spaces them cleanly. `px-8` (up from `px-6`) gives the button more width for a balanced look. Matches the `inline-flex items-center gap-1` pattern used in SolutionSection CTA. |
| Placeholder text "¿Qué productos estás buscando?" | Keep "¿Qué solución está buscando?" | User requested the change; the new text is more specific (product-focused) and aligns the select (category) + input (product query) + button (search) as a coherent product-search unit. |

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Snapshot test fails (button class + new icon markup) | Expected and necessary; regenerate with `vitest -u` after implementation. The snapshot is the verification artifact — if it matches, the change is correct. |
| Unit test assertion `bg-accent` → needs `bg-primary` | Update in the TDD Red phase (tests first). Also update transparent-mode test. |
| E2E color assertion `rgb(242, 106, 33)` (#F26A21) | Update to `rgb(65, 179, 196)` (#41B3C4). The computed RGB is deterministic since the token is a hex literal resolved via CSS variable. |
| E2E gap assertion: 1px gap means bounding boxes differ by ≤ 1px + border widths | Use tolerance of ±2px in the Playwright bounding-box diff check (accounts for 1px border on each control). The existing e2e test already uses ±4px tolerance for aligned tops. |
| Mobile controls touch screen edges (no padding) | Acceptable per full-bleed search bar aesthetic; documented as a follow-up if needed. The outer wrapper still has `bg-white` so there's no color mismatch with screen edges. |
| `lucide:search` not resolving in SSG build | Already available via installed `@iconify-json/lucide`; validated by running `npm run build` (step 4.3). |
| Snapshot icon markup non-deterministic (SVG path data can vary) | The snapshot will capture whatever Astro SSR renders; if the SVG is stable, the snapshot is stable. If not, exclude the icon SVG from snapshot matching and test icon presence via attribute assertions instead. |

## Migration Plan

1. **Specs first** (this change): Update the canonical spec delta, requirements, and scenarios.
2. **TDD Red**: Update `SearchForm.test.ts` and `search-form.spec.ts` assertions to expect `bg-primary`, `lucide:search` icon, `max-w-[860px]`, and `md:gap-px`. Run tests → confirm RED (new expectations not yet met).
   3. **TDD Green**: Implement all changes in `SearchForm.astro`:
      - Add `import { Icon } from 'astro-icon/components'`
      - Add `<Icon name="lucide:search" class="h-4 w-4" aria-hidden="true" />` before `{config.submitLabel}`
      - Add `flex items-center justify-center gap-2` to button class; change `px-6` → `px-8`
      - Change button classes `bg-accent hover:bg-accent-dark` → `bg-primary hover:bg-primary-dark`
      - Change inner container `container mx-auto py-4` → `max-w-[860px] mx-auto py-4`
      - Change form class `gap-3` → `gap-3 md:gap-px`
   4. **Config change**: Update `SEARCH_FORM_DEFAULTS.inputPlaceholder` in `apps/web/src/lib/config/search-form.ts` from "¿Qué solución está buscando?" to "¿Qué productos estás buscando?"
   5. **Verify Green**: Run unit tests → confirm GREEN. Regenerate snapshot with `vitest -u`.
5. **Build & Smoke**: `npm run typecheck`, `npm run lint`, `npm run build` (verify `lucide:search` resolves in SSR), then e2e smoke tests (button color, icon, max-width, 1px gap, navigation still works).
6. **Rollback**: Revert `SearchForm.astro` + test files to the committed state. No data migration needed (presentational only).

## Open Questions

- **None.** All decisions were confirmed with the user: icon before text, `gap-px` for 1px desktop spacing, `max-w-[860px]` on the inner container without padding. Mobile padding concern is documented as a follow-up, not a blocker.
