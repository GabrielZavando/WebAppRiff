## MODIFIED Requirements

### Requirement: Product info section

The page SHALL render the product information in this exact vertical order:
1. **Category chip** with the product's category name resolved server-side
2. **Title** (`titulo`) as an `<h1>` heading
3. **Short description** (`descripcionBreve`) as a paragraph
4. **Specifications box** with the product's `atributos` displayed as a grid of icon+label pairs
5. **CTA row** with two buttons:
   - "SOLICITAR COTIZACIÓN" → `/cotizacion?producto={slug}` (primary visual treatment)
   - "CONTACTAR ASESOR" → `mailto:contacto@somosriff.cl` (secondary visual treatment)

The category chip SHALL be omitted when the category is not found (e.g., `sin-categoria`).

(MODIFIED in `web-home-contact-tweaks`: the "CONTACTAR ASESOR" mailto target changes from `mailto:contacto@riff.cl` to `mailto:contacto@somosriff.cl`.)

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

#### Scenario: Contact advisor CTA uses the somosriff.cl mailto
- **WHEN** the product detail page renders with a product
- **THEN** the rendered HTML contains an anchor with `href="mailto:contacto@somosriff.cl"` for the "CONTACTAR ASESOR" CTA
- **AND** the rendered HTML does NOT contain `mailto:contacto@riff.cl`