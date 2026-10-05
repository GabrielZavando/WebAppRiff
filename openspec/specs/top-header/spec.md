# top-header Specification

## Purpose
Barra superior del sitio: teléfono, links de redes sociales, modo transparente, oculta en mobile, colores de marca y sin dependencia de componentes de iconos SVG locales.
## Requirements
### Requirement: TopHeader renders phone number
TopHeader SHALL render the phone number from the shared configuration constant (currently `+56 2 29079067`) as a `tel:` link when it is non-empty, using the E.164 normalization for the `href`. The value SHALL come from `lib/config/contact.ts` constants, NOT from environment variables. (MODIFIED in `ui-chrome-uniform` — the scenario wording moved from `PRIMARY_PHONE` to the configured constant.)

#### Scenario: Phone link renders with the configured constant
- **WHEN** the component renders with the configured phone constant (`+56 2 29079067`)
- **THEN** the phone anchor renders with a `tel:` href normalized to E.164 (`tel:+56229079067`)

### Requirement: TopHeader renders social media links
The TopHeader component SHALL render up to 4 social media links (Facebook, X, Instagram, LinkedIn) only when their corresponding URLs are configured. Each social link icon SHALL be rendered via `astro-icon` using a `<Icon>` element. Facebook, Instagram and LinkedIn icons SHALL use the `lucide:` prefix (the set único autorizado). **Exception**: the X (Twitter) social link icon SHALL use `simple-icons:x` (the official current X brand logo), because Lucide does not provide the current X brand mark and `lucide:x` is a close icon (not the brand); this is the **only** documented exception to the "set único Lucide" rule (see `docs/design/style-guide/README.md`). Los sets `logos` (Iconify Logos) quedan obsoletos. El per-network `.astro` SVG icon components (FacebookIcon, XIcon, InstagramIcon, LinkedInIcon) SHALL no longer exist in `apps/web/src/components/icons/`.

#### Scenario: All four social links displayed
- **WHEN** all four social URLs are configured (Facebook, X, Instagram, LinkedIn)
- **THEN** four links are rendered in the right section
- **AND** each link has the correct `href` from configuration
- **AND** each link has `target="_blank"` and `rel="noopener noreferrer"`
- **AND** each link has an `aria-label` with the network name
- **AND** each link contains an `<Icon>` element; Facebook uses `lucide:facebook`, X uses `simple-icons:x`, Instagram uses `lucide:instagram`, LinkedIn uses `lucide:linkedin`
- **AND** no `<svg>` inline element is rendered for the social networks
- **AND** links are separated by vertical dividers

#### Scenario: Missing social URLs are omitted
- **WHEN** the Instagram URL is not set (empty string)
- **THEN** only three links are rendered (Facebook, X, LinkedIn)
- **AND** no empty or broken link is rendered for Instagram

#### Scenario: No social URLs configured
- **WHEN** all four social URLs are empty
- **THEN** no social links are rendered
- **AND** the right section is empty (only phone on the left)

### Requirement: TopHeader does not depend on local SVG icon components
The TopHeader component SHALL obtain all its icons via `astro-icon` (`<Icon>` element): the phone icon as `lucide:phone` and the social icons as `lucide:facebook`, `simple-icons:x` (X — the sole documented exception), `lucide:instagram`, and `lucide:linkedin`. Los sets `material-symbols` y `logos` NO se referencian en `TopHeader.astro`. Los archivos `apps/web/src/components/icons/{PhoneIcon,FacebookIcon,XIcon,InstagramIcon,LinkedInIcon}.astro` SHALL not exist.

#### Scenario: No local SVG icon components for TopHeader icons
- **WHEN** the filesystem of `apps/web/src/components/icons/` is inspected
- **THEN** no files named `PhoneIcon.astro`, `FacebookIcon.astro`, `XIcon.astro`, `InstagramIcon.astro`, or `LinkedInIcon.astro` exist
- **AND** the TopHeader component still renders all required social icons when URLs are set

#### Scenario: TopHeader imports astro-icon Icon and uses authorized sets
- **WHEN** the source of `apps/web/src/components/TopHeader.astro` is inspected
- **THEN** it contains `import { Icon } from 'astro-icon/components'` (or equivalent Astro import)
- **AND** it does not import any local `*Icon.astro` component
- **AND** all `<Icon name="...">` references use either the `lucide:` prefix or the `simple-icons:x` exception for X

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

### Requirement: TopHeader is hidden on mobile
The TopHeader component SHALL be completely hidden on viewports smaller than 640px (Tailwind `sm` breakpoint).

#### Scenario: Hidden on mobile viewport
- **WHEN** viewport width is <640px
- **THEN** the component has `display: none` (via `hidden sm:flex`)
- **AND** no part of the header is visible or takes up layout space

#### Scenario: Visible on desktop viewport
- **WHEN** viewport width is >=640px
- **THEN** the component is displayed as flex container
- **AND** phone and social links are visible

### Requirement: TopHeader uses brand colors and layout
The TopHeader component SHALL use the `--color-secondary` (navy `#1F2D40`) token via the Tailwind utility `bg-secondary` for its non-transparent background. The gradient utilities `from-secondary`/`to-secondary-light` and the obsolete tokens `--color-brand-*` SHALL NOT be used. (MODIFIED in `ui-chrome-uniform` — the gradient was removed so the top bar matches the search bar's solid `var(--color-secondary)`.)

#### Scenario: Solid secondary background applied
- **WHEN** the TopHeader renders in its default (non-transparent) state
- **THEN** the outer container applies `bg-secondary` (resolving to `#1F2D40`)
- **AND** the outer container does NOT apply `from-secondary to-secondary-light`

### Requirement: TopHeader accessibility
The TopHeader component SHALL meet accessibility requirements for links and navigation.

#### Scenario: Social links have proper attributes
- **WHEN** social links are rendered
- **THEN** each link has `aria-label` with network name (e.g., "Facebook", "X", "Instagram", "LinkedIn")
- **AND** each link has `target="_blank"`
- **AND** each link has `rel="noopener noreferrer"`

#### Scenario: Navigation landmark
- **WHEN** social links are rendered
- **THEN** they are wrapped in a `<nav>` element with `aria-label="Redes sociales"`

### Requirement: TopHeader normalizes phone number to E.164 tel: format (regression)
The `phoneHref` computation in TopHeader SHALL normalize the configured phone number to E.164 format by stripping all characters except digits and the leading `+` before constructing the `tel:` link. This is a regression test guarding the existing behavior.

#### Scenario: Phone with internal spaces and separators normalizes to E.164
- **WHEN** the component renders with `contact.phone = "+56 2 2907 9067"`
- **THEN** the phone `<a>` has `href="tel:+56229079067"`
- **AND** the rendered link text preserves the original formatted string `+56 2 2907 9067`

#### Scenario: Phone without country code still works
- **WHEN** the component renders with `contact.phone = "9 1234 5678"`
- **THEN** the phone `<a>` has `href="tel:912345678"`

#### Scenario: Phone empty renders no link
- **WHEN** `contact.phone` is empty or undefined
- **THEN** no phone `<a>` element is rendered

### Requirement: Footer X icon uses the official X brand logo (regression)
The Footer `socialIconMap` SHALL map `X` to `simple-icons:x` (the official current X brand logo), matching TopHeader exactly. This is a regression test guarding the cross-component consistency (design.md § Decision 4).

#### Scenario: Footer X icon matches TopHeader
- **WHEN** the Footer renders with the X social URL configured
- **THEN** the X anchor contains `<Icon name="simple-icons:x">`
- **AND** the same icon name is used in TopHeader for X
- **AND** no `lucide:twitter` reference appears in either component for the X social link

### Requirement: TopHeader minimizes its vertical footprint
The TopHeader component SHALL use the smallest practical vertical height that still accommodates its content (phone icon `lucide:phone` at `h-3.5` = 14px, `text-sm` line, and social icons at `h-3.5`). The root container SHALL use `h-8` (Tailwind 32px) instead of `h-9` (36px), reducing the vertical footprint by 4px. There SHALL be no additional `mt-*`/`mb-*` margin or vertical (`py-*`) padding that adds separation between TopHeader and the Header component it precedes.

#### Scenario: Compact height class
- **WHEN** TopHeader renders
- **THEN** the outer `div` carries `h-8` (not `h-9`)
- **AND** the outer `div` does NOT carry any `mt-*`, `mb-*`, `py-*`, or `space-y-*` vertical spacing utility on the root

#### Scenario: No gap between TopHeader and Header
- **WHEN** Layout.astro renders TopHeader immediately followed by Header
- **THEN** the TopHeader root `div` has no `mb-*` / `mt-*` class creating vertical separation
- **AND** the Header root `<header>` has no `mt-*` creating vertical separation
- **AND** the rendered markup shows the Header `<nav>` immediately after the TopHeader `</div>` with no spacer element

#### Scenario: Content still renders fully at reduced height
- **WHEN** TopHeader renders with full contact (phone + 4 socials)
- **THEN** both the phone link and all social anchors are fully visible and not clipped vertically

### Requirement: Configuration is defined in code constants
`lib/config/contact.ts` SHALL define the contact/social values as typed constants and `getContactInfo()` SHALL return them without reading `import.meta.env`: `phone` `+56 2 29079067`, `whatsapp` `+56 9 3752 6162`, `social.facebook` `https://www.facebook.com/somosriff`, `social.x` `''` (empty — suppresses the X icon), `social.instagram` `https://www.instagram.com/somosriff.cl/`, `social.linkedin` `https://www.linkedin.com/company/somosriff/`. (ADDED in `ui-chrome-uniform`.)

#### Scenario: getContactInfo returns the configured constants
- **WHEN** `getContactInfo()` is invoked
- **THEN** it returns exactly the constants listed above
- **AND** no `import.meta.env` read is performed for those values

