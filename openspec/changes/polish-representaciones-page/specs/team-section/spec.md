## MODIFIED Requirements

### Requirement: Flat design tokens are used

The component SHALL use only the project's design tokens: `bg-surface-muted` for the section background, `text-secondary` for the title, `text-text-2` for the subtitle, `text-white` and `text-primary` for card text, `bg-secondary` (solid and as gradient stops `from-secondary/*`/`to-secondary/*` in a `bg-linear-to-b` overlay) and `font-heading`/`font-body` for typography. The component SHALL NOT use `rounded*` utilities (radius is 0, flat design) and SHALL NOT use `shadow*` utilities in its static state. Linear gradients over photos are part of the established visual language (`bg-linear-to-r` in Header/TopHeader), not a departure from flat design. (MODIFIED in `polish-representaciones-page`: el fondo de la sección pasa de `bg-bg` a `bg-surface-muted` para alinearse con el nuevo fondo base del sitio.)

#### Scenario: No radius or shadow utilities are used

- **WHEN** the component markup is rendered
- **THEN** no `rounded*` class is present in the card or section markup
- **AND** no `shadow*` class is present in the static card or section markup

#### Scenario: Section uses the muted page surface

- **WHEN** el componente se renderiza
- **THEN** el elemento `<section>` de la sección de equipo lleva `bg-surface-muted`
- **AND** el elemento `<section>` no lleva `bg-bg` como fondo de sección
