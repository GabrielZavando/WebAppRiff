# Spec Delta

## ADDED Requirements

### Requirement: Description limits are defined on visible text

La política compartida de descripciones SHALL fijar `descripcionBreve` como texto plano de máximo 800 caracteres visibles y `descripcionLarga` como HTML saneado de máximo 3000 caracteres visibles. El límite SHALL aplicarse al contenido textual, nunca a la longitud del markup, y los productos existentes SHALL seguir siendo válidos sin migración de datos.

#### Scenario: El catálogo existente cabe en los límites

- **WHEN** se miden los 71 productos del seed después de su normalización
- **THEN** toda `descripcionBreve` tiene 800 caracteres visibles o menos
- **AND** toda `descripcionLarga` tiene 3000 caracteres visibles o menos

#### Scenario: El markup no consume presupuesto

- **WHEN** se mide `descripcionLarga='<p><strong>Hola</strong></p>'`
- **THEN** la longitud considerada es 4 caracteres visibles, no la longitud del string HTML

#### Scenario: Sin migración de datos

- **WHEN** se despliega el cambio
- **THEN** ningún proceso reescribe las descripciones existentes
- **AND** los valores actuales siguen siendo válidos para los nuevos límites
