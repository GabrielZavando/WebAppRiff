# panel-home Specification

## REMOVED Requirements

### Requirement: PanelHome sits 8px below the HeroBanner on desktop (no overlap) via positive margin-top
**Reason**: the client requested the elevated card at least 16px closer to the top on desktop (change `ui-chrome-polish`); the desktop offset moves from +8px (below, no overlap) to −8px (8px overlap). Replaced by the uniform negative margin-top requirement below.

## ADDED Requirements

### Requirement: PanelHome elevates 8px above the HeroBanner via uniform negative margin-top
The PanelHome `<section>` SHALL carry a uniform `-mt-2` (−8px at every breakpoint) so the elevated card (`.panel-home-elevated`) overlaps the HeroBanner bottom edge by 8px at all breakpoints; on desktop (≥1024px) this places the card 16px closer to the top than the previous +8px positive offset (client decision, desktop-only change; mobile/tablet unchanged at −8px). The `z-10` overlap stacking SHALL be preserved. (ADDED in `ui-chrome-polish`.)

#### Scenario: SC-005 — panel card is 16px higher on desktop
- **WHEN** the home page renders the PanelHome section
- **THEN** the `<section data-panel-home>` carries `relative -mt-2 z-10`
- **AND** the section does NOT carry a positive `lg:mt-2` offset nor a redundant `md:-mt-2`
- **AND** on desktop (≥1024px) the card sits 8px above the hero bottom edge — 16px closer to the top than before
- **AND** on mobile/tablet the offset stays −8px (unchanged)
