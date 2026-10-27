# hero-banner Specification

## MODIFIED Requirements

### Requirement: HeroBanner integrates into the home page replacing the placeholder content
The home page SHALL render `<HeroBanner {...HERO_BANNER_CONTENT} />` inside its hero shell Layout (see `home-hero-shell`), replacing any pre-existing placeholder `<h1>` or `<p>` from the bootstrap phase.

#### Scenario: Home page renders the HeroBanner with headers above
- **WHEN** a visitor loads `/` (the home page)
- **THEN** the rendered HTML contains a `<section>` (the hero) wrapping the configured headline, subtitle and CTAs
- **AND** the DOM order is: hero shell (with `bg-secondary/80` overlay), `<header>` (from site-header), SearchForm `<div role="search">`, then the hero `<h1>` block
- **AND** no retired top contact bar precedes the header
- **AND** exactly one `<header>` element exists in the document
- **AND** the legacy placeholder text "Proyecto en desarrollo — Fase A: Bootstrap completado" is NOT present
