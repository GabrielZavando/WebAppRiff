# site-header Specification

## MODIFIED Requirements

### Requirement: Header box contains the full logo height
The `.site-header` container SHALL include a responsive `padding-bottom` of `pb-10 lg:pb-4` (client decision in `ui-chrome-polish`, previously `pb-10 lg:pb-12`): mobile keeps 80px (h-20) + 40px (pb-10) ≥ ~81px logo (full containment); desktop relaxes to 96px (lg:h-24) + 16px (lg:pb-4) = 112px vs ~122px logo at the 300px cap — a slight visual overflow of the 2× logo on desktop that the client explicitly accepted ("así se ve mejor"), preserving the logo wrapper's `overflow-visible` behavior. (MODIFIED in `ui-chrome-polish`.)

#### Scenario: SC-001 — site-header carries pb-10 lg:pb-4
- **WHEN** the site-header renders
- **THEN** the `<header class="site-header">` element carries `pb-10` and `lg:pb-4`
- **AND** the previous `lg:pb-12` value does NOT appear in the header classes
- **AND** on mobile the header box still contains the full logo height; on desktop the slight 2× logo overflow is accepted by the client
