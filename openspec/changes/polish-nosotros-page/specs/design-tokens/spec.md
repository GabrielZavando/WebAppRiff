# design-tokens Specification (delta)

## MODIFIED Requirements

### Requirement: Neutros — 6 tokens para texto, bordes y fondos

El `globals.css` SHALL declarar 7 tokens neutros:

| Token CSS | HEX | Uso semántico |
|---|---|---|
| `--color-text` | `#1F2D40` | texto base (sinónimo intencional de `--color-secondary`) |
| `--color-text-2` | `#5C6675` | texto secundario |
| `--color-muted` | `#98A1AC` | texto terciario / placeholder |
| `--color-border` | `#E3E8ED` | border base 1px de paneles |
| `--color-bg` | `#F6F8FA` | fondo de sección / página |
| `--color-surface-muted` | `#E9EEF3` | fondo de superficie con contraste visible frente a tarjetas blancas |
| `--color-white` | `#FFFFFF` | superficie sobre fondo |

#### Scenario: Tokens neutros presentes en globals.css

- **WHEN** se parsea el `@theme {}` de `apps/web/src/styles/globals.css`
- **THEN** contiene las 7 declaraciones listadas (`--color-text`, `--color-text-2`, `--color-muted`, `--color-border`, `--color-bg`, `--color-surface-muted`, `--color-white`)
- **AND** los valores hex coinciden con los de la tabla

#### Scenario: Utilidad text-muted disponible en componentes

- **WHEN** un componente aplica `text-muted`
- **THEN** el color computado resuelve a `#98A1AC`

#### Scenario: Utilidad bg-surface-muted disponible en componentes

- **WHEN** un componente aplica `bg-surface-muted`
- **THEN** el color de fondo computado resuelve a `#E9EEF3`
