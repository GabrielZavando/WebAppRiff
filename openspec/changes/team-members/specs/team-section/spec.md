# team-section Specification (delta)

## MODIFIED Requirements

### Requirement: Team member cards render in a responsive grid

The component SHALL render one card per `TeamMember` in the props array, ordered as provided. The cards SHALL be laid out in a responsive grid: single column on the smallest breakpoint, two columns from the `md` breakpoint, and three columns from the `lg` breakpoint. The grid SHALL use a consistent gap between cards. The default content SHALL contain exactly three members taken from `FEATURED_TEAM_MEMBERS`: Ruby Barrientos (Directora · Gerenta Comercial), Felipe Román (Gerente de Operaciones) and Patricio Barrientos (Ingeniero Químico · Asesor Técnico), in that order.

#### Scenario: Grid contains the three configured members

- **WHEN** the section renders with `FEATURED_TEAM_MEMBERS` (3 members)
- **THEN** the output contains exactly 3 team member cards
- **AND** the first card shows "Ruby Barrientos" and "Directora · Gerenta Comercial"
- **AND** the second card shows "Felipe Román" and "Gerente de Operaciones"
- **AND** the third card shows "Patricio Barrientos" and "Ingeniero Químico · Asesor Técnico"
- **AND** the rendered members are exactly the entries whose `isFeatured` is `true`

#### Scenario: Grid is responsive

- **WHEN** the card grid is rendered
- **THEN** the grid container declares column layouts for base (`grid-cols-1`), `md` (`md:grid-cols-2`) and `lg` (`lg:grid-cols-3`) breakpoints
- **AND** the grid applies a gap utility between cards

#### Scenario: Empty member list renders no cards

- **WHEN** the props array of members is empty
- **THEN** the section renders only the header with no member cards

#### Scenario: Center card is lowered on desktop only (POST-APPLY FIX #2)

- **WHEN** the card grid renders
- **THEN** the second card (index 1) declares `lg:translate-y-8`
- **AND** the first and third cards do NOT declare any vertical offset class
- **AND** the offset is a `translate` (not a margin) so the grid flow stays untouched

### Requirement: Team member card shows photo, overlay, name and role

Each card SHALL render, in this visual order: the member photo as an `astro:assets` `<Image>` filling the whole card with `object-cover`; a navy overlay — a linear vertical gradient built from the `bg-secondary` token (`bg-linear-to-b from-secondary/40 via-secondary/75 via-[67%] to-secondary/95`, POST-APPLY FIX #4) covering the photo; and over the overlay the member's name, role and description anchored toward the bottom of the card. The name SHALL render in white with `font-heading` bold. The role SHALL render the exact display string from `member.role` in uppercase with `font-heading` semibold and the `text-primary` color token. The description SHALL render below the role inside the same overlay, using `font-body text-xs leading-relaxed text-white/90`, complete and without truncation. The photo SHALL be lazy-loaded and SHALL carry a descriptive `alt` text distinct from the member name.

#### Scenario: Card shows name and role in the required typography

- **WHEN** each member card is rendered
- **THEN** the card contains the member name with `text-white` and `font-heading` classes
- **AND** the card contains the exact `member.role` text with uppercase, `text-primary` and `font-heading` classes
- **AND** the card contains the member `description` in a `<p>` element with `font-body`, `text-xs` and `leading-relaxed` classes

#### Scenario: Description is complete and not truncated

- **WHEN** each member card is rendered
- **THEN** the full `member.description` text is present in the card
- **AND** the description element does not declare line-clamp, truncate or overflow-hidden utilities

#### Scenario: Card photo uses astro assets and lazy loading

- **WHEN** the member photo renders
- **THEN** it is rendered via `astro:assets` `<Image>` with the member's imported image
- **AND** it declares `loading="lazy"`
- **AND** it declares a descriptive `alt` attribute from `member.imageAlt`

#### Scenario: Card shows navy gradient overlay at rest (POST-APPLY FIX #4)

- **WHEN** the card is in its default (non-hover) state
- **THEN** the overlay element covers the photo with a linear vertical gradient (`bg-linear-to-b`) built from the `bg-secondary` token
- **AND** the gradient is light at the top (`from-secondary/40`), gains a third stop at 67% of the card height (`via-secondary/75 via-[67%]`) and is darkest at the bottom (`to-secondary/95`) — the bottom third is a clearly darker band
- **AND** the overlay element declares `opacity-100` at rest

#### Scenario: Card photo is grayscale at rest (POST-APPLY FIX #1)

- **WHEN** the card is in its default (non-hover) state
- **THEN** the photo declares the `grayscale` filter class (black & white)

### Requirement: Component is presentational with a typed props contract

The component SHALL NOT fetch data, import services or contain business logic in its frontmatter; it SHALL render exclusively from its props. The props SHALL be typed by `NosotrosTeamSectionProps` with all fields `readonly`, containing a `headline`, `subtitle`, `eyebrow` and a `members` array of the shared `TeamMember` type imported from `@/lib/types/team`. Each `TeamMember` SHALL be typed with `readonly` fields: `id`, `name`, `role`, `description`, `image` (Astro `ImageMetadata`), `imageAlt` and `isFeatured` (boolean). The member `role` SHALL be the exact visible cargo string; it SHALL NOT be a closed slug union requiring a translation helper. No `any` SHALL be used in any file of this capability.

#### Scenario: Props contract matches the config constant

- **WHEN** `NOSOTROS_TEAM_SECTION_CONTENT` is spread onto the component
- **THEN** the constant is assignable to `NosotrosTeamSectionProps`
- **AND** `members` is exactly `FEATURED_TEAM_MEMBERS`
- **AND** every member is assignable to the shared `TeamMember` type
- **AND** every member image is an `ImageMetadata` imported from `@/assets/img/nosotros/`

#### Scenario: Role is the exact display string

- **WHEN** a card renders its role
- **THEN** it renders `member.role` directly
- **AND** no `getTeamMemberRoleLabel` helper or `TeamMemberRole` slug union is used
- **AND** the visible cargo matches the roster copy exactly

#### Scenario: All member fields are readonly and fully typed

- **WHEN** the `TeamMember` contract is inspected
- **THEN** `id`, `name`, `role`, `description`, `image`, `imageAlt` and `isFeatured` are declared `readonly`
- **AND** `isFeatured` is a boolean
- **AND** the component and its types contain no `any`

#### Scenario: Component has no data-fetching logic

- **WHEN** the component frontmatter is inspected
- **THEN** it only destructures `Astro.props` and imports the types/config, without network calls or service imports
