# team-section Specification

## Purpose
TBD - created by archiving change nosotros-team-section. Update Purpose after archive.
## Requirements
### Requirement: Section header renders title and subtitle

The `NosotrosTeamSection` component SHALL render a centered section header composed of a main title (`<h2>`) and a subtitle paragraph (not a heading). The title SHALL read "Liderazgo & Experiencia" and SHALL use the `font-heading` family with bold weight and the `text-secondary` color token. The subtitle SHALL render the section's descriptive copy using `font-body` and the `text-text-2` color token. The header SHALL NOT contain any interactive elements.

#### Scenario: Home page renders the section header

- **WHEN** the home page renders `<NosotrosTeamSection {...NOSOTROS_TEAM_SECTION_CONTENT} />`
- **THEN** the output contains an `<h2>` element with the text "Liderazgo & Experiencia"
- **AND** the output contains a subtitle paragraph with the text "De una tradición familiar a la manufactura y servicios de clase mundial"

#### Scenario: Title uses heading typography and color tokens

- **WHEN** the section header is rendered
- **THEN** the `<h2>` element carries the `font-heading` and `text-secondary` classes

### Requirement: Team member cards render in a responsive grid

The component SHALL render one card per `TeamMember` in the props array, ordered as provided. The cards SHALL be laid out in a responsive grid: single column on the smallest breakpoint, two columns from the `md` breakpoint, and three columns from the `lg` breakpoint. The grid SHALL use a consistent gap between cards. The default content SHALL contain exactly three members: Steven Marks (Gerente General), Lara Smith (Jefe de Proyectos) and John Doe (Comercial).

#### Scenario: Grid contains the three configured members

- **WHEN** the section renders with `TEAM_MEMBERS` (3 members)
- **THEN** the output contains exactly 3 team member cards
- **AND** the first card shows "Steven Marks" and "Gerente General"
- **AND** the second card shows "Lara Smith" and "Jefe de Proyectos"
- **AND** the third card shows "John Doe" and "Comercial"

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

Each card SHALL render, in this visual order: the member photo as an `astro:assets` `<Image>` filling the whole card with `object-cover`; a navy overlay — a linear vertical gradient built from the `bg-secondary` token (`bg-linear-to-b from-secondary/40 via-secondary/75 via-[67%] to-secondary/95`, POST-APPLY FIX #4) covering the photo; and over the overlay the member's name and role text anchored toward the bottom of the card. The name SHALL render in white with `font-heading` bold. The role SHALL render in uppercase with `font-heading` semibold and the `text-primary` color token. The photo SHALL be lazy-loaded and SHALL carry a descriptive `alt` text distinct from the member name.

#### Scenario: Card shows name and role in the required typography

- **WHEN** each member card is rendered
- **THEN** the card contains the member name with `text-white` and `font-heading` classes
- **AND** the card contains the uppercase role with `text-primary` and `font-heading` classes

#### Scenario: Card photo uses astro assets and lazy loading

- **WHEN** the member photo renders
- **THEN** it is rendered via `astro:assets` `<Image>` with the member's imported image
- **AND** it declares `loading="lazy"`
- **AND** it declares a descriptive `alt` attribute

#### Scenario: Card shows navy gradient overlay at rest (POST-APPLY FIX #4)

- **WHEN** the card is in its default (non-hover) state
- **THEN** the overlay element covers the photo with a linear vertical gradient (`bg-linear-to-b`) built from the `bg-secondary` token
- **AND** the gradient is light at the top (`from-secondary/40`), gains a third stop at 67% of the card height (`via-secondary/75 via-[67%]`) and is darkest at the bottom (`to-secondary/95`) — the bottom third is a clearly darker band
- **AND** the overlay element declares `opacity-100` at rest

#### Scenario: Card photo is grayscale at rest (POST-APPLY FIX #1)

- **WHEN** the card is in its default (non-hover) state
- **THEN** the photo declares the `grayscale` filter class (black & white)

### Requirement: Hover reveals color photo with scale3d zoom (POST-APPLY FIX #1)

When a user hovers over a member card, the card SHALL animate subtly and smoothly (ease-out, approximately 300-350ms): the gradient overlay SHALL become more transparent as a whole but SHALL NOT disappear, the photo SHALL lose its grayscale filter to reveal the color image, and the photo SHALL scale up to `scale3d(1.05, 1.05, 1)`. The scale transform SHALL be applied using a 3D CSS transform (`scale3d`), and the photo SHALL declare `will-change: transform`. The overlay SHALL keep its single static gradient declaration (`bg-linear-to-b from-secondary/40 via-secondary/75 via-[67%] to-secondary/95`, deliberately hand-editable class values) and SHALL fade via an `opacity` transition (`opacity-100` at rest → `group-hover:opacity-60` on hover); gradient stops MUST NOT change on hover (browser interpolation of gradient `background-image` is not reliable — POST-APPLY FIX #2). The photo SHALL animate filter + transform together. The card container SHALL clip the scaled photo with `overflow-hidden` so it never bleeds outside the card.

#### Scenario: Overlay becomes more transparent but never disappears, via opacity fade (POST-APPLY FIX #3)

- **WHEN** the card enters the hover state
- **THEN** the overlay gradient stays present and unchanged (`bg-linear-to-b from-secondary/40 via-secondary/75 via-[67%] to-secondary/95` remains, no stop overrides)
- **AND** the overlay declares `transition-opacity duration-300 ease-out`
- **AND** the overlay rest state declares `opacity-100`
- **AND** the hover state declares `group-hover:opacity-60`
- **AND** no `transition-[background-image]` class is present on the overlay

#### Scenario: Photo transitions from grayscale to color on hover (POST-APPLY FIX #1)

- **WHEN** the card enters the hover state
- **THEN** the photo loses the `grayscale` filter via `group-hover:grayscale-0`
- **AND** the photo declares a transition that includes `filter` with an ease-out timing function

#### Scenario: Photo zooms with 3D transform on hover

- **WHEN** the card enters the hover state
- **THEN** the photo transform becomes `scale3d(1.05, 1.05, 1)`
- **AND** the photo declares a transition that includes `transform` with an ease-out timing function
- **AND** the photo declares `will-change: transform`

#### Scenario: Scaled photo is clipped by the card

- **WHEN** the card renders
- **THEN** the card container declares `overflow-hidden`
- **AND** the photo fills the card with `object-cover`

### Requirement: Reduced motion disables the zoom

When the user's system requests reduced motion (`prefers-reduced-motion: reduce`), the component SHALL disable the photo scale transform and the photo/overlay transitions (filter, opacity) while retaining the hover state itself (color photo + lighter overlay), so interactivity feedback is still visible without animation.

#### Scenario: Reduced motion keeps hover feedback without zoom

- **WHEN** the page renders with `prefers-reduced-motion: reduce` active
- **THEN** the photo does not scale on hover
- **AND** the grayscale-to-color change still happens (no animation)
- **AND** the overlay still becomes more transparent on hover

#### Scenario: Reduced motion disables transitions

- **WHEN** the page renders with `prefers-reduced-motion: reduce` active
- **THEN** the scoped CSS disables the transform and the transition on the photo
- **AND** the scoped CSS also disables the transition on the overlay

### Requirement: Component is presentational with a typed props contract

The component SHALL NOT fetch data, import services or contain business logic in its frontmatter; it SHALL render exclusively from its props. The props SHALL be typed by `NosotrosTeamSectionProps` with all fields `readonly`, containing a `headline`, `subtitle`, `eyebrow` and a `members` array of `TeamMember`. Each `TeamMember` SHALL be typed with `readonly` fields: `name`, `role`, `image` (Astro `ImageMetadata`) and `imageAlt`. The member `role` SHALL be restricted to the closed union `TeamMemberRole` (`gerente-general` | `jefe-de-proyectos` | `comercial`). No `any` SHALL be used in any file of this capability.

#### Scenario: Props contract matches the config constant

- **WHEN** `NOSOTROS_TEAM_SECTION_CONTENT` is spread onto the component
- **THEN** the constant is assignable to `NosotrosTeamSectionProps`
- **AND** every member role in `TEAM_MEMBERS` is a member of `TeamMemberRole`
- **AND** every member image is an `ImageMetadata` imported from `@/assets/img/`

#### Scenario: Component has no data-fetching logic

- **WHEN** the component frontmatter is inspected
- **THEN** it only destructures `Astro.props` and imports the types/config, without network calls or service imports

### Requirement: Flat design tokens are used

The component SHALL use only the project's design tokens: `bg-bg` for the section background, `text-secondary` for the title, `text-text-2` for the subtitle, `text-white` and `text-primary` for card text, `bg-secondary` (solid and as gradient stops `from-secondary/*`/`to-secondary/*` in a `bg-linear-to-b` overlay) and `font-heading`/`font-body` for typography. The component SHALL NOT use `rounded*` utilities (radius is 0, flat design) and SHALL NOT use `shadow*` utilities in its static state. Linear gradients over photos are part of the established visual language (`bg-linear-to-r` in Header/TopHeader), not a departure from flat design.

#### Scenario: No radius or shadow utilities are used

- **WHEN** the component markup is rendered
- **THEN** no `rounded*` class is present in the card or section markup
- **AND** no `shadow*` class is present in the static card or section markup

