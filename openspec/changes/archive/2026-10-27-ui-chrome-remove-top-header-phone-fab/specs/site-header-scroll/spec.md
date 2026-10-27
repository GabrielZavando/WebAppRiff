# site-header-scroll Specification

## MODIFIED Requirements

### Requirement: Header and Search group stick on scroll
The site SHALL keep the Header and SearchForm fixed at the top of the viewport (`position: sticky; top: 0`) when the page is scrolled down (`scrollY > 0`), grouped inside a single sticky wrapper rendered by `Layout.astro`. There is no contact bar above the group anymore.

#### Scenario: Sticky grouping activates on scroll
- **WHEN** the user scrolls the page so that `window.scrollY > 0`
- **THEN** the Header and SearchForm remain visible at the top of the viewport (their wrapper computes `position: sticky` with `top: 0`)
- **AND** no retired top contact bar exists in the document to scroll out of view

#### Scenario: Sticky grouping does not apply at the top
- **WHEN** the page is at `scrollTop === 0`
- **THEN** the Header and SearchForm render in their normal document flow position (no compact/sticky visual offset beyond their natural layout)

### Requirement: Logo shrinks on scroll
The site SHALL reduce the Header logo when the compact scroll state is active, from its rest maximum width (240px at ≥640px, 160px below 640px), acotado en desktop (≥640px) a un alto renderizado mínimo de 100px con ancho automático que preserve el aspect ratio del asset PNG (1080×542, ratio ≈1.99:1), y a 150px de ancho en mobile (<640px).

#### Scenario: Logo shrinks on desktop with a 100px minimum height
- **WHEN** the compact scroll state is active and the viewport is at least 640px wide
- **THEN** the logo image renders with a computed height of at least 100px
- **AND** its width adapts automatically preserving the ≈1.99:1 aspect ratio of `logo-web.png` (≈199px wide at 100px tall)

#### Scenario: Logo shrinks on mobile (unchanged)
- **WHEN** the compact scroll state is active and the viewport is narrower than 640px
- **THEN** the logo image computes a `max-width` of 150px

#### Scenario: Logo restored at the top
- **WHEN** the page returns to `scrollTop === 0`
- **THEN** the logo image computes its original `max-width` (160px below 640px, 240px at 640px and above)
