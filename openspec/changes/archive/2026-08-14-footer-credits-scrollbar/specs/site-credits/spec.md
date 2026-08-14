## ADDED Requirements

### Requirement: SiteCredits renders a thin full-width attribution strip below the footer

The `site-credits` capability SHALL render a thin, full-viewport-width strip placed directly below the global `site-footer` on every page (rendered by `Layout.astro` after `<Footer/>`). The strip SHALL NOT use the canonical `container` constraint — it spans the full viewport width like the footer's outermost shell — and SHALL carry a small vertical padding (e.g. `py-2`) so it reads as a thin bar. The strip SHALL contain the text "Diseñado y desarrollado por:" followed by the developer name rendered as an external anchor.

#### Scenario: Strip is a full-width element placed below the footer

- **WHEN** `Layout.astro` renders
- **THEN** the rendered HTML places the `<SiteCredits/>` output immediately after the `<Footer/>` output
- **AND** the strip's outermost element spans the full viewport width (no `container` / `max-w-*` constraint on the outermost element)

#### Scenario: Strip renders the attribution text and the developer name as a link

- **WHEN** the component renders with the default content
- **THEN** the strip contains the text "Diseñado y desarrollado por:"
- **AND** the strip contains an `<a>` element whose visible text is "Gabriel Zavando"
- **AND** the anchor declares `href="https://gabrielzavando.cl"`, `target="_blank"` and `rel="noopener noreferrer"`

### Requirement: Developer link is never underlined and animates subtly on hover using design tokens

The developer-name anchor SHALL NOT be underlined in any link state (never `text-decoration: underline` — including default, hover, active and visited). The anchor SHALL animate subtly on hover using only design-system color tokens: it SHALL use the `text-primary` color by default and transition to `text-primary-light` on hover, with a short `transition-colors` duration (e.g. `duration-200`). No raw hex color literals SHALL appear in the component classes.

#### Scenario: Link is never underlined

- **WHEN** the component source is inspected
- **THEN** the anchor's class list contains the `no-underline` utility (or a `text-decoration: none` equivalent)
- **AND** the class list does NOT contain any `underline` utility (e.g. `underline`, `hover:underline`)

#### Scenario: Link uses design-system color tokens with a subtle hover transition

- **WHEN** the component source is inspected
- **THEN** the anchor's class list carries the `text-primary` class in the base state
- **AND** the anchor's class list carries a `hover:text-primary-light` class
- **AND** the anchor's class list carries a `transition-colors` utility with a bounded duration (e.g. `duration-200`)
- **AND** the component source does NOT contain any raw hex literal (`#XXXXXX`)

### Requirement: SiteCredits is a presentational component with a typed props contract

The component SHALL NOT fetch data, import services, or contain business logic beyond destructuring props; it SHALL render exclusively from props. The props SHALL be typed by `SiteCreditsProps` with all fields `readonly`: `developerLabel` (string — the prefix text, e.g. "Diseñado y desarrollado por:"), `developerName` (string — the visible link text, e.g. "Gabriel Zavando") and `developerUrl` (string — the absolute external URL). The component SHALL NOT use `any`. The content SHALL be sourced from the `SITE_CREDITS_CONTENT` config constant in `@/lib/config/site-credits`.

#### Scenario: Props contract matches the config constant

- **WHEN** `SITE_CREDITS_CONTENT` is spread onto the component
- **THEN** the constant is assignable to `SiteCreditsProps`
- **AND** `developerLabel` equals "Diseñado y desarrollado por:"
- **AND** `developerName` equals "Gabriel Zavando"
- **AND** `developerUrl` equals "https://gabrielzavando.cl"

#### Scenario: Component has no data-fetching logic

- **WHEN** the component frontmatter is inspected
- **THEN** it only destructures `Astro.props` and imports types/config, without network calls or service imports
- **AND** it does NOT contain any hardcoded copy (every visible string is sourced from props)

### Requirement: SiteCredits follows the flat-design conventions of the site chrome

The `site-credits` strip SHALL use only design-system tokens for colors (`bg-secondary` for the strip background, `text-muted` for the label, `text-primary` / `text-primary-light` for the link and its hover). The strip SHALL NOT use `rounded*` utilities (radius is 0, flat design) and SHALL NOT use `shadow*` utilities in its static state, matching the `site-footer` conventions.

#### Scenario: Flat-design utilities are not applied

- **WHEN** the strip markup is rendered
- **THEN** no `rounded*` class is present in the strip markup
- **AND** no `shadow*` class is present in the strip markup

#### Scenario: Strip uses the secondary background token for visual separation from the footer

- **WHEN** the strip markup is rendered
- **THEN** the strip's outermost element carries the `bg-secondary` class (one step above the footer's `bg-secondary-dark` for visual separation)
- **AND** the label text carries the `text-muted` class
- **AND** no obsolete `brand-*` class is referenced in the component source
