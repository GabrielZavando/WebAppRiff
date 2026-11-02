## ADDED Requirements

### Requirement: Team member overlay text uses a reduced font size from sm

The text overlaid on the member photo SHALL use a reduced font size from the `sm` breakpoint (`>= 640px`) upward, so that the overlay occupies less space over the photograph. The member name SHALL render as `text-xl` in the base breakpoint (`< 640px`) and as `text-lg` from `sm` upward. The member role SHALL render as `text-xs` in the base breakpoint and as `text-[0.625rem]` from `sm` upward. The color, family and weight tokens of both elements SHALL remain unchanged (`text-white`, `text-primary`, `font-heading`, `font-bold` / `font-semibold`, `uppercase`, `tracking-wider`).

#### Scenario: Name font size is reduced from sm upward

- **WHEN** la home se carga en un viewport `>= 640px`
- **THEN** el nombre del miembro superpuesto sobre la foto se renderiza con `sm:text-lg`
- **AND** el nombre no se renderiza con `text-xl` a partir de `sm`

#### Scenario: Role font size is reduced from sm upward

- **WHEN** la home se carga en un viewport `>= 640px`
- **THEN** el cargo superpuesto sobre la foto se renderiza con `sm:text-[0.625rem]`
- **AND** el cargo mantiene `uppercase`, `tracking-wider`, `font-heading` y `text-primary`

#### Scenario: Base breakpoint keeps the current typography

- **WHEN** la home se carga en un viewport `< 640px`
- **THEN** el nombre del miembro se renderiza con `text-xl`
- **AND** el cargo del miembro se renderiza con `text-xs`

#### Scenario: Overlay text remains legible and inside the card

- **WHEN** la home se carga en un viewport `>= 640px`
- **THEN** el nombre y el cargo permanecen legibles sobre el degradado de la tarjeta
- **AND** el texto superpuesto no desborda la tarjeta
- **AND** la página no provoca scroll horizontal
