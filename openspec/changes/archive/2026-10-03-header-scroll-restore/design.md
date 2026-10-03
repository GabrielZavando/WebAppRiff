# Design — Restore header scroll behavior and add /nosotros page

## Context

The public site (`apps/web`, Astro SSG) renders a sticky header group through `Layout.astro`: `<div class="sticky top-0 z-30 header-scroll-shell">` wrapping `Header.astro` + `SearchForm.astro`. The compact scroll state is driven by `lib/scroll/createHeaderScrollState.ts`, which toggles `data-scrolled` on `document.body`; `styles/header-scroll.css` reacts with `body[data-scrolled='true']` to (a) crossfade the header to solid navy via `.site-header::after`, (b) shrink the logo (150px mobile / 100px-tall desktop), and (c) add the shell drop-shadow.

Since change `web-home-contact-tweaks`, `Layout.astro` renders `<ClientRouter />` from `astro:transitions` in the `<head>`. Astro's View Transitions swap the `<body>` element on every client-side navigation. Two regressions follow:

1. **Stale body reference.** `initHeaderScrollState` resolves `target = document.body` **once** at init. After a body swap, every `update()` (scroll event or `astro:page-load`) writes `data-scrolled` to the **detached** old body. The new body never receives the attribute, so the header color change, logo shrink and shell shadow stop working on the destination page until a full reload. This is the root cause of the ticket's requirements 1 and 2.
2. **Inline scroll-top binding.** `Footer.astro` ships an inline `<script is:inline>` that binds `[data-scroll-top]` clicks. Inline scripts in swapped content do not reliably re-bind after a View Transition, so the button loses its click handler (requirement 3, "funcionalidad").

Additionally the header box does not contain the full logo height (requirement 4): the logo renders at 2× (`330×134`, capped at `max-w-[300px]` → ~122px tall on desktop) inside an `h-20 lg:h-24` wrapper with `overflow-visible`, so it visually overflows the header box. And the `/nosotros` route does not exist (requirement 5).

## Goals / Non-Goals

**Goals:**
- Compact scroll state (header color, logo shrink, shell shadow) keeps working on `/` and `/servicios` across client-side navigations.
- The "Volver arriba" button is visible (footer bottom bar) and functional after client-side navigations.
- `.site-header` contains the full rendered logo height via responsive `padding-bottom`.
- `/nosotros` renders with only the shared header/footer chrome.

**Non-Goals:**
- No new floating/overlay scroll-top button; the button stays in the footer bottom bar (existing design, `site-footer` spec).
- No changes to the logo shrink values (150px mobile / 100px desktop) or the 300ms ease-in-out timing defined in `site-header-scroll`.
- No addition of `/nosotros` to `NAVIGATION_ITEMS` (ticket scopes to the page only).
- No changes to the `data-scrolled` threshold (still compact when `scrollY > 0`).
- No backend/API/data-model involvement (frontend-only change).

## Decisions

### D1 — Resolve the `data-scrolled` target lazily (current body) in `initHeaderScrollState`

`update()` SHALL resolve the target element at call time: when an explicit `target` seam is injected (tests) use it; otherwise read `document.body` at the moment of each update. The init-time `const target = document.body` capture is removed. The `astro:page-load` re-apply (already implemented) then writes to the **current** post-swap body, and the scroll listener (attached to `window`, which persists across swaps) keeps working.

- **Rationale**: minimal, surgical fix; keeps the existing pure/seam-based test contract (`host`/`target`/`events` fakes, no jsdom) intact.
- **Alternatives considered**:
  - Re-run `initHeaderScrollState()` on `astro:page-load` → risks duplicate listeners/cleanup leaks and depends on lifecycle timing.
  - MutationObserver on `document.body` → overkill, harder to test, and races with the swap.
- **Testability**: a new unit test simulates a "body swap" (init with `targetA`, then switch to `targetB` and dispatch scroll/page-load) and asserts the attribute lands on `targetB`.

### D2 — Scroll-top button via document-level event delegation

New pure module `apps/web/src/lib/scroll/createScrollTopButton.ts` (same seam style as `createHeaderScrollState.ts`) that attaches **one** click listener on `document` (which persists across body swaps) and delegates: `(event.target as Element).closest('[data-scroll-top]')` → `window.scrollTo({ top: 0, behavior: 'smooth' })`. Initialized from `Layout.astro`'s existing `<script>` (next to `initHeaderScrollState`). The footer's inline `<script is:inline>` binding is removed (replaced by the delegation).

- **Rationale**: `document` is never swapped by View Transitions, so the listener survives every navigation with zero re-binding logic and no double-bind risk. Matches the codebase's "pure lib + Layout script" pattern (frontend-standards: side effects in services/modules, not components).
- **Alternatives considered**:
  - Re-bind the inline footer script on `astro:page-load` → relies on the swap-timing/lifecycle ordering that the ticket reports as broken; risks double listeners.
  - Keep only the inline script (status quo) → does not fix the regression.
- **Testability**: unit tests with fake `document`/`window`/event seams assert that a click on a `[data-scroll-top]` element (and on a descendant of it) triggers `scrollTo({ top: 0, behavior: 'smooth' })`, and that clicks outside do not; a second test re-creates the button inside a "swapped" document and asserts the handler still fires (delegation is idempotent).

### D3 — `.site-header` gains responsive `padding-bottom` to contain the logo

Add `padding-bottom` to the `.site-header` element so its box height contains the full rendered logo:
- mobile: `padding-bottom: 2.5rem` (40px) → 80px (h-20) + 40px = 120px ≥ ~81px logo at 200px cap;
- desktop (`lg:` / ≥1024px): `padding-bottom: 3rem` (48px) → 96px (lg:h-24) + 48px = 144px ≥ ~122px logo at 300px cap.

Applied via Tailwind utilities on the `<header>` (`pb-10 lg:pb-12`) or an equivalent rule in `styles/header-scroll.css`. The logo wrapper keeps `overflow-visible` (the logo may still exceed the *wrapper* but now fits inside the *header box*).

- **Rationale**: smallest change honoring the ticket ("aumentar el padding-bottom del contenedor site-header"); keeps the sticky shell as the single containing block.
- **Alternatives considered**: growing `h-20 lg:h-24` → changes the whole header proportion and the compact-state math; removing `overflow-visible` → would clip the 2× logo pattern documented in `site-header`.
- **Note**: exact values are a starting point; the acceptance criterion is "the header box contains the full logo height". If the visual check shows residual overflow, adjust the values in the same change (design is not frozen on the numbers, only on the mechanism).
- **Testability**: component tests assert the `pb-10 lg:pb-12` (or equivalent) classes on the `<header>` element; `Header.test.ts` logo-class assertions are updated accordingly.

### D4 — `/nosotros` is a chrome-only static page

`apps/web/src/pages/nosotros.astro` uses the standard `Layout` with `hero={false}` (no hero shell/overlay), `showSearch={false}` (matches the ticket's "únicamente el Header y el Footer"; precedent: `/contacto` opts out of the global search) and an empty `<main>` slot (no intermediate content). Title: "Nosotros — Riff". TopHeader and SiteCredits remain as shared Layout chrome (not part of the ticket scope).

- **Rationale**: reuses the single shared chrome without inventing a new layout; "empty page" = empty slot.
- **Alternatives considered**: a dedicated minimal layout → duplicates chrome and contradicts the Layout-first pattern; keeping `showSearch` default → contradicts "únicamente el Header y el Footer".
- **Testability**: AstroContainer test (pattern of `pages/__tests__/servicios.test.ts`) asserts the header landmark, footer, an empty main, and absence of hero image / search form / intermediate content.

## Risks / Trade-offs

- [Changing the header box height (D3) alters the sticky shell footprint] → Mitigation: the shell already sits at `top-0`; the extra padding only affects the space behind the header; component tests + a manual visual check on `/` and `/servicios` verify no content overlap or hero clipping.
- [Removing the footer inline script (D2) changes `Footer.test.ts` behavior assertions] → Mitigation: update the footer tests/helpers/snapshot in the same change (task 2.4) so the suite stays green.
- [Lazy target resolution (D1) must not break the injected-seam tests] → Mitigation: keep the `target` option; only the default (`document.body`) becomes lazy; existing tests inject the seam and remain green.
- [Exact padding values (D3) may need tuning] → Mitigation: acceptance is "box contains logo"; values are adjustable within the change before archive.
- [Playwright/E2E not run in this change] → Mitigation: unit/component tests cover the contract; the existing `web-e2e-critical-flows` suite is untouched.

## Migration Plan

No data migration. SSG rebuild redeploys the static site (existing Coolify flow). Rollback: revert the branch — the change touches only `apps/web` sources and specs; no env/config changes.

## Open Questions

None blocking. Minor: the exact `padding-bottom` values (D3) are confirmed visually during implementation; the mechanism is fixed by the spec.