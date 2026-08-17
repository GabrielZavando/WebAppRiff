## 1. Types and pure helpers (TDD)

- [x] 1.1 Write `lib/types/__tests__/product-detail-page.test.ts` defining the shape: `ProductDetailPage`, `ProductGalleryModel`, `ProductSpecModel`, `TechnicalDocModel`. Then implement additions to `lib/types/products-page.ts` to satisfy the tests.
- [x] 1.2 Write `lib/products/__tests__/toProductDetailModel.test.ts`: maps a `ProductoApi` to `ProductDetailPage` with resolved category name, gallery items, attributes, and technical doc. Falls back gracefully when fields are empty. THEN implement `lib/products/toProductDetailModel.ts`.

## 2. Build-time data source (TDD)

- [x] 2.1 Write `lib/api/__tests__/products.test.ts` additional tests for `getProductBySlug`: on success returns the product; module cache hits the API exactly once across multiple calls; on non-2xx response returns null; on network error returns null; respects `NESTJS_API_URL` override. THEN implement `getProductBySlug` in `lib/api/products.ts`.

## 3. Presentational components (TDD)

- [x] 3.1 Write `components/__tests__/ProductGallery.test.ts`: renders main image with alt, loading="lazy", decoding="async"; renders thumbnails when galeria has items; renders placeholder when galeria is empty; thumbnails have data attributes for JS interaction. THEN implement `components/ProductGallery.astro`.
- [x] 3.2 Write `components/__tests__/ProductSpecifications.test.ts`: renders heading "ESPECIFICACIONES CLAVE"; renders attribute items with icon and text; hides section when attributes are empty. THEN implement `components/ProductSpecifications.astro`.
- [x] 3.3 Write `components/__tests__/TechnicalDocs.test.ts`: renders download link when fichaTecnica is not null; hides section when fichaTecnica is null; link has correct href and filename. THEN implement `components/TechnicalDocs.astro`.
- [x] 3.4 Write `components/__tests__/IndustrialApplications.test.ts`: renders exactly 3 cards with correct titles and descriptions; renders heading and subtitle. THEN implement `components/IndustrialApplications.astro`.

## 4. Page wiring

- [x] 4.1 Create `pages/productos/[slug].astro` with `getStaticPaths` that fetches all products and returns slugs for published products. Frontmatter fetches single product via `getProductBySlug`, categories via `getCategorias`, and renders Layout with all sections.
- [x] 4.2 Add SEO meta tags (title, description, OG tags, Twitter cards, canonical URL) to the page.
- [x] 4.3 Add 404 handling: when product is null, render not-found message with link back to `/productos`.

## 5. Client-side gallery interaction (progressive enhancement)

- [x] 5.1 Write `lib/products/__tests__/productGalleryClient.test.ts` for the pure helpers (no DOM): compute selected image index from click event. THEN implement `lib/products/productGalleryClient.ts` exporting `initProductGallery()` (DOM glue, not unit-tested) which wires thumbnail click events to update the main image.
- [x] 5.2 Add `data-gallery-index` attributes to thumbnails in `ProductGallery.astro` and a `data-main-image` attribute to the main image element for the runtime to target.
- [x] 5.3 Wire the runtime `<script>` in `pages/productos/[slug].astro` importing `initProductGallery` from `lib/products/productGalleryClient.ts`.

## 6. Icon-catalog and design-token compliance

- [x] 6.1 Run `apps/web/src/styles/__tests__/icon-catalog.test.ts` and the `no-brand-classes.test.ts` audit; both green.
- [x] 6.2 Run a hex-literal grep over the new files → zero matches (no hex literals in components, pages, lib).

## 7. Verification

- [x] 7.1 All Vitest suites green (`npm run test -w apps/web`).
- [x] 7.2 `astro build` succeeds; the generated `apps/web/dist/productos/{slug}/index.html` contains the product info, specifications, industrial applications, technical docs, and gallery for each published product.
- [x] 7.3 `openspec validate product-detail-page` passes.

## 8. Always-visible technical docs CTA (post-apply change, TDD)

- [x] 8.1 Update `components/__tests__/TechnicalDocs.test.ts`: the section is ALWAYS rendered (heading + description present even when `fichaTecnica` is null); when null it renders a CTA "Solicitar ficha técnica" linking to `/contacto` and does NOT render the download link; when present it renders the download link and does NOT render the contact CTA. THEN update `components/TechnicalDocs.astro` to always render the section with conditional inner content (download card vs contact CTA).
