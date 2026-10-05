# top-header Specification

## MODIFIED Requirements

### Requirement: TopHeader renders phone number
TopHeader SHALL render the phone number from the shared configuration constant (currently `+56 2 29079067`) as a `tel:` link when it is non-empty, using the E.164 normalization for the `href`. The value SHALL come from `lib/config/contact.ts` constants, NOT from environment variables. (MODIFIED in `ui-chrome-uniform` — the scenario wording moved from `PRIMARY_PHONE` to the configured constant.)

#### Scenario: Phone link renders with the configured constant
- **WHEN** the component renders with the configured phone constant (`+56 2 29079067`)
- **THEN** the phone anchor renders with a `tel:` href normalized to E.164 (`tel:+56229079067`)

### Requirement: TopHeader supports a transparent mode
TopHeader SHALL accept an optional boolean prop `transparent` (default `false`). When `true`, the component SHALL render with `bg-transparent` instead of the solid `bg-secondary` while keeping the same layout, text colors, and social dividers. When `false` (default), the solid navy background `bg-secondary` SHALL be present — uniform with the global search bar; the gradient `bg-linear-to-r from-secondary to-secondary-light` was removed in `ui-chrome-uniform`. (MODIFIED in `ui-chrome-uniform`.)

#### Scenario: Transparent mode renders a transparent wrapper
- **WHEN** TopHeader renders with `transparent: true`
- **THEN** the outer class contains `bg-transparent`
- **AND** the outer class does NOT contain `bg-secondary` nor the gradient utilities `from-secondary to-secondary-light`

#### Scenario: Default mode renders the solid secondary wrapper
- **WHEN** TopHeader renders without `transparent`
- **THEN** the outer class contains `bg-secondary`
- **AND** the outer class does NOT contain `from-secondary` nor `to-secondary-light`

### Requirement: TopHeader uses brand colors and layout
The TopHeader component SHALL use the `--color-secondary` (navy `#1F2D40`) token via the Tailwind utility `bg-secondary` for its non-transparent background. The gradient utilities `from-secondary`/`to-secondary-light` and the obsolete tokens `--color-brand-*` SHALL NOT be used. (MODIFIED in `ui-chrome-uniform` — the gradient was removed so the top bar matches the search bar's solid `var(--color-secondary)`.)

#### Scenario: Solid secondary background applied
- **WHEN** the TopHeader renders in its default (non-transparent) state
- **THEN** the outer container applies `bg-secondary` (resolving to `#1F2D40`)
- **AND** the outer container does NOT apply `from-secondary to-secondary-light`

## REMOVED Requirements

### Requirement: Configuration reads from environment variables
**Reason**: the contact/social configuration moved to hardcoded constants in `lib/config/contact.ts` (change `ui-chrome-uniform`). The contact bar content no longer depends on build-time environment variables, so the deployed bar renders even when Coolify lacks the env vars. The env vars `PRIMARY_PHONE`/`SOCIAL_*_URL` are no longer read by code.

## ADDED Requirements

### Requirement: Configuration is defined in code constants
`lib/config/contact.ts` SHALL define the contact/social values as typed constants and `getContactInfo()` SHALL return them without reading `import.meta.env`: `phone` `+56 2 29079067`, `whatsapp` `+56 9 3752 6162`, `social.facebook` `https://www.facebook.com/somosriff`, `social.x` `''` (empty — suppresses the X icon), `social.instagram` `https://www.instagram.com/somosriff.cl/`, `social.linkedin` `https://www.linkedin.com/company/somosriff/`. (ADDED in `ui-chrome-uniform`.)

#### Scenario: getContactInfo returns the configured constants
- **WHEN** `getContactInfo()` is invoked
- **THEN** it returns exactly the constants listed above
- **AND** no `import.meta.env` read is performed for those values