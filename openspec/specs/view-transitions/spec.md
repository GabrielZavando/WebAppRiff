# view-transitions Specification

## Purpose
TBD - created by archiving change web-home-contact-tweaks. Update Purpose after archive.
## Requirements
### Requirement: Client-side routing with View Transitions is enabled globally
The `Layout.astro` SHALL import and render Astro's `<ClientRouter />` component (from `astro:transitions`) in the document `<head>`, enabling View Transitions (client-side routing with animated view transitions) for every page of the site. (ADDED in `web-home-contact-tweaks`.)

#### Scenario: ClientRouter rendered in the head
- **WHEN** any page renders through `Layout.astro`
- **THEN** the document `<head>` contains the `<ClientRouter />` component markup

#### Scenario: Existing pages still render
- **WHEN** a visitor loads `/`, `/servicios`, `/productos` or `/contacto`
- **THEN** the page renders normally (no layout regression from the added router)

### Requirement: Header scroll state survives client-side navigations
The header scroll-state initialization (`initHeaderScrollState`) SHALL re-initialize on Astro's `astro:page-load` lifecycle event (in addition to the initial page load) so the compact scroll state (`data-scrolled` on `<body>`) keeps working after client-side navigations triggered by View Transitions. (ADDED in `web-home-contact-tweaks`.)

#### Scenario: Scroll state works after client-side navigation
- **GIVEN** a client-side navigation has occurred (e.g. home → /servicios via View Transitions)
- **WHEN** the user scrolls the page
- **THEN** the `data-scrolled` attribute on `document.body` toggles correctly (the compact header state is not broken by the client-side navigation)

### Requirement: Hash navigation scrolls smoothly to the anchor target with graceful degradation
Navigation to `/servicios#{slug}` SHALL land with the target card visible below the sticky header (the anchor targets carry `scroll-margin-top`). Where the browser supports it, the scroll to the hash target SHALL be smooth; with `prefers-reduced-motion: reduce` the scroll SHALL be instant (no smooth animation). Browsers without View Transitions support SHALL fall back to normal MPA navigation with native hash scrolling. (ADDED in `web-home-contact-tweaks`.)

#### Scenario: Smooth scroll to anchor
- **GIVEN** the user is on the home page
- **WHEN** they click a service "Ver detalles" CTA (navigating to `/servicios#{slug}`)
- **THEN** the navigation lands on /servicios with the target card visible below the sticky header (scroll-margin-top applied)

#### Scenario: Reduced motion degrades to instant jump
- **GIVEN** the user has `prefers-reduced-motion: reduce`
- **WHEN** they navigate to `/servicios#{slug}`
- **THEN** no smooth scroll animation runs (instant jump to the anchor target)

#### Scenario: Browsers without View Transitions fall back to MPA
- **GIVEN** a browser without View Transitions support
- **WHEN** the user clicks a service "Ver detalles" CTA
- **THEN** navigation is a normal MPA request (Astro fallback)
- **AND** the browser scrolls natively to the `#slug` anchor

