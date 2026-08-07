## ADDED Requirements

### Requirement: SearchForm supports a transparent mode
SearchForm SHALL accept an optional boolean prop `transparent` (default `false`). When `true`, the outer `role="search"` wrapper SHALL be `bg-transparent` with a translucent bottom border, instead of `bg-white border-b border-gray-200`. The select and input fields keep their white background for legibility, and the submit button keeps `bg-accent`.

#### Scenario: Transparent mode removes the white wrapper
- **WHEN** SearchForm renders with `transparent: true`
- **THEN** the `role="search"` wrapper carries `bg-transparent`
- **AND** the wrapper does NOT contain `bg-white`
- **AND** the input fields still carry `bg-white`

#### Scenario: Default mode keeps the white wrapper
- **WHEN** SearchForm renders without `transparent`
- **THEN** the `role="search"` wrapper carries `bg-white border-b border-gray-200`