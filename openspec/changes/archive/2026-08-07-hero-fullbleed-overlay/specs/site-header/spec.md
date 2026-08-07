## ADDED Requirements

### Requirement: Site Header supports a transparent mode
Header SHALL accept an optional boolean prop `transparent` (default `false`). When `true`, the `<header>` element SHALL use `bg-transparent` instead of `bg-linear-to-r from-secondary to-secondary-light`; the logo, desktop nav, CTA and mobile toggle remain unchanged. When `false` (default), the existing navy gradient SHALL be present.

#### Scenario: Transparent mode replaces header gradient
- **WHEN** Header renders with `transparent: true`
- **THEN** the `<header>` element carries `bg-transparent`
- **AND** its class does NOT contain `from-secondary to-secondary-light`
- **AND** the logo link and navigation items still render

#### Scenario: Default mode keeps gradient header
- **WHEN** Header renders without `transparent`
- **THEN** the `<header>` element carries `bg-linear-to-r from-secondary to-secondary-light`