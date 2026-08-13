## MODIFIED Requirements

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
