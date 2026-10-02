## ADDED Requirements

### Requirement: ServiceCard carries a stable anchor id with scroll-margin
The service-card SHALL render its root `<article>` element with an `id` attribute equal to the service's `slug` prop (kebab-case, 1:1 with the home `SERVICES_DATA` slugs: `medicion-en-edificios`, `medicion-industrial`, `obras-y-proyectos`, `tratamiento-de-agua`), so the home "Ver detalles" CTAs can deep-link to `/servicios#{slug}` and the page can smooth-scroll to the corresponding card. The `ServicePageService` contract SHALL expose the `slug` field. The anchor target SHALL carry a `scroll-margin-top` utility accounting for the sticky header group (site header + optional search bar) so the card lands visible below the header. (ADDED in `web-home-contact-tweaks`.)

#### Scenario: Card root renders the anchor id from the slug prop
- **WHEN** the ServiceCard renders with `slug="medicion-industrial"`
- **THEN** the card root `<article>` element carries `id="medicion-industrial"`
- **AND** the root element carries a scroll-margin utility (e.g. `scroll-mt-*`) compensating the sticky header

#### Scenario: Anchor ids map 1:1 with the home services slugs
- **WHEN** the four ServiceCards render on the /servicios page
- **THEN** the set of card anchor `id` values equals the set of `SERVICES_DATA` slugs from the home config (`medicion-en-edificios`, `medicion-industrial`, `obras-y-proyectos`, `tratamiento-de-agua`)