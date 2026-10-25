# Spec Delta

## ADDED Requirements

### Requirement: Backend SHALL enforce product description length limits

Los endpoints de creación y actualización SHALL rechazar descripciones que superen los límites de texto visible: 800 caracteres para `descripcionBreve` y 3000 para `descripcionLarga`. La longitud SHALL medirse después de la sanitización o normalización, de modo que el markup, los atributos y el contenido no textual no consuman el límite. El rechazo SHALL responder `400` con un mensaje específico del campo.

#### Scenario: Aceptar descripción breve en el límite

- **WHEN** se crea o actualiza un producto con `descripcionBreve` de exactamente 800 caracteres visibles
- **THEN** la operación persiste y responde `201` (creación) o `200` (actualización)

#### Scenario: Rechazar descripción breve sobre el límite

- **WHEN** se crea o actualiza un producto con `descripcionBreve` de 801 caracteres visibles
- **THEN** la API responde `400` con un mensaje que indica el límite de `descripcionBreve`
- **AND** el producto no se persiste

#### Scenario: La descripción larga cuenta solo texto visible

- **WHEN** `descripcionLarga` contiene markup HTML con exactamente 3000 caracteres visibles y su longitud cruda supera 3000
- **THEN** la operación se acepta y persiste el HTML sanitizado
- **AND** cuando contiene 3001 caracteres visibles, la API responde `400` y no persiste

#### Scenario: El contenido eliminado no consume el límite

- **WHEN** `descripcionLarga` incluye un bloque `script` o `style` de gran tamaño junto a texto válido
- **THEN** el contenido eliminado por la sanitización no cuenta para el límite de 3000
- **AND** solo el texto visible resultante determina la aceptación
