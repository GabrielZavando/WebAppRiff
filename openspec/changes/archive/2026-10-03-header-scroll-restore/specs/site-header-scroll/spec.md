# site-header-scroll Specification

## ADDED Requirements

### Requirement: Compact state re-applies to the current body across client-side navigations
The compact scroll state SHALL apply its `data-scrolled` attribute to the **current** `document.body` on every update (initial load, scroll event, and Astro's `astro:page-load` lifecycle event), resolving the target element lazily at update time instead of capturing it once at init. The header color change (Requirement "Header and Search background transitions to secondary on scroll"), the logo shrink/grow (Requirement "Logo shrinks on scroll") and the shell drop-shadow SHALL therefore keep working on `/` and `/servicios` after the `<body>` swap performed by View Transitions. (ADDED in `header-scroll-restore`.)

#### Scenario: SC-101 — Header color change survives client-side navigation
- **GIVEN** the user is on `/` or `/servicios` after a client-side navigation (the `<body>` element was swapped)
- **WHEN** the user scrolls past the compact threshold (`scrollY > 0`)
- **THEN** `data-scrolled="true"` is set on the current `document.body` (not a stale pre-navigation reference)
- **AND** the `.site-header` overlay renders solid secondary (`--color-secondary`)

#### Scenario: SC-102 — Logo shrink and smooth grow survive client-side navigation
- **GIVEN** the user is on `/` or `/servicios` after a client-side navigation (the `<body>` element was swapped)
- **WHEN** the user scrolls down and then returns to `scrollY === 0`
- **THEN** the logo shrinks while scrolled (150px width mobile / 100px height desktop)
- **AND** the logo grows back to its original size with the 300ms ease-in-out transition at the top