# product-description-html Specification

## Purpose
TBD - created by archiving change fix-product-descriptions-html-render. Update Purpose after archive.

## Requirements

### Requirement: Shared HTML sanitization policy
The system SHALL provide a shared sanitization utility (package `@riff/html-sanitize`) exposing `sanitizeRichHtml(dirty: string): string` and `stripHtmlToText(dirty: string): string`, used identically by backend and frontend.

- `sanitizeRichHtml` SHALL return a safe HTML subset: allow only the tags `p, br, strong, b, em, i, u, ul, ol, li, a, blockquote, h2, h3, h4`; strip all attributes except `a[href, target, rel]`; force `rel="noopener noreferrer"` on every link; transform `div` elements to `p`; remove `script`, `iframe`, `object`, `style` elements and all `on*` event handlers; and decode HTML entities (e.g. `&lt;` → `<`) before sanitizing so double-escaped content renders correctly.
- `stripHtmlToText` SHALL remove all tags, decode HTML entities, collapse runs of whitespace to a single space, and trim the result.

#### Scenario: Sanitize preserves safe formatting
- **WHEN** `sanitizeRichHtml('<p>Ventajas<br><strong>OK</strong></p><ul><li>a</li></ul>')` is called
- **THEN** the returned string contains `<p>`, `<br>`, `<strong>` and `<ul>/<li>` and no other tags

#### Scenario: Sanitize strips dangerous content
- **WHEN** `sanitizeRichHtml('<p>x</p><script>alert(1)</script><iframe src="y"></iframe><a href="z" onclick="evil()">l</a>')` is called
- **THEN** the returned string contains no `<script>`, no `<iframe>`, no `onclick` attribute, and the link keeps only `href`

#### Scenario: Sanitize forces safe rel on links
- **WHEN** `sanitizeRichHtml('<a href="https://e.com" target="_blank">ext</a>')` is called
- **THEN** the returned `<a>` element includes `rel="noopener noreferrer"`

#### Scenario: Sanitize decodes double-escaped HTML
- **WHEN** `sanitizeRichHtml('&lt;p&gt;Hola&lt;/p&gt;')` is called
- **THEN** the returned string equals `<p>Hola</p>` (real tags, not entities)

#### Scenario: Sanitize strips Divi markup
- **WHEN** `sanitizeRichHtml('<div class="et_pb_module" style="color:red">Texto</div>')` is called
- **THEN** the returned string contains a `<p>` element, contains `Texto`, and contains no `class` attribute and no `style` attribute

#### Scenario: Strip removes all tags
- **WHEN** `stripHtmlToText('<p>Hola <strong>mundo</strong><br>fin</p>')` is called
- **THEN** the returned string equals `Hola mundo fin`

#### Scenario: Strip decodes and collapses whitespace
- **WHEN** `stripHtmlToText('  &lt;p&gt;  Texto   con   espacios  &lt;/p&gt;  ')` is called
- **THEN** the returned string equals `Texto con espacios`

### Requirement: Data migration SHALL normalize existing products
A CLI migration SHALL normalize all `productos` documents: `descripcionLarga` via `sanitizeRichHtml`, `descripcionBreve` via `stripHtmlToText`, idempotently, with a `--dry-run` preview mode.

#### Scenario: Dry-run reports without writing
- **WHEN** `migrate:descriptions --dry-run` runs against the 71 seeded products
- **THEN** it reports how many documents would change and writes nothing

#### Scenario: Run normalizes double-escaped records
- **WHEN** `migrate:descriptions` runs and 2 `descripcionLarga` records are double-escaped
- **THEN** those records are stored as decoded, sanitized HTML and a second run changes nothing (idempotent)
