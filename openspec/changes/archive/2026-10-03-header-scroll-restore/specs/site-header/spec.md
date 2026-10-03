# site-header Specification

## ADDED Requirements

### Requirement: Header box contains the full logo height
The `.site-header` container SHALL include a responsive `padding-bottom` (e.g. `pb-10` on mobile, `lg:pb-12` on desktop, or equivalent values) so the header's box height contains the full rendered logo height at its widest cap (200px width on mobile → ~81px tall; 300px width on desktop → ~122px tall), eliminating the visual overflow of the 2× logo below the header box while preserving the logo wrapper's `overflow-visible` behavior. (ADDED in `header-scroll-restore`.)

#### Scenario: SC-107 — site-header carries the padding-bottom utilities
- **WHEN** the site-header renders
- **THEN** the `<header class="site-header">` element carries responsive `padding-bottom` utility classes (`pb-10` and `lg:pb-12`, or equivalent values)
- **AND** the header box height is at least the full rendered logo height (the logo no longer overflows the header box)