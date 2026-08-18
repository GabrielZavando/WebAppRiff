## Why

Product descriptions stored in Firestore contain HTML from a WordPress/Divi migration: `descripcionLarga` is HTML by design (rich-text editor), but 12/71 `descripcionBreve` records also carry stray tags, and 2 records of **each** field are double-escaped (`&lt;div&gt;`). The public Astro site renders with escaped interpolation (`{value}`), so tags appear as literal text and `descripcionLarga` is not rendered at all on the detail page. There is no HTML sanitization anywhere, which is an XSS risk the moment we start interpreting the HTML. The symptom reported: "al ser consumidas por el frontend, vienen con etiquetas html que se muestran dentro del texto".

## What Changes

- Backend sanitizes `descripcionLarga` to a safe HTML subset and strips all HTML from `descripcionBreve` on every create/update (write path).
- New shared workspace package `@riff/html-sanitize` centralizes the sanitization policy (allowed tags, attribute stripping, `div→p` transform, entity decode) so backend and frontend apply the **same** rules.
- Public site renders `descripcionLarga` as formatted HTML (Astro `set:html`) inside a styled `.rich-text` container, and guarantees `descripcionBreve` shows as clean plain text.
- One-time Firestore migration normalizes the 71 existing products (fixes double-escaped and stray tags) idempotently.

## Capabilities

### New Capabilities
- `product-description-html`: cross-cutting policy and behavior for sanitizing and rendering product descriptions (shared package, backend write-path, frontend render contract, data migration).

### Modified Capabilities
- `backend-productos`: ADDED requirement — product write endpoints sanitize descriptions before persisting.
- `product-detail-page`: ADDED requirement — detail page renders `descripcionLarga` as sanitized HTML.

## Impact

- **Code**: `apps/backend` (new `IHtmlSanitizer` port + `HtmlSanitizerService` adapter + `ProductoWriteService` wiring), `apps/web` (`toProductDetailModel`, `toProductCardModel`, `[slug].astro`, `globals.css`), new `packages/html-sanitize`.
- **API**: responses for `descripcionLarga` now return a sanitized HTML subset; `descripcionBreve` returns plain text. No structural/schema break, but the *content* of existing responses changes — must be documented in `docs/api-spec.yml`.
- **Deps**: add `sanitize-html` (+`@types/sanitize-html`) and `he` (in the shared package).
- **Data**: Firestore `productos` documents rewritten by the migration (non-destructive, idempotent).
- **Security**: closes the XSS gap introduced by interpreting rich-text HTML.
