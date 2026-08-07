## ADDED Requirements

### Requirement: TopHeader supports a transparent mode
TopHeader SHALL accept an optional boolean prop `transparent` (default `false`). When `true`, the component SHALL render with `bg-transparent` instead of the gradient `bg-secondary bg-linear-to-r from-secondary to-secondary-light` while keeping the same layout, text colors, and social dividers. When `false` (default), the existing gradient navy background SHALL be present.

#### Scenario: Transparent mode removes the gradient
- **WHEN** TopHeader renders with `transparent: true`
- **THEN** the outer class contains `bg-transparent`
- **AND** the outer class does NOT contain `bg-secondary` nor `from-secondary to-secondary-light`
- **AND** the phone link and social links are still rendered

#### Scenario: Default mode keeps the gradient
- **WHEN** TopHeader renders without `transparent` (or `transparent: false`)
- **THEN** the outer class contains `bg-secondary` and `from-secondary to-secondary-light`