# top-header — Delta Specification

Changes for change `topheader-click-to-call-x-icon`.

## MODIFIED Requirements

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

## ADDED Requirements

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