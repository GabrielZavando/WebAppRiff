## MODIFIED Requirements

### Requirement: SearchForm inner container is constrained to 760px and centered with mobile horizontal padding
The SearchForm SHALL constrain its form content area to a maximum width of 760px and center it horizontally. The inner container div (direct parent of `<form>`) SHALL carry `max-w-[760px]` and `mx-auto` and SHALL NOT carry the `container` utility (which applies `max-w-7xl` = 1280px with horizontal padding). On mobile viewports, the inner container SHALL carry `px-4` horizontal padding so the form does not touch the screen edges; this padding SHALL be removed from the `md` breakpoint (>= 768px) upward via `md:px-0` so the 760px box uses its full width on desktop. The inner container SHALL NOT carry `px-6` or `px-8` (only `px-4` on mobile is allowed). The outer `role="search"` wrapper SHALL retain full viewport width with its background and border.

#### Scenario: Inner container uses max-w-760px and mobile horizontal padding
- **WHEN** the SearchForm renders
- **THEN** the div directly wrapping `<form>` carries `max-w-[760px]`
- **AND** that div carries `mx-auto` (centered)
- **AND** that div does NOT contain the `container` utility class (which is `max-w-7xl`)
- **AND** that div carries `px-4` (16px horizontal padding on mobile)
- **AND** that div carries `md:px-0` (padding removed from md breakpoint upward)
- **AND** that div does NOT contain `px-6` or `px-8` (only px-4 on mobile is allowed)
