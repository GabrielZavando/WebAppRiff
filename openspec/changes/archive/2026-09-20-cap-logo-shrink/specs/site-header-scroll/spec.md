# site-header-scroll — cap-logo-shrink delta

## MODIFIED Requirements

### Requirement: Logo shrinks on scroll
The site SHALL reduce the Header logo when the compact scroll state is active, from its current maximum width (300px at ≥640px, 200px below 640px), acotado en desktop (≥640px) a un alto renderizado mínimo de 100px con ancho automático que preserve el aspect ratio del asset (330×134), y a 150px de ancho en mobile (<640px), sin cambios respecto al comportamiento previo.

#### Scenario: Logo shrinks on desktop with a 100px minimum height
- **WHEN** the compact scroll state is active and the viewport is at least 640px wide
- **THEN** the logo image renders with a computed height of at least 100px
- **AND** its width adapts automatically preserving the aspect ratio of the asset (330×134)

#### Scenario: Logo shrinks on mobile (unchanged)
- **WHEN** the compact scroll state is active and the viewport is narrower than 640px
- **THEN** the logo image computes a `max-width` of 150px

#### Scenario: Logo restored at the top
- **WHEN** the page returns to `scrollTop === 0`
- **THEN** the logo image computes its original `max-width` (200px below 640px, 300px at 640px and above)
