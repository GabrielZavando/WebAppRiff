## MODIFIED Requirements

### Requirement: Team member cards render in a responsive grid

The component SHALL render one card per `TeamMember` in the props array, ordered as provided. The cards SHALL be laid out in a responsive grid: single column on the smallest breakpoint and three columns from the `sm` breakpoint (`>= 640px`). The grid SHALL use a consistent gap between cards and SHALL carry the Tailwind utility classes `grid-cols-1 sm:grid-cols-3`. The default content SHALL contain exactly three members taken from `FEATURED_TEAM_MEMBERS`: Ruby Barrientos (Directora · Gerenta Comercial), Felipe Román (Gerente de Operaciones) and Patricio Barrientos (Ingeniero Químico · Asesor Técnico), in that order.

#### Scenario: Grid contains the three configured members

- **WHEN** the section renders with `FEATURED_TEAM_MEMBERS` (3 members)
- **THEN** the output contains exactly 3 team member cards
- **AND** the first card shows "Ruby Barrientos" and "Directora · Gerenta Comercial"
- **AND** the second card shows "Felipe Román" and "Gerente de Operaciones"
- **AND** the third card shows "Patricio Barrientos" and "Ingeniero Químico · Asesor Técnico"
- **AND** the rendered members are exactly the entries whose `isFeatured` is `true`

#### Scenario: Grid is responsive

- **WHEN** the card grid is rendered
- **THEN** the grid container declares column layouts for base (`grid-cols-1`) and `sm` (`sm:grid-cols-3`) breakpoints
- **AND** the grid does NOT use `md:grid-cols-2` as the first multi-column breakpoint
- **AND** the grid applies a gap utility between cards

#### Scenario: Grid shows three columns at 640px

- **WHEN** la home se carga en el viewport `640×800`
- **THEN** la grilla de "Liderazgo & Experiencia" muestra exactamente 3 columnas
- **AND** las tres tarjetas quedan en una sola fila
- **AND** el nombre y el rol de cada tarjeta permanecen legibles y dentro de su tarjeta
- **AND** la página no provoca scroll horizontal

#### Scenario: Empty member list renders no cards

- **WHEN** the props array of members is empty
- **THEN** the section renders only the header with no member cards

#### Scenario: Center card is lowered on desktop only (POST-APPLY FIX #2)

- **WHEN** the card grid renders
- **THEN** the second card (index 1) declares `lg:translate-y-8`
- **AND** the first and third cards do NOT declare any vertical offset class
- **AND** el offset SHALL aplicarse solo desde `lg`; en `sm` la tarjeta central permanece alineada con las demás
- **AND** the offset is a `translate` (not a margin) so the grid flow stays untouched
