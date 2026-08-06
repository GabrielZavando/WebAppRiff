# image-assets Specification

## Purpose
TBD - created by archiving change real-site-images. Update Purpose after archive.
## Requirements
### Requirement: Optimizable images live in src/assets/img and are consumed via astro:assets
The `image-assets` SHALL store every optimizable image (hero, logo, y futuras imágenes del sitio) under `apps/web/src/assets/img/`, imported in `.astro` components using the `@` alias (`@/assets/img/<file>`) and rendered with the built-in `astro:assets` components (`<Image>` or `<Picture>` from `astro:assets`). No optimizable image SHALL be placed in `apps/web/public/`.

#### Scenario: Hero image is imported from src/assets/img
- **WHEN** the source of `apps/web/src/components/HeroBanner.astro` is inspected
- **THEN** it contains an `import` statement referencing a path under `@/assets/img/`
- **AND** it uses the `<Picture>` component from `astro:assets` (or `<Image>` for single-variant)
- **AND** the asset is not referenced as a `public/` URL string

#### Scenario: Logo image is imported from src/assets/img
- **WHEN** the source of `apps/web/src/components/Header.astro` is inspected
- **THEN** it contains an `import` statement referencing a path under `@/assets/img/`
- **AND** it renders the logo with the `<Image>` component from `astro:assets`
- **AND** the `src` prop is the imported asset (not a hardcoded `/logos/...` URL)

### Requirement: The Open Graph image is the only public/ asset exception
The `image-assets` SHALL serve the social-card image as a static binary at `apps/web/public/og-image.png` (PNG, 1200×630) with the public URL `/og-image.png`, because social platforms require an absolute, stable URL and PNG format. No other image asset SHALL be added to `apps/web/public/` in this change.

#### Scenario: OG image exists as a public binary
- **WHEN** the filesystem of `apps/web/public/` is inspected
- **THEN** a file named `og-image.png` exists
- **AND** no other image file (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.svg`) is present in `apps/web/public/` besides `og-image.png` and the pre-existing `favicon.svg`

#### Scenario: Layout references the stable OG URL
- **WHEN** `apps/web/src/layouts/Layout.astro` is inspected
- **THEN** the `socialImage` constant resolves to `/og-image.png` (via `new URL('/og-image.png', Astro.site)`)
- **AND** the `og:image` and `twitter:image` meta tags use that URL

### Requirement: The image pipeline depends on sharp
The `image-assets` SHALL declare `sharp` in the `dependencies` of `apps/web/package.json`, because it is the peer service that enables `astro:assets` optimization (AVIF/WebP, responsive `srcset`) during the SSG build. The deprecated `@astrojs/image` package SHALL NOT be added.

#### Scenario: sharp is declared
- **WHEN** `apps/web/package.json` is inspected
- **THEN** its `dependencies` include `sharp`
- **AND** the package does not depend on `@astrojs/image`

### Requirement: Icons are not image assets
The `image-assets` SHALL NOT treat icons as image files: UI icons and brand icons SHALL be consumed exclusively via `astro-icon` (`<Icon name="material-symbols:..." />` for UI, `<Icon name="logos:..." />` for brands), and no icon SVG/PNG SHALL be added under `src/assets/img/`.

#### Scenario: No icon binaries are stored as image assets
- **WHEN** the directory `apps/web/src/assets/img/` is inspected
- **THEN** it contains only the hero and logo binaries
- **AND** no file is added for menu, close, social or contact icons
- **AND** the rendered Header still uses `<Icon name="material-symbols:menu-outline" />` and `<Icon name="material-symbols:close-outline" />`

