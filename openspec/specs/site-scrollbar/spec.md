# site-scrollbar Specification

## Purpose
TBD - created by archiving change footer-credits-scrollbar. Update Purpose after archive.
## Requirements
### Requirement: Site scrollbar thumb is tinted with the secondary-dark design token

The public site's global scrollbar SHALL be styled so that only the thumb and the thumb:hover state carry a brand color, while the track remains transparent. The thumb color SHALL be the existing `--color-secondary-dark` design token (`#16202E`); the thumb:hover color SHALL be the existing `--color-secondary-light` design token, providing subtle but on-brand hover feedback. The styling SHALL be declared in `apps/web/src/styles/globals.css` inside `@layer base`, alongside the existing `html` / `body` rules. The literal `#16202E` hex value SHALL NOT appear anywhere in the scrollbar rules — it SHALL be consumed via `var(--color-secondary-dark)`.

#### Scenario: Scrollbar uses the secondary-dark token for the thumb

- **WHEN** `apps/web/src/styles/globals.css` is inspected
- **THEN** the file declares a `scrollbar-color` property on the `html` element (or `*`) whose thumb value is `var(--color-secondary-dark)` and whose track value is `transparent`
- **AND** the file declares an `::-webkit-scrollbar-thumb` rule whose `background-color` is `var(--color-secondary-dark)`

#### Scenario: Scrollbar thumb hover uses the secondary-light token

- **WHEN** `apps/web/src/styles/globals.css` is inspected
- **THEN** the file declares an `::-webkit-scrollbar-thumb:hover` rule whose `background-color` is `var(--color-secondary-light)`

#### Scenario: No raw hex literals are used in the scrollbar rules

- **WHEN** the scrollbar rules (`scrollbar-color`, `::-webkit-scrollbar`, `::-webkit-scrollbar-track`, `::-webkit-scrollbar-thumb`, `::-webkit-scrollbar-thumb:hover`) are inspected
- **THEN** none of them contains a raw `#16202E` or `#35455E` hex literal
- **AND** every color value is expressed as a `var(--color-*)` token reference

### Requirement: Scrollbar rules declare a transparent track and respect the radius-0 flat-design rule

The scrollbar track (`::-webkit-scrollbar-track`) SHALL have a `transparent` background so the thumb is the only visible brand element. The scrollbar thumb SHALL declare `border-radius: 0` to honor the project's radius-0 flat-design convention. The `::-webkit-scrollbar` pseudo-element SHALL set a sensible bounded width/height (e.g. `12px`) so the thumb is usable without becoming an oversized dark bar.

#### Scenario: Track is transparent

- **WHEN** `apps/web/src/styles/globals.css` is inspected
- **THEN** the `::-webkit-scrollbar-track` rule declares `background: transparent` (or `background-color: transparent`)

#### Scenario: Thumb has no rounded corners

- **WHEN** `apps/web/src/styles/globals.css` is inspected
- **THEN** the `::-webkit-scrollbar-thumb` rule declares `border-radius: 0`

#### Scenario: Scrollbar width and height are bounded

- **WHEN** `apps/web/src/styles/globals.css` is inspected
- **THEN** the `::-webkit-scrollbar` rule declares a `width` value between `8px` and `16px`
- **AND** it declares a `height` value between `8px` and `16px`

### Requirement: Scrollbar styling is scoped to the public site and does not affect the admin app

The scrollbar rules SHALL live in `apps/web/src/styles/globals.css` only and SHALL NOT be mirrored to `apps/admin/src/styles/globals.css`. Because the rules live in `@layer base` (not inside `@theme {}`), they are not subject to the `apps/admin` design-token sync test.

#### Scenario: Admin globals.css is untouched

- **WHEN** `apps/admin/src/styles/globals.css` is inspected
- **THEN** the file does NOT declare any `scrollbar-color`, `::-webkit-scrollbar`, `::-webkit-scrollbar-track` or `::-webkit-scrollbar-thumb` rule

