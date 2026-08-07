# home-hero-shell Specification

## Purpose
Shell hero del Layout de la home (`Layout.astro` en modo `hero`): imagen de fondo full-bleed + overlay `bg-secondary/80` que cubren todo el viewport, con TopHeader/Header/SearchForm transparentes sobre la imagen y el contenido de la página en el slot. Resto de páginas sin modo hero conservan el layout sólido previo.

## Requirements
### Requirement: The home Layout provides a full-viewport hero shell with the background image and overlay
The Layout used by the home page (mode `hero`) SHALL render a wrapper container spanning at least the full viewport height (`min-h-screen`) with `overflow-x-hidden` (horizontal clip only). The SHALL NOT use `overflow-hidden` (both axes) on the wrapper or `<body>` because it disables vertical viewport scrolling, clipping the page content below the fold (e.g. `PanelHome`). The first child SHALL be the imported background image rendered as a full-bleed element (`absolute inset-0 h-full w-full object-cover`) via `astro:assets` `<Picture>` (with AVIF/WebP source variants); the second child SHALL be a full-bleed decorative overlay `<div>` carrying `class="absolute inset-0 bg-secondary/80"` (the `--color-secondary` token #1F2D40 at 0.8 opacity) and `aria-hidden="true"`. A wrapper with `relative z-10` SHALL then contain, in DOM order, `TopHeader`, `Header`, `SearchForm` and the page slot. The `bg-secondary/80` overlay SHALL NOT be `bg-secondary/60` nor any `bg-black/*`.

#### Scenario: Shell covers full viewport, hosts the overlay and keeps vertical scroll enabled
- **WHEN** the home page renders with the hero shell
- **THEN** the first container carries `min-h-screen` and `overflow-x-hidden`
- **AND** the rendered HTML does NOT contain `overflow-hidden` (which would disable vertical scrolling of the page)
- **AND** the rendered HTML contains a `<picture>` element with `<source>` variants including `image/avif` and `image/webp`
- **AND** it contains `class="absolute inset-0 bg-secondary/80"` on a `<div>` with `aria-hidden="true"`
- **AND** the overlay class does NOT contain `bg-secondary/60` nor any `bg-black/`

#### Scenario: The three header components are inside the z-10 stack
- **WHEN** the home page renders
- **THEN** the `relative z-10` wrapper contains in order: `<div role="region" aria-label="Barra de contacto">`, `<header>`, `<div role="search">`, then the hero slot
- **AND** exactly one `<header>` element exists in the document

### Requirement: The home page uses the hero shell and transparent header modes
`apps/web/src/pages/index.astro` SHALL render its Layout in `hero` mode and SHALL pass `transparent: true` to `TopHeader`, `Header` and `SearchForm` so the background image is visible behind them.

#### Scenario: Home passes transparent to headers
- **WHEN** the home page renders
- **THEN** the rendered HTML has exactly one `bg-secondary/80` full-bleed overlay matching the shell rule
- **AND** the header/nav/search classes contain `bg-transparent`
- **AND** the hero `<section>` from HeroBanner does NOT contain a `<picture>`
- **AND** the legacy placeholder "Proyecto en desarrollo — Fase A: Bootstrap completado" is NOT present
