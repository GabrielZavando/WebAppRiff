# Spec Delta

## MODIFIED Requirements

### Requirement: Technical documentation section

The page SHALL render a `TechnicalDocs` component with a "Documentación Técnica" section. The section is ALWAYS rendered — it MUST be visible even when the product has no downloadable document (development-stage preference). The section SHALL show:
- A heading "Documentación Técnica"
- A description paragraph
- Conditional content on the right side:
  - If `fichaTecnica` is not null: a download link labeled "Descargar ficha técnica" for the product's technical sheet PDF, with the `download` attribute
  - If `fichaTecnica` is null: a CTA "Solicitar ficha técnica" linking to `/contacto`

The download link SHALL include the filename and a download icon. The CTA SHALL link to `/contacto` and MUST NOT be rendered when a download link is shown. The section SHALL have a primary-colored background with white text.

#### Scenario: Product with technical sheet
- **WHEN** the product has `fichaTecnica={url:"https://...", nombreArchivo:"catalogo.pdf"}`
- **THEN** a download link is rendered with text "Descargar ficha técnica" and filename "catalogo.pdf"
- **AND** the link includes the `download` attribute and a download icon
- **AND** no "Solicitar ficha técnica" CTA linking to `/contacto` is rendered

#### Scenario: Product without technical sheet
- **WHEN** the product has `fichaTecnica=null`
- **THEN** the "Documentación Técnica" section is still rendered
- **AND** a CTA "Solicitar ficha técnica" linking to `/contacto` is rendered
- **AND** no download link is rendered

## ADDED Requirements

### Requirement: Long description containment

The rich-text long description rendered with `set:html` SHALL stay inside the content column at every viewport width and MUST NOT create horizontal page overflow. The container SHALL constrain its width to the grid (`max-w-full`, `min-w-0`) and wrap unbroken tokens (`break-words` / `overflow-wrap`). Default Quill block margins and paddings (`p`, `ul`, `ol`, `li`, `blockquote`, headings) MUST NOT introduce fixed widths.

#### Scenario: Long unbroken token wraps within the column
- **WHEN** the sanitized long description contains a long word, URL, or Quill-generated block with content wider than the column
- **THEN** the text wraps inside the description container
- **AND** the page does not gain horizontal scrolling at mobile, tablet, or desktop widths

#### Scenario: Lists and headings remain bounded
- **WHEN** the long description contains Quill lists, headings, or blockquotes
- **THEN** their margins and paddings stay within the description container's width
