## MODIFIED Requirements

### Requirement: DestacadosSection renders as a flat dark teal section with vertical padding
The `destacados-section` SHALL render a `<section>` as its outermost element carrying vertical padding utilities (`py-16 md:py-24`) and the dark navy background token `bg-secondary-dark` (`--color-secondary-dark: #16202E`). The section SHALL NOT apply negative margin / overlap — it is a flat block with a hard color transition from the deep teal `bg-primary-deep` of `ServicesSection` above (the transition is now teal → navy, both dark, instead of teal → teal as in the archived state). The section SHALL contain a single inner container using the canonical container utilities (`mx-auto px-4 sm:px-6 lg:px-8` and the `max-w-7xl` constraint expressed by the `container` utility). (MODIFIED in `site-favicon-and-bg-swap`: the section background token changes from `bg-primary-deep` (deep teal) to `bg-secondary-dark` (navy) — the token was originally navy for the `services-section` and was swapped as part of the home-page color hierarchy rework; see also the mirrored change in the `services-section` spec. This supersedes the POST-APPLY UPDATE of the original `destacados-section` archive that established `bg-primary-deep` as the section background.)

#### Scenario: Section is the outermost element
- **WHEN** the DestacadosSection renders
- **THEN** the outermost element of the rendered HTML is a `<section>`
- **AND** the `<section>` is NOT nested inside another `<section>` produced by the component itself

#### Scenario: Section carries vertical padding utilities
- **WHEN** the DestacadosSection renders
- **THEN** the `<section>` opening tag carries a class expressing mobile vertical padding (e.g. `py-16`)
- **AND** the `<section>` opening tag carries a class expressing a larger vertical padding at the `md` breakpoint (e.g. `md:py-24`)

#### Scenario: Section uses the dark navy background token
- **WHEN** the DestacadosSection renders
- **THEN** the `<section>` opening tag carries a class expressing the dark navy background token (e.g. `bg-secondary-dark`)
- **AND** the rendered HTML does NOT contain the lighter `bg-bg` utility on the section's outermost element
- **AND** the rendered HTML does NOT contain the `bg-primary-deep` utility on the section's outermost element (the navy is the new background; the deep teal belongs to `ServicesSection` after the swap)

#### Scenario: Section uses the canonical container for inner width
- **WHEN** the DestacadosSection renders
- **THEN** the section contains an inner `<div>` carrying the `container` class (or the equivalent `mx-auto px-4 sm:px-6 lg:px-8` plus `max-w-7xl` constraint)
