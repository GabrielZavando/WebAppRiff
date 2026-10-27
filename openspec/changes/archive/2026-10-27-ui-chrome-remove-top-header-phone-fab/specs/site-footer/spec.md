# site-footer Specification

## Purpose

Global footer of the public site (`apps/web`, Astro SSG) rendered by `Layout.astro` on every page — dark navy full-bleed shell (`bg-secondary-dark`), brand column (PNG logo + tagline + social icons), two link columns (SERVICIOS and EMPRESA) pointing to real internal routes, technical schedule column with 24/7 support note, and a copyright bar with location and a scroll-to-top teal button; strictly flat design (no `rounded*`, no `shadow*`).

## MODIFIED Requirements

### Requirement: Brand column shows logo image, tagline and social icons

The `site-footer` SHALL render a brand column as the first grid cell containing: the Riff logo image from `apps/web/src/assets/img/logo-web.png` via `astro:assets` `<Image>` with explicit `width={165}` and `height={83}` (preserving the 1080×542 aspect ratio) plus a descriptive `alt` attribute (falling back to "Riff" when not provided) and `loading="lazy"`; the brand tagline paragraph styled with the muted text token; and the configured social links rendered via `astro-icon`. Facebook, Instagram and LinkedIn SHALL use `lucide:facebook`, `lucide:instagram`, `lucide:linkedin`. **Exception**: X SHALL use `simple-icons:x` (the official current X brand logo) — the sole documented exception to the "set único Lucide" rule (Lucide does not provide the current X brand mark; `lucide:x` is a close icon). Only social networks with a configured URL SHALL render.

#### Scenario: Only configured social links render
- **WHEN** the footer renders with two of the four social URLs configured
- **THEN** the brand column contains exactly two social anchor elements
- **AND** each rendered social anchor carries an `aria-label` matching the network name
- **AND** each rendered social anchor declares `target="_blank"` and `rel="noopener noreferrer"`

#### Scenario: Footer X icon uses simple-icons:x (regression)
- **WHEN** the footer renders with the X social URL configured
- **THEN** the X anchor contains `<Icon name="simple-icons:x">`
- **AND** no `lucide:twitter` reference appears for the X social link

#### Scenario: Footer logo uses the PNG asset at the correct ratio
- **WHEN** `Footer.astro` is inspected
- **THEN** it imports `logo-web.png`
- **AND** it renders `<Image>` with `width={165}` and `height={83}`
- **AND** `logo-web.webp` is not referenced

### Requirement: Component is presentational with a typed props contract

The component SHALL NOT fetch data, import services or contain business logic beyond destructuring props; it SHALL render exclusively from props. The props SHALL be typed by `SiteFooterProps` with all fields `readonly`: `logoAlt`, `tagline`, `socialLinks` (reusing `SocialLink` from `@/lib/types/contact`), `columns` (array of `FooterColumn` — `title` + `links` of `FooterLink`), `scheduleTitle` (string — the visible schedule column title, rendered uppercase), `schedule` (array of `FooterScheduleEntry` — `days` + `hours` as `readonly string[]` so a single day range can list one or more hour blocks) and `scheduleNote`. The component SHALL NOT use `any`. No column or schedule title SHALL be hardcoded inside the component. Los `href` de `FooterLink` SHALL ser rutas internas reales (o URLs sociales completas); el config SHALL NOT declarar placeholders `href="#"`.

#### Scenario: Props contract matches the config constant

- **WHEN** `SITE_FOOTER_CONTENT` is spread onto the component
- **THEN** the constant is assignable to `SiteFooterProps`
- **AND** the `scheduleTitle` field equals "Horario de Atención"
- **AND** every column title is `SERVICIOS` or `EMPRESA`
- **AND** la columna SERVICIOS tiene 4 links y la columna EMPRESA 3 links, todos con `href` internos reales (sin `href="#"`)
- **AND** every `FooterScheduleEntry.hours` is a `readonly string[]` of length 2

#### Scenario: Component has no data-fetching logic

- **WHEN** the component frontmatter is inspected
- **THEN** it only destructures `Astro.props` and imports types, config and `astro:assets`/`astro-icon`, without network calls or service imports
- **AND** the component frontmatter does NOT contain the literal string "HORARIO TÉCNICO"

### Requirement: Flat design tokens are used

The component SHALL use only the project's design tokens: `bg-secondary-dark` for the footer background, `text-white` for the logo/labels, `text-primary` for column titles and the 24/7 note, `text-muted` for the tagline, schedule hours and copyright, `text-white/80` for links, and `border-white/10` for the divider. The component SHALL NOT use `rounded*` utilities (radius is 0, flat design) and SHALL NOT use `shadow*` utilities in its static state.

#### Scenario: No radius or shadow utilities are used

- **WHEN** the footer markup is rendered
- **THEN** no `rounded*` class is present in the footer markup
- **AND** no `shadow*` class is present in the footer markup

#### Scenario: No brand-* classes are used

- **WHEN** the component source is inspected
- **THEN** it does not reference any obsolete `bg-brand-*`, `text-brand-*` or `border-brand-*` class

## REMOVED Requirements

### Requirement: Footer social icon map stays in sync with TopHeader
**Reason**: `TopHeader` is retired; the Footer can no longer stay in sync with a component that does not exist.

**Migration**: The Footer keeps its own `socialIconMap`; the X mapping is covered by the new requirement below and by `configure-social-links`.

## ADDED Requirements

### Requirement: Footer social icon map uses the official X brand logo
The Footer SHALL map X to `simple-icons:x` (the official current X brand logo) and SHALL NOT map it to `lucide:twitter` or `lucide:x`.

#### Scenario: Footer X icon uses the official brand mark
- **WHEN** the Footer renders with the X social URL configured
- **THEN** the X anchor contains `<Icon name="simple-icons:x">`
- **AND** no `lucide:twitter` or `lucide:x` reference appears for the X social link
