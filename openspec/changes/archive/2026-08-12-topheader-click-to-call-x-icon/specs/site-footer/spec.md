# site-footer — Delta Specification

Changes for change `topheader-click-to-call-x-icon`.

## MODIFIED Requirements

### Requirement: Brand column shows logo image, tagline and social icons

The `site-footer` SHALL render a brand column as the first grid cell containing: the existing header logo image (`logo-web.webp`) via `astro:assets` `<Image>` with a descriptive `alt` attribute (falling back to "Riff" when not provided) and `loading="lazy"`; the brand tagline paragraph styled with the muted text token; and the configured social links rendered via `astro-icon`. Facebook, Instagram and LinkedIn SHALL use `lucide:facebook`, `lucide:instagram`, `lucide:linkedin`. **Exception**: X SHALL use `simple-icons:x` (the official current X brand logo) — the sole documented exception to the "set único Lucide" rule (Lucide does not provide the current X brand mark; `lucide:x` is a close icon). This exception applies to `site-footer` identically as in `top-header` for cross-component consistency (design.md § Decision 4). Only social networks with a configured URL SHALL render.

#### Scenario: Only configured social links render
- **WHEN** the footer renders with two of the four social URLs configured
- **THEN** the brand column contains exactly two social anchor elements
- **AND** each rendered social anchor carries an `aria-label` matching the network name
- **AND** each rendered social anchor declares `target="_blank"` and `rel="noopener noreferrer"`

#### Scenario: Footer X icon uses simple-icons:x (regression)
- **WHEN** the footer renders with the X social URL configured
- **THEN** the X anchor contains `<Icon name="simple-icons:x">`
- **AND** no `lucide:twitter` reference appears for the X social link
- **AND** the X icon name matches TopHeader exactly (`simple-icons:x`)

## ADDED Requirements

### Requirement: Footer social icon map stays in sync with TopHeader
The Footer SHALL use the same `socialIconMap` mapping as TopHeader (single social presence across chrome, design.md § Decision 4), with the documented `simple-icons:x` exception for X.

#### Scenario: X icon consistency between Header and Footer chrome
- **WHEN** both TopHeader and Footer have the X social URL configured
- **THEN** both render `<Icon name="simple-icons:x">` for X
- **AND** neither renders `lucide:twitter` for X