## ADDED Requirements

### Requirement: Backend SHALL sanitize product descriptions on write
The product create and update endpoints SHALL sanitize `descripcionLarga` to a safe HTML subset (via `sanitizeRichHtml`) and strip all HTML from `descripcionBreve` (via `stripHtmlToText`) before persisting, using the shared `@riff/html-sanitize` policy through an injected `IHtmlSanitizer` port.

#### Scenario: Create sanitizes descriptions
- **WHEN** a superadmin/admin creates a product with `descripcionLarga='<p>OK</p><script>x</script>'` and `descripcionBreve='<b>corto</b>'`
- **THEN** the persisted and returned product has `descripcionLarga='<p>OK</p>'` and `descripcionBreve='corto'`

#### Scenario: Update sanitizes descriptions
- **WHEN** an editor updates a product's `descripcionLarga='<div>New</div>'` and `descripcionBreve='<i>txt</i>'`
- **THEN** the persisted product has `descripcionLarga='<p>New</p>'` and `descripcionBreve='txt'`

#### Scenario: Write normalizes double-escaped data
- **WHEN** a product is created/updated with `descripcionLarga='&lt;p&gt;Hola&lt;/p&gt;'`
- **THEN** the stored value is the decoded `<p>Hola</p>`
