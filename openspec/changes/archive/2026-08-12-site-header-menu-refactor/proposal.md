## Why

The client requested a redesign of the site header to improve mobile UX and align
the navigation with the revised site structure. The current header places the CTA
outside the nav, uses a collapsible panel below the header on mobile, and renders
a small logo. The client wants the CTA integrated into the menu, a fullscreen
mobile overlay with smooth slide animation, updated nav items (Productos, Marcas),
a 3px active underline, and a 2× larger logo that overflows without resizing the
header container.

## What Changes

- **Navigation items**: Inicio, Nosotros, Servicios, Representaciones, Contacto →
  Inicio, Productos, Servicios, Marcas, Contacto (hrefs: `/`, `/productos`,
  `/servicios`, `/marcas`, `/contacto`)
- **CTA belongs to the menu**: the "SOLICITAR COTIZACIÓN" link moves inside the
  `<nav>` element as the last item, on both desktop and mobile. Its `bg-accent`
  styling is preserved; only the visibility utility (`hidden sm:inline-flex`) is
  removed since it is now rendered via the nav's own responsive classes.
- **Menu right-aligned** on desktop (`ml-auto` on the `<nav>`)
- **Active underline**: 2px (`after:h-0.5`) → 3px (`after:h-[3px]`), color
  unchanged (`#41B3C4` / `after:bg-primary`)
- **Mobile menu**: collapses into a fullscreen overlay (100vw × 100vh, `bg-white`),
  sliding in from right-to-left with a 300ms `ease-in-out` transform animation.
  The hamburger/X toggle button is `fixed` with a higher z-index so it is always
  visible above the overlay; its icon color transitions from white (navy header)
  to secondary (white overlay) via CSS driven by a `data-menu-open` attribute on
  the `<header>`.
- **Logo**: rendered at 2× current width (330px from 165px) with
  `overflow-visible` on the `<a>` wrapper and `h-24` constraint so the header height
  is preserved — the logo may visually overflow the container height.
- **Body scroll lock**: `overflow-hidden` on `<body>` while the mobile overlay is open.

## Capabilities

### Modified Capabilities

- **`site-header`**: The existing site-header capability is modified to integrate
  the CTA into the nav, change menu items, right-align the menu, increase the
  active underline to 3px, and replace the collapsible mobile panel with a
  fullscreen slide-in overlay. The logo rendering size doubles with an overflow
  constraint on its container. All other existing requirements (transparent mode,
  Lucide icon set, single `<header>` landmark, accessibility, hardcoded config,
  CTA destination page) remain unchanged unless noted above.

## Impact

- `apps/web/src/lib/config/navigation.ts` — `NAVIGATION_ITEMS` updated to
  [Inicio, Productos, Servicios, Marcas, Contacto]
- `apps/web/src/components/Header.astro` — restructured: CTA inside `<nav>`,
  right-aligned desktop nav, 3px active underline, fullscreen mobile overlay with
  slide animation and always-visible toggle button, 2× logo with overflow,
  `data-menu-open` state management, body scroll lock
- `apps/web/src/components/__tests__/Header.test.ts` — updated scenarios for new
  nav items, CTA inside nav, 3px underline, fullscreen overlay, logo dimensions
- `apps/web/src/components/__tests__/__snapshots__/Header.test.ts.snap` — snapshot
  regenerated
- `apps/web/src/lib/config/__tests__/navigation.test.ts` — updated expected items
- `apps/web/e2e/site-header.spec.ts` — updated nav items, desktop CTA-in-nav,
  fullscreen mobile overlay
- `openspec/specs/site-header/spec.md` — updated post-archive to reflect new
  requirements
