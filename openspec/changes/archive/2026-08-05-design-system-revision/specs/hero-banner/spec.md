# hero-banner Specification — delta for design-system-revision

## MODIFIED Requirements

### Requirement: HeroBanner renders the headline with the highlighted word in a distinct color
The `hero-banner` SHALL render an `<h1>` whose visible text equals `headline` followed by `highlightedWord`, where `highlightedWord` is wrapped in a `<span>` carrying the `text-primary` class (resolving to `--color-primary` `#41B3C4`) so it visually stands out from the rest of the headline. The obsolete utility `text-brand-teal` and references to `--color-brand-teal` SHALL NOT appear.

#### Scenario: Highlighted word uses primary token
- **WHEN** the HeroBanner renders with headline "Innovación que Fluye" and highlightedWord "Fluye"
- **THEN** the `<h1>` contains a `<span>` element wrapping "Fluye"
- **AND** that `<span>` carries the `text-primary` class (resolving to `#41B3C4`)
- **AND** the rendered HTML does NOT contain the class `text-brand-teal`

### Requirement: HeroBanner renders two CTA buttons with primary and secondary variants
The `hero-banner` SHALL render one `<a>` per element of the `ctas` prop, where the element with `variant: 'primary'` carries the `bg-primary` background token (resolving to `#41B3C4`) and the element with `variant: 'secondary'` carries a white border with no fill, both with uppercase labels. The obsolete utilities `bg-brand-teal` and references to `--color-brand-teal` SHALL NOT appear in any CTA.

#### Scenario: Primary CTA uses bg-primary
- **WHEN** the HeroBanner renders a primary-variant CTA
- **THEN** the `<a>` element carries `bg-primary` (resolving to `#41B3C4`)
- **AND** its class string does NOT contain `bg-brand-teal`

#### Scenario: Secondary CTA keeps white border
- **WHEN** the HeroBanner renders a secondary-variant CTA
- **THEN** the `<a>` element has a white border (`border-2 border-white`) with no fill
- **AND** the CTA is keyboard focusable

### Requirement: HeroBanner uses a CSS-only placeholder background, no external image
The `hero-banner` SHALL render its background using Tailwind CSS utilities only (gradients and overlays), without referencing any external image file, URL, or asset, so the build has zero new external dependencies. The gradient SHALL use the new tokens `from-secondary via-secondary-light to-secondary` (navy gradient) — the obsolete utilities `from-brand-navy`, `via-brand-navy-light`, `to-brand-navy` SHALL NOT appear.

#### Scenario: Gradient uses secondary tokens
- **WHEN** the HeroBanner renders its `<section>` background
- **THEN** the class string contains `from-secondary`, `via-secondary-light`, and `to-secondary`
- **AND** no `brand-navy` substring appears in the rendered HTML of the section
- **AND** no external image URL or asset path is referenced
