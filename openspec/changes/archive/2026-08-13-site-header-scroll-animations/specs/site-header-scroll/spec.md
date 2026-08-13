## ADDED Requirements

### Requirement: Header and Search group stick on scroll
The site SHALL keep the Header and SearchForm fixed at the top of the viewport (`position: sticky; top: 0`) when the page is scrolled down (`scrollY > 0`), grouped inside a single sticky wrapper rendered by `Layout.astro`.

#### Scenario: Sticky grouping activates on scroll
- **WHEN** the user scrolls the page so that `window.scrollY > 0`
- **THEN** the Header and SearchForm remain visible at the top of the viewport (their wrapper computes `position: sticky` with `top: 0`)
- **AND** the TopHeader contact bar is not part of the sticky wrapper and scrolls out of view normally

#### Scenario: Sticky grouping does not apply at the top
- **WHEN** the page is at `scrollTop === 0`
- **THEN** the Header and SearchForm render in their normal document flow position (no compact/sticky visual offset beyond their natural layout)

### Requirement: Logo shrinks on scroll
The site SHALL reduce the Header logo when the compact scroll state is active, from its current maximum width (300px at ≥640px, 200px below 640px) to 200px at ≥640px and 150px below 640px, preserving its aspect ratio (330×134).

#### Scenario: Logo shrinks on desktop
- **WHEN** the compact scroll state is active and the viewport is at least 640px wide
- **THEN** the logo image computes a `max-width` of 200px

#### Scenario: Logo shrinks on mobile
- **WHEN** the compact scroll state is active and the viewport is narrower than 640px
- **THEN** the logo image computes a `max-width` of 150px

#### Scenario: Logo restored at the top
- **WHEN** the page returns to `scrollTop === 0`
- **THEN** the logo image computes its original `max-width` (200px below 640px, 300px at 640px and above)

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
The site SHALL revert every visual change produced by the compact scroll state when `scrollTop === 0`, returning Header, SearchForm and logo to their original appearance with the same animation.

#### Scenario: Full revert on return to top
- **WHEN** the user scrolls back to `scrollTop === 0` after the compact state was active
- **THEN** the `data-scrolled` attribute on `document.body` is `"false"` (or absent)
- **AND** the logo size, the Header background and the SearchForm background all return to their original values

### Requirement: Compact scroll state animates smoothly and respects reduced motion
The site SHALL animate the background and logo-size transitions of the compact scroll state over 300ms with an `ease-in-out` timing function, and SHALL disable these transitions when the user prefers reduced motion (`prefers-reduced-motion: reduce`).

#### Scenario: Smooth transition on activation
- **WHEN** the compact state activates or deactivates
- **THEN** the background-color and logo max-width transitions each run with a duration of 300ms and `ease-in-out` timing

#### Scenario: Reduced motion disables animation
- **WHEN** the active environment reports `prefers-reduced-motion: reduce`
- **THEN** the background and logo-size changes apply without a transitional animation (transitions set to none)

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
