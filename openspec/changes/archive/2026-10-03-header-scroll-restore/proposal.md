# Restore header scroll behavior and add /nosotros page

**Ticket**: fix/header-scroll-regressions-and-about-page
**Tag**: [frontend] (inferred — the ticket's `[fix]` is not a layer tag; all work is in `apps/web`)
**Branch**: feature/fix-header-scroll-and-about-page

## Why

The global `<ClientRouter />` (View Transitions, change `web-home-contact-tweaks`) swaps the `<body>` element on every client-side navigation. `initHeaderScrollState` captures `document.body` once at init, so after the first navigation `data-scrolled` is written to a detached node: the header color change, logo shrink and scroll-shell shadow stop working on `/` and `/servicios`. The footer's inline scroll-top binding also stops being reliable after swaps. The header box additionally no longer contains the full logo height, and the `/nosotros` route does not exist.

## What Changes

- Fix `initHeaderScrollState` so the `data-scrolled` target is resolved lazily (the **current** `<body>`) on every update, making the compact header state (color change, logo shrink, shell shadow) survive client-side navigations on `/` and `/servicios`.
- Make the "Volver arriba" button functional after client-side navigations via document-level event delegation in a new `lib/scroll/createScrollTopButton.ts`, replacing the footer's inline binding.
- Add responsive `padding-bottom` to the `.site-header` container so it contains the full rendered logo height.
- Create the static `/nosotros` page (shared Header + Footer chrome only, no intermediate content).

## Capabilities

### New Capabilities
- `nosotros-page`: empty static page at `/nosotros` composed solely of the shared header and footer chrome.

### Modified Capabilities
- `view-transitions`: requirement "Header scroll state survives client-side navigations" is strengthened (state must apply to the current, post-swap body); new requirement "Scroll-top button stays functional after client-side navigations".
- `site-header-scroll`: new requirement that the compact state is re-applied to the current body element across client-side navigations.
- `site-footer`: requirement "Scroll-to-top script navigates smoothly to the top" is modified to a persistent document-level delegation.
- `site-header`: new requirement that the header box contains the full logo height via responsive `padding-bottom`.

## Impact

- `apps/web/src/lib/scroll/createHeaderScrollState.ts` (+ tests)
- `apps/web/src/lib/scroll/createScrollTopButton.ts` (new) (+ tests)
- `apps/web/src/components/Header.astro`, `apps/web/src/components/Footer.astro`
- `apps/web/src/styles/header-scroll.css`
- `apps/web/src/layouts/Layout.astro`
- `apps/web/src/pages/nosotros.astro` (new) (+ `pages/__tests__/nosotros.test.ts`)
- Tests updated: `createHeaderScrollState.test.ts`, `Header.test.ts`, `Footer.test.ts` (+ helpers/snapshot)