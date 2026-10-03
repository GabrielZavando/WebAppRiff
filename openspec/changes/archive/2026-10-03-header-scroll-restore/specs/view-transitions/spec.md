# view-transitions Specification

## MODIFIED Requirements

### Requirement: Header scroll state survives client-side navigations
The header scroll-state initialization (`initHeaderScrollState`) SHALL re-initialize on Astro's `astro:page-load` lifecycle event (in addition to the initial page load) AND SHALL resolve its `data-scrolled` target element lazily — reading the **current** `document.body` at the moment of each update rather than capturing it once at init — so the compact scroll state (`data-scrolled` on `<body>`) keeps working after client-side navigations triggered by View Transitions, whose body swap invalidates any captured element reference. (ADDED in `web-home-contact-tweaks`; MODIFIED in `header-scroll-restore`.)

#### Scenario: SC-103 — Scroll state works after client-side navigation
- **GIVEN** a client-side navigation has occurred (e.g. home → /servicios via View Transitions, which replaces the `<body>` element)
- **WHEN** the user scrolls the page
- **THEN** the `data-scrolled` attribute toggles on the current `document.body`
- **AND** the compact header state (color change, logo size, shell shadow) is not broken by the client-side navigation

## ADDED Requirements

### Requirement: Scroll-top button stays functional after client-side navigations
The scroll-to-top click binding SHALL be attached to `document` via event delegation (a listener that persists across View Transitions body swaps), so clicking any element with the `data-scroll-top` attribute scrolls the window to the top with `behavior: 'smooth'` even after a client-side navigation. (ADDED in `header-scroll-restore`.)

#### Scenario: SC-104 — Scroll-top button works after client-side navigation
- **GIVEN** a client-side navigation has occurred (the `<body>` element was swapped)
- **WHEN** the user clicks the `[data-scroll-top]` button
- **THEN** the window scrolls to `top: 0` with `behavior: 'smooth'`