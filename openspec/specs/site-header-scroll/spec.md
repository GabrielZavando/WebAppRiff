# site-header-scroll Specification

## Purpose
Comportamiento del header y la agrupación de búsqueda al hacer scroll: sticky, encogido del logo, transición de fondo a secondary, sombra en estado compacto, revert completo al top y animación suave respetando reduced motion.

## Requirements

### Requirement: Header and Search group stick on scroll
The site SHALL keep the Header and SearchForm fixed at the top of the viewport (`position: sticky; top: 0`) when the page is scrolled down (`scrollY > 0`), grouped inside a single sticky wrapper rendered by `Layout.astro`. There is no contact bar above the group anymore.

#### Scenario: Sticky grouping activates on scroll
- **WHEN** the user scrolls the page so that `window.scrollY > 0`
- **THEN** the Header and SearchForm remain visible at the top of the viewport (their wrapper computes `position: sticky` with `top: 0`)
- **AND** no retired top contact bar exists in the document to scroll out of view

#### Scenario: Sticky grouping does not apply at the top
- **WHEN** the page is at `scrollTop === 0`
- **THEN** the Header and SearchForm render in their normal document flow position (no compact/sticky visual offset beyond their natural layout)

### Requirement: Header and Search background transitions to secondary on scroll
The site SHALL render the Header and SearchForm with a solid `--color-secondary` (#1F2D40) background when the compact scroll state is active, replacing their default background (transparent on the home hero, navy gradient on other pages for the Header; white on other pages for the SearchForm).

#### Scenario: Background becomes solid secondary on scroll
- **WHEN** the compact scroll state is active
- **THEN** the Header renders a solid navy (#1F2D40) fill via an opaque navy overlay (`::after`, `opacity: 1`), visually equivalent to `--color-secondary`
- **AND** the SearchForm wrapper (`role="search"`) computes `background-color` equal to `--color-secondary` (#1F2D40 / `rgb(31, 45, 64)`)

#### Scenario: Background reverts at the top
- **WHEN** the page returns to `scrollTop === 0`
- **THEN** the Header and SearchForm revert to their default background (transparent on hero / navy gradient on other pages for the Header; white on other pages for the SearchForm)

### Requirement: Compact scroll state shows a drop shadow
The site SHALL apply a box-shadow to the sticky Header+Search group when the compact scroll state is active (providing elevation and separation from page content), and SHALL remove the box-shadow (`none`) when the page returns to `scrollTop === 0`.

#### Scenario: Drop shadow appears on scroll
- **WHEN** the compact scroll state is active
- **THEN** the sticky wrapper (`.header-scroll-shell`) computes a `box-shadow` value that is not `none`

#### Scenario: No shadow at the top
- **WHEN** the page returns to `scrollTop === 0`
- **THEN** the sticky wrapper computes `box-shadow: none`

### Requirement: Scroll state reverts fully at the top

The site SHALL revert every visual change produced by the compact scroll state when `scrollTop === 0`, returning the Header background and the SearchForm background to their original appearance with the same animation. The logo size does not participate in the compact state because it stays fixed at every scroll position.

#### Scenario: Full revert on return to top

- **WHEN** the user scrolls back to `scrollTop === 0` after the compact state was active
- **THEN** the `data-scrolled` attribute on `document.body` is `"false"` (or absent)
- **AND** the Header background and the SearchForm background return to their original values

### Requirement: Compact scroll state animates smoothly and respects reduced motion

The site SHALL animate the background transitions of the compact scroll state over 300ms with an `ease-in-out` timing function, and SHALL disable these transitions when the user prefers reduced motion (`prefers-reduced-motion: reduce`). The logo SHALL NOT declare scroll-driven size transitions because its size is fixed.

#### Scenario: Smooth transition on activation

- **WHEN** the compact state activates or deactivates
- **THEN** the Header and SearchForm background transitions each run with a duration of 300ms and `ease-in-out` timing

#### Scenario: Reduced motion disables animation

- **WHEN** the active environment reports `prefers-reduced-motion: reduce`
- **THEN** the background changes apply without a transitional animation (transitions set to none)

### Requirement: Scroll state preserves single-header landmark and mobile menu
The site SHALL keep exactly one `<header>` landmark per page and SHALL keep the mobile navigation menu fully functional above the compact header (toggle `z-50`, overlay `z-40`), with no regression to accessibility or the single-landmark rule.

#### Scenario: Single header landmark preserved
- **WHEN** the page renders with the compact scroll behavior active
- **THEN** exactly one `<header>` element exists in the document
- **AND** the scroll state is driven by the `data-scrolled` attribute (no new landmarks, no `aria-*` changes)

#### Scenario: Mobile menu remains above the compact header
- **WHEN** the mobile menu is opened while scrolled
- **THEN** the `#mobile-nav` overlay (and its toggle button) render above the sticky/compact Header wrapper
- **AND** clicking the toggle still toggles `data-menu-open` and the overlay visibility

### Requirement: Compact state re-applies to the current body across client-side navigations

The compact scroll state SHALL apply its `data-scrolled` attribute to the **current** `document.body` on every update (initial load, scroll event, and Astro's `astro:page-load` lifecycle event), resolving the target element lazily at update time instead of capturing it once at init. The header color change (Requirement "Header and Search background transitions to secondary on scroll") and the shell drop-shadow SHALL therefore keep working on `/` and `/servicios` after the `<body>` swap performed by View Transitions. (ADDED in `header-scroll-restore`.)

#### Scenario: Compact state survives client-side navigation

- **WHEN** el usuario navega a `/servicios` mediante View Transitions y luego hace scroll
- **THEN** el `data-scrolled` attribute se aplica al `document.body` vigente
- **AND** el cambio de fondo del Header y del SearchForm sigue funcionando en la página destino

### Requirement: Logo size stays fixed on scroll

The site SHALL NOT change the Header logo's rendered size when the compact scroll state is active. The logo's `max-width` and rendered height SHALL remain equal to their rest values at every scroll position and on every viewport: `max-w-[160px]` below 640px and `sm:max-w-[240px]` from 640px up. The compact state SHALL continue to affect only the Header/SearchForm background and the sticky shell drop-shadow.

#### Scenario: Mobile logo stays fixed on scroll

- **WHEN** el usuario hace scroll hacia abajo en un viewport de 375×667
- **THEN** el logo mantiene su `max-width` de 160px
- **AND** su alto renderizado no cambia respecto del estado en el top

#### Scenario: Desktop logo stays fixed on scroll

- **WHEN** el usuario hace scroll hacia abajo en un viewport de 1280×720
- **THEN** el logo mantiene su `max-width` de 240px
- **AND** su alto renderizado no cambia respecto del estado en el top

#### Scenario: Fixed size also at the top after scrolling back

- **WHEN** el usuario vuelve a `scrollTop === 0` después de hacer scroll
- **THEN** el logo conserva exactamente las mismas dimensiones que tenía antes de scrollear

### Requirement: Sticky group is not broken by horizontal clipping

The document SHALL clip horizontal overflow with `overflow-x: clip` on `<html>` and `<body>` (or an equivalent that does not create a scroll container) and SHALL NOT use `overflow-x: hidden` on those elements. A `hidden` value on a horizontal axis computes `overflow-y` to `auto`, turning the element into a scrolling ancestor; that breaks the `position: sticky` behavior of the Header + SearchForm wrapper in some browsers. The sticky wrapper SHALL remain pinned at the top of the viewport after scrolling on both mobile and desktop.

#### Scenario: No horizontal overflow ancestor traps the sticky wrapper

- **WHEN** the page renders at any viewport
- **THEN** the computed `overflow-x` of `<html>` and `<body>` is `clip`
- **AND** neither element computes `overflow-x: hidden`
- **AND** the sticky wrapper (`header-scroll-shell`) keeps `position: sticky` with `top: 0`

#### Scenario: Sticky group stays pinned after scroll

- **WHEN** the user scrolls down on a viewport of 375×667 or 1280×720
- **THEN** the top edge of the `header-scroll-shell` remains at `0` relative to the viewport (tolerance 2px)
- **AND** the Header and SearchForm stay fully visible while scrolling
