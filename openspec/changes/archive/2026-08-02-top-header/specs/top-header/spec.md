## ADDED Requirements

### Requirement: TopHeader renders phone number
The TopHeader component SHALL render the primary phone number from configuration as a clickable tel: link.

#### Scenario: Phone number displayed
- **WHEN** the component renders with PRIMARY_PHONE="+56 2 29079067"
- **THEN** the phone number is visible in the left section of the header
- **AND** the phone number is wrapped in an `<a>` tag with `href="tel:+56229079067"`
- **AND** the link contains a phone icon and the formatted number text

### Requirement: TopHeader renders social media links
The TopHeader component SHALL render up to 4 social media links (Facebook, X, Instagram, LinkedIn) only when their corresponding URLs are configured.

#### Scenario: All four social links displayed
- **WHEN** all four SOCIAL_*_URL environment variables are set
- **THEN** four links are rendered in the right section
- **AND** each link has the correct `href` from configuration
- **AND** each link has `target="_blank"` and `rel="noopener noreferrer"`
- **AND** each link has an `aria-label` with the network name
- **AND** links are separated by vertical dividers

#### Scenario: Missing social URLs are omitted
- **WHEN** SOCIAL_INSTAGRAM_URL is not set (empty string)
- **THEN** only three links are rendered (Facebook, X, LinkedIn)
- **AND** no empty or broken link is rendered for Instagram

#### Scenario: No social URLs configured
- **WHEN** all four SOCIAL_*_URL variables are empty
- **THEN** no social links are rendered
- **AND** the right section is empty (only phone on the left)

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
The TopHeader component SHALL use the brand navy color scheme and proper spacing.

#### Scenario: Correct styling applied
- **WHEN** the component renders on desktop
- **THEN** the header has background color `bg-brand-navy`
- **AND** height is `h-9` (36px)
- **AND** content is centered with `container mx-auto px-4`
- **AND** phone and social sections are justified between (space-between)
- **AND** social links have hover effect (`hover:bg-white/10`)
- **AND** vertical dividers between social links use `border-white/20`

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