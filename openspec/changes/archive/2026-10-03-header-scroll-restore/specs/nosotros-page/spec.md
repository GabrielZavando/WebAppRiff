# nosotros-page Specification

## ADDED Requirements

### Requirement: Page renders with only the shared header and footer chrome
The site SHALL serve a static page at `/nosotros` that renders the site's shared chrome (Header and Footer, per the standard `Layout.astro`) with no intermediate content: no hero shell, no global search form, and an empty `<main>` slot. A GET request to `/nosotros` SHALL respond with HTTP 200. (ADDED in `header-scroll-restore`.)

#### Scenario: SC-108 — /nosotros responds and renders header and footer
- **WHEN** a GET request is made to `/nosotros`
- **THEN** the server responds with HTTP 200
- **AND** the page contains exactly one `<header>` landmark (the site Header)
- **AND** the page contains the site `<footer>`

#### Scenario: SC-109 — No intermediate content on /nosotros
- **WHEN** the `/nosotros` page renders
- **THEN** the main content slot is empty (no hero, no sections)
- **AND** the global search form is not rendered (`showSearch` false)
- **AND** no hero background image renders