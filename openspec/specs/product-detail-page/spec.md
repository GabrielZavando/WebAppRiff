# product-detail-page Specification

## Purpose

Define the product detail page at `/productos/[slug]` of the Riff Astro SSG site: build-time data sourcing (single product + categories baked into the static page), the image gallery with thumbnail selector, the specifications section, the static industrial applications section, the technical documentation section, and the CTA buttons. The page SHALL work without JavaScript (progressive enhancement) showing the first image and no gallery interaction.

## ADDED Requirements

### Requirement: Build-time data sourcing for single product

The page SHALL obtain a single product at build time by calling `GET /api/v1/products/slug/:slug` through `apps/web/src/lib/api/products.ts`. The function `getProductBySlug(slug)` SHALL cache the result at module scope (one fetch per build) and SHALL return `null` on any fetch or parse error so that `astro build` never fails.

#### Scenario: Product fetched and cached per build
- **WHEN** `astro build` runs and `pages/productos/[slug].astro` is rendered for slug `flujometro-universal`
- **THEN** exactly one HTTP `GET` is made to `${NESTJS_API_URL}/products/slug/flujometro-universal`
- **AND** the returned product data is passed to the page frontmatter

#### Scenario: API unreachable at build time
- **WHEN** `GET /api/v1/products/slug/:slug` returns a non-2xx response or the network request throws
- **THEN** `getProductBySlug(slug)` resolves to `null`
- **AND** `console.warn` is emitted
- **AND** `astro build` exits successfully (the page is not generated or shows a fallback)

#### Scenario: Product not found
- **WHEN** `GET /api/v1/products/slug/:slug` returns 404
- **THEN** `getProductBySlug(slug)` resolves to `null`
- **AND** the page is not generated (returns 404 at runtime)

### Requirement: Static path generation with getStaticPaths

The page SHALL use `getStaticPaths` to generate static pages for every published product. The function SHALL fetch all products via `getPublicProducts()`, filter by `publicado: true`, and return an array of `{ params: { slug } }` objects.

#### Scenario: All published products get static pages
- **WHEN** `astro build` runs with 71 published products
- **THEN** 71 static HTML files are generated under `dist/productos/{slug}/index.html`

#### Scenario: Unpublished products are excluded
- **WHEN** a product has `publicado: false`
- **THEN** no static page is generated for that product's slug

### Requirement: Product detail page layout (mobile-first, user-defined)

The page SHALL render a `<Layout>` with the product title and description as meta tags. The main content SHALL be structured in three sections:

1. **Hero Section**: Image gallery + product info (category, title, description, specifications, CTAs)
2. **Industrial Applications Section**: Static marketing content (3 cards)
3. **Technical Documentation Section**: Downloadable PDFs (if available)

The layout SHALL be mobile-first: single column on mobile, two-column grid on `md+` for the hero section.

#### Scenario: Mobile layout
- **WHEN** the viewport is `<768px`
- **THEN** the hero section renders image gallery on top, product info below (single column)
- **AND** the industrial applications section renders cards in a single column

#### Scenario: Desktop layout
- **WHEN** the viewport is `≥768px`
- **THEN** the hero section renders image gallery on the left, product info on the right (two-column grid)
- **AND** the industrial applications section renders cards in a 3-column grid

### Requirement: Image gallery with thumbnail selector

The page SHALL render an `ProductGallery` component that displays:
- A main image area showing the currently selected image
- A row of thumbnail images below the main image
- Clicking a thumbnail SHALL update the main image (client-side, no full navigation)
- The first image from `galeria` SHALL be the default selected image
- When `galeria` is empty, a placeholder icon SHALL be rendered

The gallery SHALL work without JavaScript: only the first image is shown, thumbnails are not interactive.

#### Scenario: Product with multiple images
- **WHEN** the product has `galeria` with 4 images
- **THEN** the main image area shows the first image
- **AND** 4 thumbnail images are rendered below
- **AND** clicking a thumbnail updates the main image (with JS enabled)

#### Scenario: Product with no images
- **WHEN** the product has an empty `galeria` array
- **THEN** a placeholder icon is rendered in the main image area
- **AND** no thumbnails are rendered

#### Scenario: No JavaScript fallback
- **WHEN** JavaScript is disabled
- **THEN** only the first image is visible
- **AND** thumbnails are rendered but not interactive

### Requirement: Product info section

The page SHALL render the product information in this exact vertical order:
1. **Category chip** with the product's category name resolved server-side
2. **Title** (`titulo`) as an `<h1>` heading
3. **Short description** (`descripcionBreve`) as a paragraph
4. **Specifications box** with the product's `atributos` displayed as a grid of icon+label pairs
5. **CTA row** with two buttons:
   - "SOLICITAR COTIZACIÓN" → `/cotizacion?producto={slug}` (primary visual treatment)
   - "CONTACTAR ASESOR" → `mailto:contacto@riff.cl` (secondary visual treatment)

The category chip SHALL be omitted when the category is not found (e.g., `sin-categoria`).

#### Scenario: Full product info
- **WHEN** the product has `titulo="Medidor Ultrasónico"`, `categoriaId="cat-fluidos"`, `descripcionBreve="..."`, and `atributos=[{nombre:"Precisión", valor:"±2%"}]`
- **THEN** the rendered HTML contains:
  1. The category chip text "MEDICIÓN DE FLUIDOS"
  2. An `<h1>` with "Medidor Ultrasónico"
  3. The short description paragraph
  4. A specifications box with "Precisión: ±2%"
  5. Two CTA buttons with correct hrefs

#### Scenario: Category not found
- **WHEN** the product has `categoriaId="sin-categoria"` and the categories list does not contain it
- **THEN** the category chip is omitted
- **AND** the rest of the info renders normally

### Requirement: Specifications box with attributes

The page SHALL render a `ProductSpecifications` component that displays the product's `atributos` array as a grid of specification items. Each item SHALL show an icon (from Lucide set) and the attribute name + value.

The specifications box SHALL have a heading "ESPECIFICACIONES CLAVE" in uppercase with primary color.

#### Scenario: Product with attributes
- **WHEN** the product has `atributos=[{nombre:"Precisión", valor:"±2%"}, {nombre:"Rango", valor:"0.1 a 9 m/s"}]`
- **THEN** the specifications box renders two items with icons and text

#### Scenario: Product without attributes
- **WHEN** the product has an empty `atributos` array
- **THEN** the specifications box is not rendered

### Requirement: Industrial applications section (static)

The page SHALL render an `IndustrialApplications` component that displays three static marketing cards:
1. **Minería**: "Medición de pulpas, lodos y relaves mineros altamente abrasivos sin desgaste del sensor."
2. **Tratamiento de Aguas**: "Control de lodos activados, aguas residuales crudas y efluentes industriales complejos."
3. **Química y Celulosa**: "Monitoreo de pastas, suspensiones químicas y líquidos corrosivos en tuberías cerradas."

Each card SHALL have an icon, title, and description. The section SHALL have a heading "Aplicaciones Industriales" and a subtitle.

#### Scenario: Static content renders
- **WHEN** the page loads
- **THEN** the industrial applications section renders with exactly 3 cards
- **AND** each card has an icon, title, and description matching the static content

### Requirement: Technical documentation section

The page SHALL render a `TechnicalDocs` component with a "Documentación Técnica" section. The section is ALWAYS rendered — it MUST be visible even when the product has no downloadable document (development-stage preference). The section SHALL show:
- A heading "Documentación Técnica"
- A description paragraph
- Conditional content on the right side:
  - If `fichaTecnica` is not null: a download link for the product's technical sheet PDF
  - If `fichaTecnica` is null: a CTA "Solicitar ficha técnica" linking to `/contacto`

The download link SHALL include the filename and a download icon. The CTA SHALL link to `/contacto` and MUST NOT be rendered when a download link is shown. The section SHALL have a primary-colored background with white text.

#### Scenario: Product with technical sheet
- **WHEN** the product has `fichaTecnica={url:"https://...", nombreArchivo:"catalogo.pdf"}`
- **THEN** a download link is rendered with text "CATÁLOGO TÉCNICO" and filename "catalogo.pdf"
- **AND** no "Solicitar ficha técnica" CTA linking to `/contacto` is rendered

#### Scenario: Product without technical sheet
- **WHEN** the product has `fichaTecnica=null`
- **THEN** the "Documentación Técnica" section is still rendered
- **AND** a CTA "Solicitar ficha técnica" linking to `/contacto` is rendered
- **AND** no download link is rendered

### Requirement: SEO meta tags

The page SHALL include proper SEO meta tags:
- `<title>` with format `{titulo} — Riff`
- `<meta name="description">` with the product's `descripcionBreve`
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`)
- Twitter card tags
- Canonical URL

#### Scenario: Meta tags present
- **WHEN** the page renders for a product with `titulo="Medidor Ultrasónico"`
- **THEN** the `<title>` tag contains "Medidor Ultrasónico — Riff"
- **AND** the `<meta name="description">` contains the short description
- **AND** Open Graph tags are present

### Requirement: Design-token compliance

All new `.astro` and `.ts` files SHALL:
- Use only Tailwind utilities generated from the project's `@theme {}` tokens (no raw hex literals).
- Avoid the `rounded*` utilities (`--radius: 0`, flat design).
- Avoid the obsolete `brand-*` utilities.
- Use icons exclusively from the Lucide set via `astro-icon`.

#### Scenario: Hex-literal grep passes
- **WHEN** a regex `#[0-9A-Fa-f]{6}` is run over the new files (excluding tests and snapshots)
- **THEN** the result SHALL be empty

#### Scenario: Icon set compliance
- **WHEN** a grep for `material-symbols:` or `logos:` is run over the new files
- **THEN** the result SHALL be empty (only `lucide:*` is allowed)

### Requirement: No client-side JavaScript required

The page SHALL work with JavaScript disabled: the product info, specifications, industrial applications, and technical documentation sections SHALL render correctly without JS. Only the image gallery interaction (thumbnail clicking) requires JS.

#### Scenario: No-JS rendering
- **WHEN** JavaScript is disabled and the user navigates to `/productos/{slug}`
- **THEN** the product info, specifications, industrial applications, and technical documentation sections render correctly
- **AND** only the first image is visible in the gallery (thumbnails not interactive)

### Requirement: 404 handling for non-existent products

When a product slug does not match any published product, the page SHALL return a 404 status code and render a not-found message.

#### Scenario: Invalid slug
- **WHEN** the user navigates to `/productos/non-existent-product`
- **THEN** the page returns a 404 status
- **AND** renders a "Producto no encontrado" message with a link back to `/productos`

### Requirement: Product detail page SHALL render descripcionLarga as sanitized HTML
The product detail page (`/productos/[slug].astro`) SHALL render `descripcionLarga` as formatted, sanitized HTML (via Astro `set:html`) inside a `.rich-text` styled container, and SHALL continue to render `descripcionBreve` as clean plain text.

#### Scenario: Detail page renders descripcionLarga as HTML not literal text
- **WHEN** a product detail page is built with `descripcionLarga='<p>Texto <strong>negrita</strong></p>'`
- **THEN** the rendered output contains a real `<p>` element wrapping `Texto` and a real `<strong>` element (not `&lt;p&gt;` or `&lt;strong&gt;`)

#### Scenario: No dangerous or Divi markup survives render
- **WHEN** `descripcionLarga` contains `<script>`, `onerror`, or `class="et_pb_*"`
- **THEN** the rendered HTML contains none of those

#### Scenario: Meta description stays plain text
- **WHEN** `descripcionBreve='<b>corto</b>'` is used as the page meta description
- **THEN** the meta content is `corto` with no tags
