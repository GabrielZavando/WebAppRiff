# top-header Specification

## Purpose
TBD - created by archiving change top-header. Update Purpose after archive.
## Requirements
### Requirement: TopHeader renders phone number
The TopHeader component SHALL render the primary phone number from configuration as a clickable `tel:` link. The phone icon SHALL be rendered via `astro-icon` (`<Icon name="material-symbols:contact-phone-outline" />` — `phone-outline` does not exist in the Material Symbols set, verified); the per-network `PhoneIcon.astro` component SHALL no longer exist in `apps/web/src/components/icons/`.

#### Scenario: Phone number displayed
- **WHEN** the component renders with PRIMARY_PHONE="+56 2 29079067"
- **THEN** the phone number is visible in the left section of the header
- **AND** the phone number is wrapped in an `<a>` tag with `href="tel:+56229079067"`
- **AND** the link contains an `<Icon name="material-symbols:contact-phone-outline">` element (no inline `<svg>`)
- **AND** the formatted number text follows the icon

### Requirement: TopHeader renders social media links
The TopHeader component SHALL render up to 4 social media links (Facebook, X, Instagram, LinkedIn) only when their corresponding URLs are configured. Each social link icon SHALL be rendered via `astro-icon` using a `<Icon name="logos:<network>" />` element referencing the Logos (Iconify) set — Material Symbols has no brand glyphs (`facebook-outline`/`twitter-outline`/etc. do not exist in `@iconify-json/material-symbols`, verified); the per-network `.astro` SVG icon components (FacebookIcon, XIcon, InstagramIcon, LinkedInIcon) SHALL no longer exist in `apps/web/src/components/icons/`.

#### Scenario: All four social links displayed
- **WHEN** all four SOCIAL_*_URL environment variables are set
- **THEN** four links are rendered in the right section
- **AND** each link has the correct `href` from configuration
- **AND** each link has `target="_blank"` and `rel="noopener noreferrer"`
- **AND** each link has an `aria-label` with the network name
- **AND** each link contains an `<Icon name="logos:<network>">` element (e.g. `logos:facebook`, `logos:twitter`, `logos:instagram`, `logos:linkedin`)
- **AND** no `<svg>` inline element is rendered for the social networks
- **AND** links are separated by vertical dividers

#### Scenario: Missing social URLs are omitted
- **WHEN** SOCIAL_INSTAGRAM_URL is not set (empty string)
- **THEN** only three links are rendered (Facebook, X, LinkedIn)
- **AND** no empty or broken link is rendered for Instagram

#### Scenario: No social URLs configured
- **WHEN** all four SOCIAL_*_URL variables are empty
- **THEN** no social links are rendered
- **AND** the right section is empty (only phone on the left)

### Requirement: TopHeader does not depend on local SVG icon components
The TopHeader component SHALL obtain all its icons via `astro-icon` (`<Icon>` element): the phone icon from the Material Symbols Outline set (`material-symbols:contact-phone-outline`) and the social icons (Facebook, X, Instagram, LinkedIn) from the Logos set (`logos:*`). The files `apps/web/src/components/icons/{PhoneIcon,FacebookIcon,XIcon,InstagramIcon,LinkedInIcon}.astro` SHALL not exist after this change.

#### Scenario: No local SVG icon components for TopHeader icons
- **WHEN** the filesystem of `apps/web/src/components/icons/` is inspected
- **THEN** no files named `PhoneIcon.astro`, `FacebookIcon.astro`, `XIcon.astro`, `InstagramIcon.astro`, or `LinkedInIcon.astro` exist
- **AND** the TopHeader component still renders all required social icons when env vars are set

#### Scenario: TopHeader imports astro-icon Icon
- **WHEN** the source of `apps/web/src/components/TopHeader.astro` is inspected
- **THEN** it contains `import { Icon } from 'astro-icon/components'` (or equivalent Astro import)
- **AND** it does not import any local `*Icon.astro` component

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
The TopHeader component SHALL use the `--color-secondary` (navy `#1F2D40`) and `--color-secondary-light` (`#35455E`) tokens via Tailwind utilities `bg-secondary`, `from-secondary`, `to-secondary-light`. The component SHALL NOT use the obsolete tokens `--color-brand-navy`, `--color-brand-navy-light`, nor the utilities `bg-brand-navy`, `from-brand-navy`, `to-brand-navy-light`.

#### Scenario: TopHeader uses navy tokens (no brand-navy)
- **WHEN** the TopHeader renders
- **THEN** the outer container applies `bg-secondary` (resolving to `#1F2D40`) and a gradient `from-secondary to-secondary-light`
- **AND** no class in the rendered HTML contains the substring `brand-navy`

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

### Requirement: Configuration reads from environment variables
The contact configuration SHALL read all values from `import.meta.env` with graceful fallback to empty strings.

#### Scenario: All env vars present
- **WHEN** PRIMARY_PHONE, SOCIAL_FACEBOOK_URL, SOCIAL_X_URL, SOCIAL_INSTAGRAM_URL, SOCIAL_LINKEDIN_URL are set
- **THEN** `getContactInfo()` returns object with all values

#### Scenario: Missing env vars
- **WHEN** some environment variables are not defined
- **THEN** `getContactInfo()` returns empty strings for missing values
- **AND** no error is thrown
