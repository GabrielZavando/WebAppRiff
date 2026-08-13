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
The `image-assets` SHALL serve the social-card image as a static binary at `apps/web/public/og-image.png` (PNG, 1200×630) with the public URL `/og-image.png`, because social platforms require an absolute, stable URL and PNG format. In addition, the `image-assets` SHALL serve the site favicon as a static binary in `apps/web/public/`, referenced by the site `<head>` via an explicit `<link rel="icon">` tag (Astro 7 does not auto-inject custom-named favicons); the favicon is a documented second exception (favicon binaries are served directly from the site root by browsers and do not benefit from the `astro:assets` pipeline). No other image asset SHALL be added to `apps/web/public/`. (MODIFIED in `site-favicon-and-bg-swap`: this supersedes the stricter "only public/ asset exception" wording of the archived `real-site-images` spec — the favicon is now the documented second exception alongside `og-image.png`.)

#### Scenario: OG image exists as a public binary
- **WHEN** the filesystem of `apps/web/public/` is inspected
- **THEN** a file named `og-image.png` exists
- **AND** at most one favicon binary file exists in `apps/web/public/` (either the pre-existing `favicon.svg` placeholder or the client-delivered `logo_riff.png` — both may coexist; the explicit `<link rel="icon">` tag in the layout has priority over the SVG placeholder)
- **AND** no other image file (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.svg`) is present in `apps/web/public/` besides the documented exceptions above

#### Scenario: Layout declares the favicon with an explicit link tag
- **WHEN** `apps/web/src/layouts/Layout.astro` is inspected
- **THEN** its `<head>` contains at least one `<link rel="icon" ...>` element with an `href` that resolves to a file under `apps/web/public/` (e.g. `/logo_riff.png`)
- **AND** the `og:image` and `twitter:image` meta tags still resolve to `/og-image.png` (the social card behavior is unchanged)

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

