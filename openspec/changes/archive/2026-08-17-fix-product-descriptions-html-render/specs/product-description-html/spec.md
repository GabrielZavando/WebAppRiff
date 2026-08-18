## ADDED Requirements

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

### Requirement: Backend SHALL sanitize descriptions on write
The backend product write path (create and update) SHALL apply `sanitizeRichHtml` to `descripcionLarga` and `stripHtmlToText` to `descripcionBreve` before persisting, through an injected `IHtmlSanitizer` port (Dependency Inversion).

#### Scenario: Create sanitizes descriptions
- **WHEN** a superadmin/admin creates a product with `descripcionLarga='<p>OK</p><script>x</script>'` and `descripcionBreve='<b>corto</b>'`
- **THEN** the persisted and returned product has `descripcionLarga='<p>OK</p>'` and `descripcionBreve='corto'`

#### Scenario: Update sanitizes descriptions
- **WHEN** an editor updates a product's `descripcionLarga='<div>New</div>'` and `descripcionBreve='<i>txt</i>'`
- **THEN** the persisted product has `descripcionLarga='<p>New</p>'` and `descripcionBreve='txt'`

#### Scenario: Write normalizes double-escaped data
- **WHEN** a product is created/updated with `descripcionLarga='&lt;p&gt;Hola&lt;/p&gt;'`
- **THEN** the stored value is the decoded `<p>Hola</p>`

### Requirement: Frontend SHALL render descriptions correctly
The public site SHALL render `descripcionLarga` as sanitized HTML (via `set:html`) and SHALL render `descripcionBreve` as plain text.

#### Scenario: Detail page renders descripcionLarga as HTML not literal text
- **WHEN** a product detail page is built with `descripcionLarga='<p>Texto <strong>negrita</strong></p>'`
- **THEN** the rendered output contains a real `<p>` element wrapping `Texto` and a real `<strong>` element (not `&lt;p&gt;` or `&lt;strong&gt;`)

#### Scenario: No dangerous or Divi markup survives render
- **WHEN** `descripcionLarga` contains `<script>`, `onerror`, or `class="et_pb_*"`
- **THEN** the rendered HTML contains none of those

#### Scenario: Card and meta show plain-text descripcionBreve
- **WHEN** `descripcionBreve='<b>corto</b>'` is rendered in a product card and used as meta description
- **THEN** the visible text and meta content are `corto` with no tags

### Requirement: Data migration SHALL normalize existing products
A CLI migration SHALL normalize all `productos` documents: `descripcionLarga` via `sanitizeRichHtml`, `descripcionBreve` via `stripHtmlToText`, idempotently, with a `--dry-run` preview mode.

#### Scenario: Dry-run reports without writing
- **WHEN** `migrate:descriptions --dry-run` runs against the 71 seeded products
- **THEN** it reports how many documents would change and writes nothing

#### Scenario: Run normalizes double-escaped records
- **WHEN** `migrate:descriptions` runs and 2 `descripcionLarga` records are double-escaped
- **THEN** those records are stored as decoded, sanitized HTML and a second run changes nothing (idempotent)
