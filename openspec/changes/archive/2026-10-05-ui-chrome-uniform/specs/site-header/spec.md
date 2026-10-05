# site-header Specification

## MODIFIED Requirements

### Requirement: Site Header supports a transparent mode
Header SHALL accept an optional boolean prop `transparent` (default `false`). When `true`, the `<header>` element SHALL use `bg-transparent` instead of the solid `bg-secondary`; the logo, desktop nav, CTA and mobile toggle remain unchanged. When `false` (default), the solid navy `bg-secondary` background SHALL be present — uniform with the search bar and the top bar; the gradient `bg-linear-to-r from-secondary to-secondary-light` was removed in `ui-chrome-uniform`. (MODIFIED in `ui-chrome-uniform`.)

#### Scenario: Transparent mode replaces the solid header background
- **WHEN** the Header renders with `transparent: true`
- **THEN** the `<header>` element carries `bg-transparent`
- **AND** the `<header>` element does NOT carry `bg-secondary` nor the gradient utilities

#### Scenario: Default mode renders the solid secondary header
- **WHEN** the Header renders without `transparent`
- **THEN** the `<header>` element carries `bg-secondary` (solid var(--color-secondary))
- **AND** the `<header>` element does NOT carry `bg-linear-to-r from-secondary to-secondary-light`

### Requirement: Header renders logo at 2× size with overflow
(section on tokens) The header container SHALL use the `--color-secondary` (navy `#1F2D40`) token via the Tailwind utility `bg-secondary` for its background; the gradient utilities `bg-linear-to-r from-secondary to-secondary-light` and the obsolete utilities `bg-brand-navy`, `from-brand-navy`, `to-brand-navy-light` SHALL NOT appear. (MODIFIED in `ui-chrome-uniform` — the logo rendering contract is unchanged; only the background token sentence changed from gradient to solid.)

#### Scenario: Logo container uses the solid secondary background
- **WHEN** the site header renders in its default (non-transparent) state
- **THEN** the `<header>` container applies `bg-secondary` (resolving to `#1F2D40`)
- **AND** the container does NOT apply `from-secondary to-secondary-light`