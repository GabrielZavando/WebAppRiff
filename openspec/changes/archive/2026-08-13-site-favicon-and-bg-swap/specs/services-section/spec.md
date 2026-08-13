## MODIFIED Requirements

### Requirement: ServicesSection renders as a flat dark section with vertical padding
The `services-section` SHALL render a `<section>` as its outermost element carrying vertical padding utilities (`py-16 md:py-24`) and the deep teal background token `bg-primary-deep` (`--color-primary-deep: #006874`). The section SHALL NOT apply negative margin / overlap (unlike `PanelHome`) — it is a flat block with a hard color transition from the light `bg-bg` of `SolutionSection` above. The section SHALL contain a single inner container using the canonical container utilities (`mx-auto px-4 sm:px-6 lg:px-8` and the `max-w-7xl` constraint expressed by the `container` utility). (MODIFIED in `site-favicon-and-bg-swap`: the section background token changes from `bg-secondary-dark` (navy) to `bg-primary-deep` (deep teal) so the services block reads as a more prominent teal band and the subsequent `DestacadosSection` becomes the navy anchor of the home — see also the mirrored change in the `destacados-section` spec.)

#### Scenario: Section is the outermost element
- **WHEN** the ServicesSection renders
- **THEN** the outermost element of the rendered HTML is a `<section>`
- **AND** the `<section>` is NOT nested inside another `<section>` produced by the component itself

#### Scenario: Section carries vertical padding utilities
- **WHEN** the ServicesSection renders
- **THEN** the `<section>` opening tag carries a class expressing mobile vertical padding (e.g. `py-16`)
- **AND** the `<section>` opening tag carries a class expressing a larger vertical padding at the `md` breakpoint (e.g. `md:py-24`)

#### Scenario: Section uses the deep teal background token
- **WHEN** the ServicesSection renders
- **THEN** the `<section>` opening tag carries a class expressing the deep teal background token (e.g. `bg-primary-deep`)
- **AND** the rendered HTML does NOT contain the lighter `bg-bg` utility on the section's outermost element
- **AND** the rendered HTML does NOT contain the `bg-secondary-dark` utility on the section's outermost element (the deep teal is the new background; the navy token belongs to `DestacadosSection` after the swap)

#### Scenario: Section uses the canonical container for inner width
- **WHEN** the ServicesSection renders
- **THEN** the section contains an inner `<div>` carrying the `container` class (or the equivalent `mx-auto px-4 sm:px-6 lg:px-8` plus `max-w-7xl` constraint)
