## ADDED Requirements

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
