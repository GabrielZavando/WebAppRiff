## ADDED Requirements

### Requirement: Hero Banner subtitle reduced font size on mobile
The Hero Banner subtitle SHALL use reduced font size (text-base in the base breakpoint, scaling up through md and lg) on all breakpoints.

#### Scenario: Subtitle renders with smaller font on mobile
- **WHEN** the viewport is less than 640px
- **THEN** the subtitle "Experiencia, tecnología y control en medición de fluidos y tratamientos de agua." renders with text-base

#### Scenario: Subtitle scales up on larger breakpoints
- **WHEN** the viewport is 768px or greater
- **THEN** the subtitle renders with text-lg or larger

### Requirement: Hero Banner headline reduced font size
The Hero Banner headline SHALL use a reduced font size on all breakpoints, scaling from text-3xl in the base breakpoint to larger sizes at md and above.

#### Scenario: Headline renders smaller on mobile
- **WHEN** the viewport is less than 640px
- **THEN** the headline "Innovación que Fluye" renders with text-3xl

#### Scenario: Headline scales up on larger breakpoints
- **WHEN** the viewport is 640px or greater
- **THEN** the headline renders with text-4xl or larger

### Requirement: Hero Banner description paragraph hidden on mobile
The Hero Banner description paragraph SHALL be hidden in the base breakpoint (< 640px) and visible from sm (>= 640px).

#### Scenario: Description paragraph hidden on mobile
- **WHEN** the viewport is less than 640px
- **THEN** the paragraph "Desarrollamos soluciones para la medición, control y tratamiento de agua, integrando equipos, soporte técnico y ejecución en terreno." is not present in the DOM or has hidden class

#### Scenario: Description paragraph visible on sm and up
- **WHEN** the viewport is 640px or greater
- **THEN** the description paragraph is visible (sm:block or equivalent)

### Requirement: ServicesSection card images use 5:4 aspect ratio
Card images in the "Servicios especializados" section SHALL have a 5:4 aspect ratio in all breakpoints.

#### Scenario: Card images maintain 5:4 aspect ratio
- **WHEN** the ServicesSection renders
- **THEN** each card image has aspect-[5/4] applied

### Requirement: DestacadosSection card images use 5:4 aspect ratio
Card images in the "Soluciones destacadas" section SHALL have a 5:4 aspect ratio in all breakpoints.

#### Scenario: Card images maintain 5:4 aspect ratio
- **WHEN** the DestacadosSection renders
- **THEN** each card image has aspect-[5/4] applied

### Requirement: NosotrosTeamSection cards show only Name and Role
Team cards in NosotrosTeamSection SHALL render only Name and Role in the card overlay at every breakpoint; the long description SHALL NOT be rendered in the overlay.

#### Scenario: Team cards show only name and role
- **WHEN** the NosotrosTeamSection renders at any viewport width
- **THEN** each card shows only Name and Role, and no description paragraph is present in the overlay

#### Scenario: Description remains available on the Nosotros page
- **WHEN** the team roster is rendered by NosotrosTeamGrid on the Nosotros page
- **THEN** each member description is still rendered there