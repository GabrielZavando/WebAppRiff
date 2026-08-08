## MODIFIED Requirements

### Requirement: TopHeader renders phone number
The TopHeader component SHALL render the primary phone number from configuration as a clickable `tel:` link. The phone icon SHALL be rendered via `astro-icon` (`<Icon name="lucide:phone" />`) — the set único autorizado es **Lucide** (outline stroke 2px); el set `material-symbols` y el icono `material-symbols:contact-phone-outline` quedan obsoletos. El per-network `PhoneIcon.astro` component SHALL no longer exist in `apps/web/src/components/icons/`.

#### Scenario: Phone number displayed
- **WHEN** the component renders with PRIMARY_PHONE="+56 2 29079067"
- **THEN** the phone number is visible in the left section of the header
- **AND** the phone number is wrapped in an `<a>` tag with `href="tel:+56229079067"`
- **AND** the link contains an `<Icon name="lucide:phone">` element (no inline `<svg>`)
- **AND** the formatted number text follows the icon

### Requirement: TopHeader renders social media links
The TopHeader component SHALL render up to 4 social media links (Facebook, X, Instagram, LinkedIn) only when their corresponding URLs are configured. Each social link icon SHALL be rendered via `astro-icon` using a `<Icon name="lucide:<network>" />` element referencing el set único **Lucide** — los logos de marca se uniforman al set Lucide por decisión del cliente (priorizar coherencia visual sobre fidelidad de marca); los sets `logos` (Iconify Logos) y sus glifos `logos:facebook`/`logos:twitter`/`logos:instagram`/`logos:linkedin` quedan obsoletos. El per-network `.astro` SVG icon components (FacebookIcon, XIcon, InstagramIcon, LinkedInIcon) SHALL no longer exist in `apps/web/src/components/icons/`.

#### Scenario: All four social links displayed
- **WHEN** all four SOCIAL_*_URL environment variables are set
- **THEN** four links are rendered in the right section
- **AND** each link has the correct `href` from configuration
- **AND** each link has `target="_blank"` and `rel="noopener noreferrer"`
- **AND** each link has an `aria-label` with the network name
- **AND** each link contains an `<Icon name="lucide:<network>">` element (e.g. `lucide:facebook`, `lucide:twitter`, `lucide:instagram`, `lucide:linkedin`)
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
The TopHeader component SHALL obtain all its icons via `astro-icon` (`<Icon>` element) del set único **Lucide**: el phone icon como `lucide:phone` y los iconos sociales (Facebook, X, Instagram, LinkedIn) como `lucide:facebook`/`lucide:twitter`/`lucide:instagram`/`lucide:linkedin`. Los sets `material-symbols` y `logos` NO se referencian en `TopHeader.astro`. Los archivos `apps/web/src/components/icons/{PhoneIcon,FacebookIcon,XIcon,InstagramIcon,LinkedInIcon}.astro` SHALL not exist.

#### Scenario: No local SVG icon components for TopHeader icons
- **WHEN** the filesystem of `apps/web/src/components/icons/` is inspected
- **THEN** no files named `PhoneIcon.astro`, `FacebookIcon.astro`, `XIcon.astro`, `InstagramIcon.astro`, or `LinkedInIcon.astro` exist
- **AND** the TopHeader component still renders all required social icons when env vars are set

#### Scenario: TopHeader imports astro-icon Icon and uses Lucide
- **WHEN** the source of `apps/web/src/components/TopHeader.astro` is inspected
- **THEN** it contains `import { Icon } from 'astro-icon/components'` (or equivalent Astro import)
- **AND** it does not import any local `*Icon.astro` component
- **AND** all `<Icon name="...">` references start with the prefix `lucide:`
